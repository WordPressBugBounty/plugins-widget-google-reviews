<?php

namespace WP_Rplg_Google_Reviews\Includes\Admin;

use WP_Rplg_Google_Reviews\Includes\Post_Types;

class Admin_Feed_Columns {

    private $feed_deserializer;

    // 'badge' widgets are created and edited on the Badge page, the builder never offers it.
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
    }

    public function change_edit_post_link($link, $id, $context) {
        if (get_post_type($id) !== Post_Types::FEED_POST_TYPE) {
            return $link;
        }
        $badge = $this->is_badge($id);
        return admin_url('admin.php?page=' . ($badge ? 'grw-badge' : 'grw-builder') . '&' . Post_Types::FEED_POST_TYPE . '_id=' . $id . ($badge ? '&step=1' : ''));
    }

    private function is_badge($id) {
        $feed = $this->feed_deserializer->get_feed($id);
        if (!$feed) return false;
        $content = json_decode($feed->post_content);
        return isset($content->options->view_mode) && $content->options->view_mode === 'badge';
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
                echo '<input type="text" value="[grw id=' . $feed->ID . ']" onclick="this.select(); document.execCommand(\'copy\');var sm=this.nextSibling;sm.className=\'\';setTimeout(function() {sm.className=\'grw_hide\';},10);" readonly=""><small>shortcode copied</small>';
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
