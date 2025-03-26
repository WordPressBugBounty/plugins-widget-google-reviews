<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;

class Feed_Block {

    static $name = 'grw-reviews-block';

    private $core;
    private $view;
    private $assets;
    private $feed_deserializer;

    public function __construct(Feed_Deserializer $feed_deserializer, Core $core, View $view, Assets $assets) {
        $this->core = $core;
        $this->view = $view;
        $this->assets = $assets;
        $this->feed_deserializer = $feed_deserializer;
    }

    public function register() {
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_assets']);
        add_action('init', [$this, 'register_block'], 999);
        add_action('block_categories_all', [$this, 'register_category']);
    }

    public function enqueue_assets() {
        $assets = require(GRW_PLUGIN_PATH . 'build/index.asset.php');

        wp_register_script(
            self::$name,
            plugins_url('build/index.js', GRW_PLUGIN_FILE),
            array('wp-block-editor', 'wp-blocks'),
            $this->assets->version()
        );

        wp_localize_script(
            self::$name,
            'grwBlockData',
            array(
                'feeds' => $this->feed_deserializer->get_all_feeds_short(),
                'builderUrl' => admin_url('admin.php?page=grw-builder')
            )
        );

        wp_enqueue_script(self::$name);
    }

    public function register_block() {
        register_block_type(GRW_PLUGIN_PATH, [
            'editor_script'   => self::$name,
            'render_callback' => [$this, 'render'],
            'attributes'      => ['id' => ['type' => 'string']]
        ]);
    }

    public function register_category($cats) {
        return array_merge($cats, [['slug' => 'grw', 'title' => 'Google Reviews Block']]);
    }

    public function render($atts) {
        if (isset($atts['id'])) {

            $feed = $this->feed_deserializer->get_feed($atts['id']);
            if (!$feed) {
                return null;
            }

            $data = $this->core->get_reviews($feed);
            return $this->view->render($feed->ID, $data['businesses'], $data['reviews'], $data['options']);
        }
    }
}
