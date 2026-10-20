<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;
use WP_Rplg_Google_Reviews\Includes\Core\Google_Dao;
use WP_Rplg_Google_Reviews\Includes\Core\Place_Settings;

// The server half of admin-steps.js, shared by the theme and badge parts of the Create Widget page: places, connections, saving.
abstract class Plugin_Step_Page {

    protected $dao;
    protected $core;
    protected $places;
    protected $feed_serializer;
    protected $feed_deserializer;

    public function __construct(Google_Dao $dao, Core $core, Plugin_Places $places, Feed_Serializer $feed_serializer, Feed_Deserializer $feed_deserializer) {
        $this->dao               = $dao;
        $this->core              = $core;
        $this->places            = $places;
        $this->feed_serializer   = $feed_serializer;
        $this->feed_deserializer = $feed_deserializer;
    }

    protected function feed() {
        $feed_id = isset($_GET['grw_feed_id']) ? (int) $_GET['grw_feed_id'] : 0;
        return $feed_id ? $this->feed_deserializer->get_feed($feed_id) : null;
    }

    // What every step page passes to grw_steps(); $extra adds the page's own.
    protected function page_vars($feed, $extra = array()) {
        $content = $feed ? json_decode($feed->post_content) : null;

        $places = array();
        foreach ($this->dao->get_places() as $place) {
            $places[] = array(
                'id'      => $place->place_id,
                'name'    => $place->name,
                'address' => (string) $place->address,
                'photo'   => Place_Settings::photo($place),
                'rating'  => $place->rating > 0 ? number_format((float) $place->rating, 1, '.', '') : '',
                'total'   => $place->review_count > 0 ? (int) $place->review_count : 0,
                'lang'    => $this->dao->place_lang($place),
            );
        }

        // A tile is a (place, language) pair: one place in two languages is two connections with the same id.
        $selected = array();
        if ($content && !empty($content->connections)) {
            foreach ($content->connections as $conn) {
                if (empty($conn->id)) continue;
                $selected[] = array('id' => $conn->id, 'lang' => empty($conn->lang) ? '' : $conn->lang);
            }
        } else if (!$feed && !empty($_GET['grw_place_id'])) {
            $place = $this->dao->get_place(sanitize_text_field(wp_unslash($_GET['grw_place_id'])));
            if ($place) {
                $selected[] = array('id' => $place->place_id, 'lang' => $this->dao->place_lang($place));
            }
        }

        return array_merge(array(
            'places'   => $places,
            'defaults' => Core::get_default_options(),
            'selected' => $selected,
            'options'  => $content && isset($content->options) ? $content->options : new \stdClass(),
            'feedId'   => $feed ? $feed->ID : 0,
            'title'    => $feed ? $feed->post_title : '',
            'page'     => $feed ? self::page_of($feed->ID) : null,
            // What the Publish step offers: the block way where the block editor edits pages or posts, the Site Editor on a block theme, else a widget area.
            'editor'   => array('block' => use_block_editor_for_post_type('page') || use_block_editor_for_post_type('post'), 'blockTheme' => wp_is_block_theme(), 'widgets' => current_theme_supports('widgets')),
            'hasKey'   => !empty(get_option('grw_google_api_key')),
            'authcode' => (string) get_option('grw_auth_code'),
            'lang'     => strtolower(explode('_', get_locale())[0]),
            'nonce'    => wp_create_nonce('grw_wpnonce'),
            'widgets'  => admin_url('edit.php?post_type=' . Post_Types::FEED_POST_TYPE),
            'home'     => home_url('/'),
            'blank'    => GRW_GOOGLE_BIZ,
            'connect'  => apply_filters('grw_connect_url', 'https://app.richplugins.com/public/connect'),
        ), $extra);
    }

    protected function render_page($id, $class, $vars, $first) {
        wp_nonce_field('grw_wpnonce', 'grw_nonce');
        ?>
        <div id="<?php echo esc_attr($id); ?>" class="grw-badge-page <?php echo esc_attr($class); ?>" data-vars="<?php echo esc_attr(wp_json_encode($vars)); ?>">
            <ol class="grw-badge-steps">
                <li data-step="1" class="grw-badge-step-on"><span>1</span><?php echo esc_html($first); ?></li>
                <li data-step="2"><span>2</span>Set up</li>
                <li data-step="3"><span>3</span>Publish</li>
            </ol>
            <div class="grw-badge-body"></div>
        </div>

        <?php if (!get_option('grw_rate_us') && current_user_can('manage_options')) { ?>
        <div id="grw-rate_us-wrap">
            <div id="grw-rate_us">
                <div class="grw-rate_us-content">
                    <button type="button" class="grw-rate_us-close" aria-label="Close">&times;</button>
                    <div class="grw-rate_us-head">
                        How's RichPlugins so far?
                    </div>
                    <div class="grw-rate_us-body">
                        Rate us clicking on the stars:
                        <span class="rpi-star" data-rating="5" style="--rpi-star-size:26px;--gap:0"><i></i><i></i><i></i><i></i><i></i></span>
                    </div>
                </div>
            </div>
        </div>
        <?php } ?>

        <div id="grw-rate_us-feedback" title="Thanks for your feedback!" style="display:none;">
            <b>Please tell us how we can improve the plugin.</b>
            <p>
                <span class="rpi-star" data-rating="5" style="--rpi-star-size:26px;--gap:0"><i></i><i></i><i></i><i></i><i></i></span>
            </p>
            <p style="font-size:16px;">
                <input type="text" value="<?php global $current_user; echo esc_attr($current_user->user_email); ?>" placeholder="Contact email"/>
            </p>
            <p style="font-size:16px;">
                <textarea autofocus placeholder="Describe your experience and how we can improve that"></textarea>
            </p>
            <button class="grw-rate_us-cancel">Cancel</button><button  class="grw-rate_us-send">Send</button>
        </div>
        <?php
    }

    protected function pids() {
        return isset($_POST['pids']) && is_array($_POST['pids']) ? array_map('sanitize_text_field', wp_unslash($_POST['pids'])) : array();
    }

    protected static function block($feed_id) {
        return '<!-- wp:widget-google-reviews/reviews {"id":"' . (int) $feed_id . '"} /-->';
    }

    // The page holding the widget (its block or shortcode), a live one first: title, links and whether it is live; null when there is none.
    // The block is matched up to its id: the editor appends its own attributes (className, lock, metadata) after it.
    protected static function page_of($feed_id) {
        global $wpdb;
        $page = $wpdb->get_row($wpdb->prepare(
            "SELECT ID, post_status, post_title FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status NOT IN ('trash', 'auto-draft') AND (post_content LIKE %s OR post_content LIKE %s) ORDER BY post_status IN ('publish', 'private') DESC, ID DESC LIMIT 1",
            '%' . $wpdb->esc_like('wp:widget-google-reviews/reviews {"id":"' . (int) $feed_id . '"') . '%', '%' . $wpdb->esc_like('[grw id=' . (int) $feed_id . ']') . '%'
        ));
        if (!$page) return null;
        $live = in_array($page->post_status, array('publish', 'private'), true);
        return array(
            'title' => $page->post_title,
            'live'  => $live,
            'view'  => $live ? get_permalink($page->ID) : get_preview_post_link($page->ID),
            'edit'  => get_edit_post_link($page->ID, 'raw'),
        );
    }

    // An older widget keeps the connection details and options a step page has no controls for.
    // Only a widget of one of $modes counts; a save over the other family drops that family's keys itself.
    protected function existing($post_id, $modes) {
        if (!$post_id) return null;
        $feed = $this->feed_deserializer->get_feed((int) $post_id);
        $old = $feed ? json_decode($feed->post_content, true) : null;
        return is_array($old) && in_array($old['options']['view_mode'] ?? '', $modes, true) ? $old : null;
    }

    // The language of each posted pid, in the same order.
    protected function langs() {
        $raw = isset($_POST['langs']) ? json_decode(wp_unslash($_POST['langs']), true) : null;
        return array_map(function($lang) { return is_string($lang) ? sanitize_text_field($lang) : ''; }, is_array($raw) ? array_values($raw) : array());
    }

    // The posted options limited to $keys; empty and false values are left to the defaults, except an empty choice
    // over a default that is not empty (a badge's label icon "None"), which the default would otherwise replace.
    protected function posted_options($keys) {
        $raw = isset($_POST['options']) ? json_decode(wp_unslash($_POST['options']), true) : array();
        return self::pick(is_array($raw) ? $raw : array(), $keys);
    }

    protected static function pick($raw, $keys) {
        $defaults = Core::get_default_options();
        $options = array();
        foreach ($keys as $key) {
            if (!isset($raw[$key]) || $raw[$key] === false || ($raw[$key] === '' && empty($defaults[$key]))) {
                continue;
            }
            $options[$key] = is_bool($raw[$key]) ? $raw[$key] : sanitize_text_field((string) $raw[$key]);
        }
        return $options;
    }

    // One connection per posted (pid, lang) pair, then the old options without $own keys under $defaults and $options.
    protected function content($pids, $options, $old, $langs, $own, $defaults) {
        $kept = array();
        foreach ((array) ($old['connections'] ?? array()) as $conn) {
            if (empty($conn['id'])) continue;
            $kept[$conn['id'] . '|' . ($conn['lang'] ?? '')] = $conn;
            // By id alone as well: a language change keeps the name, photo and props.
            $kept += array($conn['id'] => $conn);
        }
        $connections = array();
        foreach ($pids as $i => $pid) {
            // '' is every language of the place; a pid without a posted language keeps its connection's own.
            $lang = $langs[$i] ?? null;
            $conn = $kept[$pid . '|' . ($lang ?? '')] ?? $kept[$pid] ?? null;
            if (!$conn) {
                $place = $this->dao->get_place($pid);
                if ($place) $conn = $this->places->connection($place);
            }
            if (!$conn) continue;
            if ($lang !== null) $conn['lang'] = $lang;
            $connections[$conn['id'] . '|' . ($conn['lang'] ?? '')] = $conn;
        }
        $base = is_array($old['options'] ?? null) ? $old['options'] : array();
        foreach ($own as $key) {
            unset($base[$key]);
        }
        $options = array_merge($defaults, $base, $options);
        return json_decode(wp_json_encode(array('connections' => array_values($connections), 'options' => $options)));
    }

    // Saves $content as the widget $post_id (0 for a new one) and returns its id; answers the request itself on failure.
    protected function save_feed($post_id, $title, $content, $noun) {
        if (empty($content->connections)) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'The chosen place is not connected yet.')));
        }
        if ($title === '') {
            $title = $content->connections[0]->name . ' ' . $noun;
        }
        // Feed_Serializer::save() unslashes its content as it would POST data, so PHP-built JSON goes in slashed.
        $post_id = $this->feed_serializer->save($post_id, $title, wp_slash(wp_json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));
        if (!$post_id) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Could not save the ' . $noun . '.')));
        }
        return (int) $post_id;
    }

    protected function guard() {
        if (!current_user_can('manage_options')) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Permission denied.')));
        }
        check_admin_referer('grw_wpnonce', 'grw_nonce');
    }
}
