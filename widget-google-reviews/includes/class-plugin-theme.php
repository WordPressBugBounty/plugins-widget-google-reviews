<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;

// A theme is an ordinary grw_feed widget (a slider or grid with a card layout, a list or a rating); a saved one is edited on its step 2.
class Plugin_Theme extends Plugin_Step_Page {

    const LAYOUTS = array('slider', 'grid', 'list', 'rating');
    // What the page draws: its own layouts and the badges, which Plugin_Badge saves.
    const MODES = array('slider', 'grid', 'list', 'rating', 'badge');

    const KEYS = array('view_mode', 'card_layout', 'rating_layout', 'style_vars', 'dark_theme', 'anonym_avatar', 'short_last_name', 'header_hide_social',
                       'slider_head_pos', 'slider_autoplay', 'slider_speed', 'slider_mousestop', 'slider_hide_prevnext', 'slider_hide_dots', 'rating_popup',
                       'disable_biz_link', 'text_size', 'min_letter', 'slider_breakpoints', 'css_vars', 'reviewer_avatar_size', 'cache', 'reviews_limit',
                       'lazy_load_img', 'nofollow_link', 'open_link', 'aria_label', 'media', 'reply', 'google_def_rev_link', 'hidden', 'theme');
    // The KEYS a widget keeps when it changes its design family: what its reviews, links and names do, not how a design looks.
    const SETTINGS = array('cache', 'reviews_limit', 'min_letter', 'lazy_load_img', 'nofollow_link', 'open_link', 'aria_label', 'media', 'reply',
                           'google_def_rev_link', 'disable_biz_link', 'short_last_name', 'hidden');

    // Step 1 shows each layout with this many reviews.
    const GALLERY = 10;

    private $badge;

    public function __construct(Plugin_Badge $badge, ...$deps) {
        parent::__construct(...$deps);
        $this->badge = $badge;
    }

    public function register() {
        add_action('grw_admin_page_grw-widget', array($this, 'render'));
        add_action('admin_init', array($this, 'redirect'));
        add_action('wp_ajax_grw_theme_data', array($this, 'data'));
        add_action('wp_ajax_grw_theme_preview', array($this, 'preview'));
        add_action('wp_ajax_grw_theme_save', array($this, 'save'));
        add_action('wp_ajax_grw_theme_page', array($this, 'page'));
    }

    // The builder page of 7.1 is kept only for its links: bookmarks, the readme and support answers.
    public function redirect() {
        global $plugin_page;
        if ($plugin_page !== 'grw-builder') return;
        $id = isset($_GET['grw_feed_id']) ? (int) $_GET['grw_feed_id'] : 0;
        $place = isset($_GET['grw_place_id']) ? sanitize_text_field(wp_unslash($_GET['grw_place_id'])) : '';
        wp_safe_redirect(admin_url('admin.php?page=grw-widget' . ($id ? '&grw_feed_id=' . $id : ($place !== '' ? '&grw_place_id=' . rawurlencode($place) : ''))));
        exit;
    }

    public function render() {
        $feed = $this->feed();
        $this->render_page('grw-themes', 'grw-themes-page', $this->page_vars($feed, array(
            'global' => $feed && (int) get_option(Plugin_Badge::GLOBAL_OPTION) === (int) $feed->ID,
            'cards'  => Themes::client(),
        )), 'Choose a design');
    }

    // Unlike a badge's, these options default to true, so a false one is kept. A badge preview carries its own keys too.
    private static function options($raw) {
        $options = array();
        foreach (array_merge(self::KEYS, Core::badge_option_keys()) as $key) {
            if (!isset($raw[$key])) continue;
            // An empty value stands for the default; for cache it is the choice "no cache".
            if ($raw[$key] === '' && $key !== 'cache') continue;
            if (is_bool($raw[$key])) $options[$key] = $raw[$key];
            else $options[$key] = $key === 'css_vars' ? sanitize_textarea_field((string) $raw[$key]) : sanitize_text_field((string) $raw[$key]);
        }
        // Not in KEYS: an empty paging means all reviews, and a widget the page sends without one keeps its own.
        if (isset($raw['pagination']) && is_scalar($raw['pagination'])) $options['pagination'] = sanitize_text_field((string) $raw['pagination']);
        if (!isset($options['view_mode']) || !in_array($options['view_mode'], self::MODES, true)) $options['view_mode'] = 'slider';
        return Themes::sanitize($options);
    }

    // Stored as the gallery shows them: a widget holds its own values for these rather than the defaults.
    private function theme_content($pids, $options, $old, $langs) {
        $stored = array('pagination' => '10');
        if (in_array($options['view_mode'] ?? '', array('list', 'rating'), true)) {
            $stored += array('show_round' => false, 'show_shadow' => false, 'rating_popup' => false);
        }
        // A widget saved as a badge drops the badge's keys when it becomes a slider, grid, list or rating.
        $own = self::KEYS;
        if ($old && ($old['options']['view_mode'] ?? '') === 'badge') {
            $own = array_merge($own, Core::badge_option_keys());
        }
        return $this->content($pids, $options, $old, $langs, $own, $stored);
    }

    // Step 1: every design drawn by the plugin as the site would draw it; the badge data beside them serves the badge popup and the "Top rated" gate.
    public function data() {
        $this->guard();
        $ids = array();
        $sets = array();
        foreach (Themes::all() as $theme) {
            $ids[] = $theme['id'];
            $sets[] = self::options(Themes::options($theme) + array('slider_autoplay' => false, 'anonym_avatar' => !empty($_POST['anonym'])));
        }
        $result = array('themes' => array_combine($ids, $this->renders($sets, true, $sample)));
        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $result['badge'] = $this->badge->preview_data($this->pids(), $post_id);
        $result['sample'] = $sample;
        wp_send_json(array('status' => 'success', 'result' => $result));
    }

    // Step 2: the widget being set up.
    public function preview() {
        $this->guard();
        $raw = isset($_POST['options']) ? json_decode(wp_unslash($_POST['options']), true) : null;
        $html = $this->renders(array(self::options(is_array($raw) ? $raw : array())), false, $sample, $hidden);
        wp_send_json(array('status' => 'success', 'result' => array('html' => $html[0], 'sample' => $sample, 'hidden' => $hidden)));
    }

    // The editor asks for admin mode: the hidden reviews stay, dimmed and with their id, so the page can hide and show them; $hidden lists them.
    private function renders($sets, $gallery, &$sample, &$hidden = null) {
        $pids = $this->pids();
        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $sample = empty($pids);
        $admin = !$gallery && !$sample && !empty($_POST['admin']);
        $hidden = array();
        // The gallery's sets differ in their headers: each starts from the defaults, not from the first set's options.
        $data = $this->core->get_data($this->theme_content($pids, $gallery ? array() : $sets[0], $sample ? null : $this->existing($post_id, self::MODES), $this->langs()), $admin);
        if ($sample) {
            $data['businesses'] = array(self::sample_biz());
            $data['reviews'] = self::sample_reviews();
        }
        $view = new View();
        $html = array();
        foreach ($sets as $i => $set) {
            $options = clone $data['options'];
            foreach ($set as $key => $value) $options->$key = $value;
            // The sample has no profile photos, and the letters look closer to real ones than the gray guest.
            if ($sample) $options->anonym_avatar = true;
            // A gallery grid pages after its first two rows, and only the page knows how many cards a row holds (admin-themes.js).
            if ($gallery && $options->view_mode === 'grid') $options->pagination = 2;
            // Below the label's threshold a gallery badge still shows "Top rated", as the tile's design has it; its button locks instead.
            if ($gallery) $options->preview_toprated = true;
            $bizs = $options->header_hide_social ? array() : $data['businesses'];
            $reviews = $gallery ? array_slice($data['reviews'], 0, self::GALLERY) : $data['reviews'];
            // Real reviews are shortened by Core when they are read; the sample is made here.
            if ($sample && !empty($options->short_last_name)) {
                $reviews = array_map(function($review) {
                    $review = clone $review;
                    $review->author_name = $this->core->get_short_name($review->author_name);
                    return $review;
                }, $reviews);
            }
            if ($admin) {
                foreach ($reviews as $review) {
                    $site = $review->hide != '';
                    $widget = $view->is_hidden($review->id, $options->hidden);
                    // Keyed by id: a review kept in two language versions is one entry.
                    if ($site || $widget) $hidden[(int) $review->id] = array('id' => (int) $review->id, 'name' => $review->author_name, 'site' => $site, 'widget' => $widget);
                }
            }
            $html[] = $view->render('grwt-' . $i, $bizs, $reviews, $options, $admin);
        }
        $hidden = array_values($hidden);
        return $html;
    }

    private static function sample_biz() {
        return (object) array('id' => 'sample', 'name' => 'Your business', 'url' => '', 'photo' => GRW_GOOGLE_BIZ, 'address' => '',
                              'rating' => '4.8', 'review_count' => 1284, 'provider' => 'google');
    }

    private static function sample_reviews() {
        $now = time();
        $rows = array(
            array(5, 'Emma Johnson', 'Friendly staff and really quick service. They explained every step, the price was exactly as quoted and the result is even better than we hoped.', 3),
            array(5, 'Liam Carter', 'Everything was clean and well organized.', 6),
            array(4, 'Sofia Martinez', 'Great value, we will definitely come back. The only wait was at the front desk on a busy Saturday, but the team kept us informed the whole time and offered coffee while we waited.', 9),
            array(5, 'Noah Williams', 'The team went out of their way to help us with a last-minute change. Highly recommended!', 14),
            array(5, 'Olivia Brown', 'Best experience we have had in a long time. Thank you!', 21),
            array(5, 'Lucas Schneider', 'Professional, punctual and kind. Booking online took a minute, and the reminders made it easy not to forget the appointment.', 30),
            array(5, 'Mia Fischer', 'Clear advice, fair prices and a result that speaks for itself. We have already recommended them to our friends.', 35),
            array(4, 'Arjun Patel', 'Good service overall. Parking was a little tricky, but the staff helped us find a spot.', 41),
            array(5, 'Chloe Dubois', 'Warm welcome, spotless place and everything was ready on time.', 48),
            array(5, 'Mateo Rossi', 'Fast, friendly and reliable. This was our third visit and it has never disappointed. The small details make the difference here, from the follow-up call to the tidy invoice.', 56),
        );
        $reviews = array();
        foreach ($rows as $i => $r) {
            $reviews[] = (object) array('id' => 'sample' . $i, 'hide' => '', 'biz_id' => 'sample', 'biz_url' => '', 'rating' => $r[0], 'text' => $r[2],
                                        'lang' => 'en', 'author_avatar' => '', 'author_url' => '', 'author_name' => $r[1], 'time' => $now - $r[3] * 86400,
                                        'images' => null, 'reply' => null, 'reply_time' => null, 'url' => null, 'provider' => 'google');
        }
        return $reviews;
    }

    public function save() {
        $this->guard();

        $pids = $this->pids();
        if (empty($pids)) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Connect a place to publish the widget.')));
        }

        $post_id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        $title = isset($_POST['title']) ? sanitize_text_field(wp_unslash($_POST['title'])) : '';
        $raw = isset($_POST['options']) ? json_decode(wp_unslash($_POST['options']), true) : array();
        $options = self::options(is_array($raw) ? $raw : array());
        if (!in_array($options['view_mode'], self::LAYOUTS, true)) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'A badge is saved by its own page.')));
        }
        // A saved badge stays the same widget when it picks a card design: the id is kept and the site switch is let go.
        $old = $this->existing($post_id, self::MODES);
        if (!$old) {
            $post_id = 0;
            $title = '';
        }

        $content = $this->theme_content($pids, $options, $old, $this->langs());
        $post_id = $this->save_feed($post_id, $title, $content, $options['view_mode']);
        if ((int) get_option(Plugin_Badge::GLOBAL_OPTION) === $post_id) {
            delete_option(Plugin_Badge::GLOBAL_OPTION);
        }

        // The raw title: the page sends it back on the next save, and a texturized one would be stored with its entities.
        wp_send_json(array('status' => 'success', 'result' => array(
            'id'        => $post_id,
            'shortcode' => '[grw id=' . $post_id . ']',
            'title'     => get_post_field('post_title', $post_id, 'raw'),
            'page'      => self::page_of($post_id),
        )));
    }

    // A draft page holding only the widget (its block, or its shortcode where pages use the Classic Editor); a page that already holds it, of any status, is answered instead.
    public function page() {
        $this->guard();
        $id = isset($_POST['post_id']) ? (int) $_POST['post_id'] : 0;
        // get_feed(0) would answer with the newest widget: WP_Query ignores p=0.
        $feed = $id ? $this->feed_deserializer->get_feed($id) : null;
        if (!$feed) {
            wp_send_json(array('status' => 'failed', 'result' => array('error_message' => 'Save the widget first.')));
        }
        $page = self::page_of($feed->ID);
        if (!$page) {
            $page_id = wp_insert_post(array(
                'post_type'    => 'page',
                'post_status'  => 'draft',
                'post_title'   => 'Reviews',
                'post_content' => use_block_editor_for_post_type('page') ? self::block($feed->ID) : '[grw id=' . (int) $feed->ID . ']',
            ), true);
            if (is_wp_error($page_id)) {
                wp_send_json(array('status' => 'failed', 'result' => array('error_message' => $page_id->get_error_message())));
            }
            $page = self::page_of($feed->ID);
        }
        wp_send_json(array('status' => 'success', 'result' => $page));
    }
}
