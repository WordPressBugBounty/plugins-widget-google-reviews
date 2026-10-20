<?php

namespace WP_Rplg_Google_Reviews\Includes\Admin;

use WP_Rplg_Google_Reviews\Includes\Post_Types;

class Admin_Feed_Columns {

    private $feed_deserializer;

    private static $plugin_themes = array(
        'list'   => 'List',
        'slider' => 'Slider',
        'grid'   => 'Grid',
        'rating' => 'Rating',
        'badge'  => 'Badge'
    );

    public function __construct($feed_deserializer) {
        $this->feed_deserializer = $feed_deserializer;
    }

    public function register() {
        add_filter('get_edit_post_link', array($this, 'change_edit_post_link'), 10, 3);
        add_filter('manage_edit-' . Post_Types::FEED_POST_TYPE . '_columns', array($this, 'get_columns'));
        add_action('manage_' . Post_Types::FEED_POST_TYPE . '_posts_custom_column', array($this, 'render'), 10, 2);
        add_filter('post_row_actions', array($this, 'change_post_row_actions'), 10, 2);
        add_filter('get_the_excerpt', array($this, 'hide_grw_feed_excerpt'), 10, 2);
        add_filter('bulk_actions-edit-' . Post_Types::FEED_POST_TYPE, array($this, 'bulk_actions'));
        add_filter('display_post_states', array($this, 'post_states'), 10, 2);
        add_filter('wp_insert_post_data', array($this, 'keep_status'), 10, 2);
    }

    // Bulk Edit offers status and password: a widget is published by its editor on every save and has no use for a password.
    public function bulk_actions($actions) {
        unset($actions['edit']);
        return $actions;
    }

    // Quick Edit shows the title alone (admin-main.css); what its hidden fields post does not change a widget.
    public function keep_status($data, $postarr) {
        if ($data['post_type'] !== Post_Types::FEED_POST_TYPE || empty($postarr['ID']) || !isset($_POST['action']) || $_POST['action'] !== 'inline-save') {
            return $data;
        }
        $post = get_post($postarr['ID']);
        if ($post) {
            $data['post_status']   = $post->post_status;
            $data['post_password'] = wp_slash($post->post_password);
        }
        return $data;
    }

    // Visitors see nothing of a widget that is not published (an old Quick Edit could leave it so); a password changes nothing for a widget.
    public function post_states($states, $post) {
        if ($post->post_type !== Post_Types::FEED_POST_TYPE) {
            return $states;
        }
        unset($states['protected']);
        if (!in_array($post->post_status, array('publish', 'trash'), true)) {
            $states['grw_unseen'] = __('Not shown to visitors', 'widget-google-reviews');
        }
        return $states;
    }

    public function change_edit_post_link($link, $id, $context) {
        if (get_post_type($id) !== Post_Types::FEED_POST_TYPE) {
            return $link;
        }
        return admin_url('admin.php?page=grw-widget&' . Post_Types::FEED_POST_TYPE . '_id=' . $id);
    }

    public function get_columns($columns) {
        $columns = array(
            'cb'            => '<input type="checkbox">',
            'title'         => __('Title', 'widget-google-reviews'),
            'ID'            => __('ID',    'widget-google-reviews'),
            'grw_theme'     => __('Theme', 'widget-google-reviews'),
            'grw_shortcode' => __('Shortcode', 'widget-google-reviews'),
            'date'          => __('Date',  'widget-google-reviews'),
        );
        // Without a bulk action (an Editor) the header's Select All would tick nothing.
        if (!current_user_can(get_post_type_object(Post_Types::FEED_POST_TYPE)->cap->delete_posts)) {
            unset($columns['cb']);
        }
        return $columns;
    }

    public function render($column_name, $post_id) {
        $args = array();

        if (isset($_GET['post_status'])) {
            $post_status = sanitize_text_field(wp_unslash($_GET['post_status']));

            if ($post_status === 'trash') {
                $args['post_status'] = array('trash');
            }
        }

        $feed = $this->feed_deserializer->get_feed($post_id, $args);
        if (!$feed) {
            return null;
        }

        $connection = json_decode($feed->post_content);

        switch ($column_name) {
            case 'ID':
                echo $feed->ID;
                break;
            case 'grw_theme':
                $view_mode = isset($connection->options->view_mode) ? $connection->options->view_mode : '';
                echo isset(self::$plugin_themes[$view_mode]) ? self::$plugin_themes[$view_mode] : 'List';
                break;
            case 'grw_shortcode':
                echo '<input type="text" value="[grw id=' . $feed->ID . ']" aria-label="' . esc_attr__('Shortcode', 'widget-google-reviews') . '" onclick="this.select(); document.execCommand(\'copy\');var sm=this.nextSibling;sm.className=\'\';setTimeout(function() {sm.className=\'grw_hide\';},10);" readonly=""><small>shortcode copied</small>';
                break;
        }
    }

    public function change_post_row_actions($actions, $post) {
        if (isset($actions) && $post->post_type === Post_Types::FEED_POST_TYPE) {
            $changed_actions = array(
                'post-id' => '<span class="grw-admin-column-action">ID: ' . $post->ID . '</span>',
            );
            $actions = $changed_actions + $actions;
        }
        return $actions;
    }

    public function hide_grw_feed_excerpt($excerpt, $post = null) {
        return $post->post_type !== Post_Types::FEED_POST_TYPE ? $excerpt : '';
    }
}
