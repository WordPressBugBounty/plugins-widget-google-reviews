<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;
use WP_Rplg_Google_Reviews\Includes\Core\Badge_Live;
use WP_Rplg_Google_Reviews\Includes\Core\Google_Dao;

// A badge is an ordinary grw_feed widget with view_mode 'badge', so Widgets, shortcode, block and cron need nothing of their own.
class Plugin_Badge {

    const GLOBAL_OPTION = 'grw_badge_id';
    const LIST_VIEW = 'badge';
    // A badge is told apart by its post_content; every writer in the plugin emits compact JSON.
    const CONTENT_MARK = '"view_mode":"badge"';

    private $dao;
    private $core;
    private $places;
    private $feed_serializer;
    private $feed_deserializer;

    public function __construct(Google_Dao $dao, Core $core, Plugin_Places $places, Feed_Serializer $feed_serializer, Feed_Deserializer $feed_deserializer) {
        $this->dao               = $dao;
        $this->core              = $core;
        $this->places            = $places;
        $this->feed_serializer   = $feed_serializer;
        $this->feed_deserializer = $feed_deserializer;
    }

    public function register() {
        add_action('grw_admin_page_grw-badge', array($this, 'render'));
        add_action('wp_ajax_grw_badge_data', array($this, 'data'));
        add_action('wp_ajax_grw_badge_save', array($this, 'save'));
        add_action('admin_init', array($this, 'redirect_to_list'));
        add_action('pre_get_posts', array($this, 'split_lists'));
        add_filter('posts_where', array($this, 'where'), 10, 2);
        add_filter('post_type_labels_' . Post_Types::FEED_POST_TYPE, array($this, 'labels'));
        add_filter('submenu_file', array($this, 'submenu_file'));
        add_filter('display_post_states', array($this, 'post_states'), 10, 2);
        add_action('manage_posts_extra_tablenav', array($this, 'keep_view'));
        add_filter('admin_body_class', array($this, 'body_class'));
    }

    public static function is_list() {
        return $GLOBALS['pagenow'] === 'edit.php' && isset($_GET['post_type'], $_GET['grw_view'])
            && $_GET['post_type'] === Post_Types::FEED_POST_TYPE && $_GET['grw_view'] === self::LIST_VIEW;
    }

    public static function list_url() {
        return admin_url('edit.php?post_type=' . Post_Types::FEED_POST_TYPE . '&grw_view=' . self::LIST_VIEW);
    }

    public function redirect_to_list() {
        global $plugin_page;
        if ($plugin_page !== 'grw-badge' || isset($_GET['grw_feed_id']) || isset($_GET['new'])) return;
        if ($this->has_badges()) {
            wp_safe_redirect(self::list_url());
            exit;
        }
    }

    private function has_badges() {
        global $wpdb;
        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s AND post_status NOT IN ('trash', 'auto-draft') AND post_content LIKE %s LIMIT 1",
            Post_Types::FEED_POST_TYPE, '%' . $wpdb->esc_like(self::CONTENT_MARK) . '%'
        ));
    }

    public function split_lists($query) {
        if (!is_admin() || !$query->is_main_query() || $GLOBALS['pagenow'] !== 'edit.php'
            || $query->get('post_type') !== Post_Types::FEED_POST_TYPE) return;
        $query->set('grw_badges', self::is_list() ? 'only' : 'none');
    }

    public function where($where, $query) {
        $kind = $query->get('grw_badges');
        if (!$kind) return $where;
        global $wpdb;
        return $where . $wpdb->prepare(" AND {$wpdb->posts}.post_content " . ($kind === 'only' ? 'LIKE' : 'NOT LIKE') . ' %s', '%' . $wpdb->esc_like(self::CONTENT_MARK) . '%');
    }

    public function labels($labels) {
        if (self::is_list()) {
            $labels->name         = __('Badges', 'widget-google-reviews');
            $labels->search_items = __('Search Badges', 'widget-google-reviews');
            $labels->not_found    = __('No badges found', 'widget-google-reviews');
        }
        return $labels;
    }

    public function submenu_file($submenu_file) {
        return self::is_list() ? 'grw-badge' : $submenu_file;
    }

    public function post_states($states, $post) {
        if ($post->post_type === Post_Types::FEED_POST_TYPE && $post->post_status !== 'trash' && (int) get_option(self::GLOBAL_OPTION) === (int) $post->ID) {
            $states['grw_badge_global'] = __('Displayed on the site', 'widget-google-reviews');
        }
        return $states;
    }

    // The list's GET form (search, date filter, bulk actions) carries only core fields; without this it lands on Widgets.
    public function keep_view($which) {
        if ($which === 'top' && self::is_list()) {
            echo '<input type="hidden" name="grw_view" value="' . esc_attr(self::LIST_VIEW) . '">';
        }
    }

    // Every row here is a badge, so the Theme column is hidden by CSS; dropping it from the column set would
    // desync the rows Quick Edit returns over ajax, where the list is not recognisable.
    public function body_class($classes) {
        return self::is_list() ? $classes . ' grw-badges-list' : $classes;
    }

    private static function keys() {
        return array_merge(Core::badge_option_keys(), array('style_vars'));
    }

    public function render() {
        $feed = null;
        $feed_id = isset($_GET['grw_feed_id']) ? (int) $_GET['grw_feed_id'] : 0;
        if ($feed_id) {
            $feed = $this->feed_deserializer->get_feed($feed_id);
        }
        $content = $feed ? json_decode($feed->post_content) : null;

        $places = array();
        foreach ($this->dao->get_places() as $place) {
            $places[] = array(
                'id'      => $place->place_id,
                'name'    => $place->name,
                'address' => (string) $place->address,
                'photo'   => empty($place->photo) ? GRW_GOOGLE_BIZ : $place->photo,
                'rating'  => $place->rating > 0 ? number_format((float) $place->rating, 1, '.', '') : '',
                'total'   => (int) $place->review_count,
                'lang'    => $this->places->fetch_pairs($place)[0]['lang'],
            );
        }

        $selected = array();
        $langs = array();
        if ($content && !empty($content->connections)) {
            foreach ($content->connections as $conn) {
                if (empty($conn->id)) continue;
                $selected[] = $conn->id;
                if (!empty($conn->lang)) $langs[$conn->id] = $conn->lang;
            }
        }

        $vars = array(
            'places'   => $places,
            'selected' => $selected,
            'langs'    => (object) $langs,
            'options'  => $content && isset($content->options) ? $content->options : new \stdClass(),
            'feedId'   => $feed ? $feed->ID : 0,
            'title'    => $feed ? $feed->post_title : '',
            'global'   => $feed ? (int) get_option(self::GLOBAL_OPTION) === (int) $feed->ID : true,
            'hasKey'   => !empty(get_option('grw_google_api_key')),
            'authcode' => (string) get_option('grw_auth_code'),
            'lang'     => strtolower(explode('_', get_locale())[0]),
            'nonce'    => wp_create_nonce('grw_wpnonce'),
            'widgets'  => admin_url('edit.php?post_type=' . Post_Types::FEED_POST_TYPE),
            'home'     => home_url('/'),
            'blank'    => GRW_GOOGLE_BIZ,
            'connect'  => apply_filters('grw_connect_url', 'https://app.richplugins.com/public/connect'),
        );

        wp_nonce_field('grw_wpnonce', 'grw_nonce');
        ?>
        <div id="grw-badge" class="grw-badge-page" data-vars="<?php echo esc_attr(wp_json_encode($vars)); ?>">
            <ol class="grw-badge-steps">
                <li data-step="1" class="grw-badge-step-on"><span>1</span>Choose a badge</li>
                <li data-step="2"><span>2</span>Set up</li>
                <li data-step="3"><span>3</span>Publish</li>
            </ol>
            <div class="grw-badge-body"></div>
        </div>
        <?php
    }

    public function data() {
        $this->guard();
        $pids = isset($_POST['pids']) && is_array($_POST['pids']) ? array_map('sanitize_text_field', wp_unslash($_POST['pids'])) : array();
        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        wp_send_json(array('status' => 'success', 'result' => $this->preview_data($pids, $post_id)));
    }

    private function preview_data($pids, $post_id = 0) {
        if (empty($pids)) {
            return self::sample();
        }
        $data = $this->core->get_data($this->content($pids, array(), $this->existing($post_id), $this->langs()), false);
        $bizs = array();
        foreach ($data['businesses'] as $b) {
            $bizs[] = array(
                'id'       => $b->id,
                'name'     => $b->name,
                'photo'    => $b->photo,
                'url'      => $b->url,
                'provider' => 'google',
                'rating'   => $b->rating,
                'total'    => (int) $b->review_count,
            );
        }
        $summary = Badge_Live::summary($data['businesses']);
        if ($summary && $summary->provider === 'summary') {
            array_unshift($bizs, array(
                'id'       => 'summary',
                'name'     => $summary->name,
                'photo'    => $summary->photo,
                'url'      => $summary->url,
                'provider' => 'summary',
                'rating'   => $summary->rating,
                'total'    => (int) $summary->review_count,
                'wr'       => $summary->wr,
            ));
        }
        ob_start();
        (new View())->render_popup($data['reviews'], $data['options']);
        return array(
            'bizs'   => $bizs,
            'live'   => Badge_Live::build($data['reviews']),
            'popup'  => ob_get_clean(),
            'sample' => false,
        );
    }

    public static function sample() {
        $now = time();
        $recent = array();
        $phrases = array();
        $rows = array(
            array(5, 'Emma Johnson', 'Friendly staff and really quick service', 3),
            array(5, 'Liam Carter', 'Everything was clean and well organized', 6),
            array(4, 'Sofia Martinez', 'Great value, we will definitely come back', 9),
            array(5, 'Noah Williams', 'The team went out of their way to help us', 14),
            array(5, 'Olivia Brown', 'Best experience we have had in a long time', 21),
        );
        foreach ($rows as $r) {
            $recent[] = array('r' => $r[0], 'a' => $r[1], 't' => $now - $r[3] * 86400);
            $phrases[] = array('t' => $r[2], 'a' => $r[1]);
        }
        return array(
            'bizs'   => array(array('id' => 'sample', 'name' => 'Your business', 'photo' => '', 'url' => '', 'provider' => 'google', 'rating' => '4.8', 'total' => 1284)),
            'live'   => array('phrases' => $phrases, 'recent' => $recent),
            'sample' => true,
        );
    }

    // A badge made in the builder before 7.1 keeps the connection details and options this page has no controls for.
    private function existing($post_id) {
        if (!$post_id) return null;
        $feed = $this->feed_deserializer->get_feed((int) $post_id);
        $old = $feed ? json_decode($feed->post_content, true) : null;
        return is_array($old) ? $old : null;
    }

    private function langs() {
        $raw = isset($_POST['langs']) ? json_decode(wp_unslash($_POST['langs']), true) : null;
        $langs = array();
        foreach (is_array($raw) ? $raw : array() as $pid => $lang) {
            if (is_string($lang) && $lang !== '') $langs[sanitize_text_field($pid)] = sanitize_text_field($lang);
        }
        return $langs;
    }

    private function content($pids, $options, $old = null, $langs = array()) {
        $kept = array();
        foreach ((array) ($old['connections'] ?? array()) as $conn) {
            if (!empty($conn['id'])) $kept[$conn['id']] = $conn;
        }
        $connections = array();
        foreach ($pids as $pid) {
            $conn = null;
            if (isset($kept[$pid])) {
                $conn = $kept[$pid];
            } else {
                $place = $this->dao->get_place($pid);
                if ($place) $conn = $this->places->connection($place);
            }
            if (!$conn) continue;
            if (!empty($langs[$pid])) $conn['lang'] = $langs[$pid];
            $connections[] = $conn;
        }
        $base = is_array($old['options'] ?? null) ? $old['options'] : array();
        foreach (array_merge(self::keys(), array('view_mode')) as $key) {
            unset($base[$key]);
        }
        $options = array_merge(array('view_mode' => 'badge'), $base, $options);
        return json_decode(wp_json_encode(array('connections' => $connections, 'options' => $options)));
    }

    public function save() {
        $this->guard();

        $pids = isset($_POST['pids']) && is_array($_POST['pids']) ? array_map('sanitize_text_field', wp_unslash($_POST['pids'])) : array();
        if (empty($pids)) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Connect a place to publish the badge.')));
        }

        $raw = isset($_POST['options']) ? json_decode(wp_unslash($_POST['options']), true) : array();
        $options = array();
        foreach (self::keys() as $key) {
            if (isset($raw[$key]) && $raw[$key] !== '' && $raw[$key] !== false) {
                $options[$key] = is_bool($raw[$key]) ? $raw[$key] : sanitize_text_field((string) $raw[$key]);
            }
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $title = isset($_POST['title']) ? sanitize_text_field(wp_unslash($_POST['title'])) : '';

        $content = $this->content($pids, $options, $this->existing($post_id), $this->langs());
        if (empty($content->connections)) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'The chosen place is not connected yet.')));
        }
        if ($title === '') {
            $title = $content->connections[0]->name . ' badge';
        }

        // Feed_Serializer::save() unslashes its content as it would POST data, so PHP-built JSON goes in slashed.
        $post_id = $this->feed_serializer->save($post_id, $title, wp_slash(wp_json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));
        if (!$post_id) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Could not save the badge.')));
        }

        $global = !empty($_POST['global']) && $_POST['global'] !== 'false' && $_POST['global'] !== '0';
        $current = (int) get_option(self::GLOBAL_OPTION);
        if ($global) {
            update_option(self::GLOBAL_OPTION, (int) $post_id);
        } else if ($current === (int) $post_id) {
            delete_option(self::GLOBAL_OPTION);
        }

        wp_send_json(array('status' => 'success', 'result' => array(
            'id'        => (int) $post_id,
            'shortcode' => '[grw id=' . (int) $post_id . ']',
            'global'    => $global,
            'replaced'  => $global && $current && $current !== (int) $post_id ? $current : 0,
        )));
    }

    private function guard() {
        if (!current_user_can('manage_options')) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Permission denied.')));
        }
        check_admin_referer('grw_wpnonce', 'grw_nonce');
    }
}
