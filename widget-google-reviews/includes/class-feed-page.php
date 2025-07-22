<?php

namespace WP_Rplg_Google_Reviews\Includes;

class Feed_Page {

    private $builder_page;

    public function __construct($builder_page) {
        $this->builder_page = $builder_page;
    }

    public function register() {
        $render_func;
        $feed_ids = get_option('grw_feed_ids');
        if (empty($feed_ids)) {
            $render_func = array($this, 'connect');
        } else {
            $render_func = array($this, 'render');
        }

        add_filter('views_edit-' . Post_Types::FEED_POST_TYPE, $render_func, 20);
    }

    public function connect() {
        $this->builder_page->render(null);
    }

    public function render() {
        ?><div class="grw-admin-feeds"><a class="button button-primary" href="<?php echo admin_url('admin.php'); ?>?page=grw-builder">Create Widget</a></div><?php
    }
}
