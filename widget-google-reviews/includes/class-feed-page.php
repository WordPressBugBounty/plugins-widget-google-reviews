<?php

namespace WP_Rplg_Google_Reviews\Includes;

class Feed_Page {

    private $builder_page;

    public function __construct($builder_page) {
        $this->builder_page = $builder_page;
    }

    public function register() {
        $feed_ids = get_option('grw_feed_ids');
        if (empty($feed_ids) && !Plugin_Badge::is_list()) {
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
        $badges = Plugin_Badge::is_list();
        $url = admin_url('admin.php?page=' . ($badges ? 'grw-badge&new=1' : 'grw-builder'));
        ?><div class="grw-admin-feeds"><a class="button button-primary" href="<?php echo esc_url($url); ?>"><?php echo $badges ? esc_html__('Create Badge', 'widget-google-reviews') : esc_html__('Create Widget', 'widget-google-reviews'); ?></a></div><?php
    }
}
