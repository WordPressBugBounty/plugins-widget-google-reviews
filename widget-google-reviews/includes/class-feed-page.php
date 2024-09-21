<?php

namespace WP_Rplg_Google_Reviews\Includes;

class Feed_Page {

    private $feed_deserializer;
    private $builder_page;

    public function __construct($feed_deserializer, $builder_page) {
        $this->feed_deserializer = $feed_deserializer;
        $this->builder_page = $builder_page;
    }

    public function register() {
        $render_func;
        $feed_count = $this->feed_deserializer->get_feed_count();
        if ($feed_count < 1) {
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
        $feed_count = $this->feed_deserializer->get_feed_count();
        ?>
        <div class="grw-admin-feeds">
            <a class="button button-primary" href="<?php echo admin_url('admin.php'); ?>?page=grw-builder">Create Widget</a>
            <?php if ($feed_count < 1) { ?>
            <h3 style="display:inline;vertical-align:middle;"> - First of all, create a widget to connect and show Google reviews through a shortcode or sidebar widget</h3>
            <?php } ?>
        </div>
        <?php
    }
}
