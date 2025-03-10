<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Admin\Admin_Menu;
use WP_Rplg_Google_Reviews\Includes\Admin\Admin_Tophead;
use WP_Rplg_Google_Reviews\Includes\Admin\Admin_Notice;
use WP_Rplg_Google_Reviews\Includes\Admin\Admin_Feed_Columns;
use WP_Rplg_Google_Reviews\Includes\Admin\Admin_Rev;
use WP_Rplg_Google_Reviews\Includes\Admin\Admin_Rateus_Ajax;

use WP_Rplg_Google_Reviews\Includes\Core\Core;
use WP_Rplg_Google_Reviews\Includes\Core\Connect_Google;
use WP_Rplg_Google_Reviews\Includes\Core\Connect_Google_New;
use WP_Rplg_Google_Reviews\Includes\Core\Connect_Helper;
use WP_Rplg_Google_Reviews\Includes\Core\Database;

final class Plugin {

    protected $name;
    protected $version;
    protected $activator;
    protected $deactivator;

    public function __construct() {
        $this->name = 'widget-google-reviews';
        $this->version = GRW_VERSION;
    }

    public function register() {
        register_activation_hook(GRW_PLUGIN_FILE, array($this, 'activate'));
        register_deactivation_hook(GRW_PLUGIN_FILE, array($this, 'deactivate'));

        add_action('admin_init', array($this, 'admin_init'));
        add_action('plugins_loaded', array($this, 'register_services'));
    }

    public function admin_init() {
        if (get_option('grw_do_activation', false)) {
            delete_option('grw_do_activation');
            wp_safe_redirect(admin_url('admin.php?page=grw'));
        }
    }

    public function register_services() {
        $database = new Database();

        $activator = new Activator($database);
        $activator->register();

        $assets = new Assets(GRW_ASSETS_URL, $this->version, get_option('grw_debug_mode') == '1');
        $assets->register();

        $post_types = new Post_Types();
        $post_types->register();

        $feed_deserializer = new Feed_Deserializer(new \WP_Query());

        $debug_info = new Debug_Info($activator, $feed_deserializer);

        $core = new Core();

        $view = new View();

        $builder_page = new Builder_Page($feed_deserializer, $core, $view);
        $builder_page->register();

        $feed_page = new Feed_Page($feed_deserializer, $builder_page);
        $feed_page->register();

        $feed_old = new Feed_Old();

        $feed_shortcode = new Feed_Shortcode($feed_deserializer, $assets, $core, $view, $feed_old);
        $feed_shortcode->register();

        Feed_Widget::$static_feed_deserializer = $feed_deserializer;
        Feed_Widget::$static_core              = $core;
        Feed_Widget::$static_view              = $view;
        Feed_Widget::$static_assets            = $assets;
        Feed_Widget::$static_feed_old          = $feed_old;
        add_action('widgets_init', function() {
            register_widget('WP_Rplg_Google_Reviews\Includes\Feed_Widget');
        });

        $feed_block = new Feed_Block($feed_deserializer, $core, $view, $assets);
        $feed_block->register();

        $connect_helper = new Connect_Helper();
        $connect_google_new = new Connect_Google_New($connect_helper);
        $connect_google = new Connect_Google($connect_google_new, $connect_helper);

        $reviews_cron = new Reviews_Cron($connect_google, $feed_deserializer);
        $reviews_cron->register();

        $this->deactivator = new Deactivator($reviews_cron);

        if (is_admin()) {
            $feed_serializer = new Feed_Serializer();
            $feed_ajax = new Feed_Ajax($connect_google_new, $feed_serializer, $feed_deserializer, $core, $view);

            $admin_notice = new Admin_Notice();
            $admin_notice->register();

            $admin_menu = new Admin_Menu();
            $admin_menu->register();

            $admin_tophead = new Admin_Tophead();
            $admin_tophead->register();

            $admin_feed_columns = new Admin_Feed_Columns($feed_deserializer);
            $admin_feed_columns->register();

            $plugin_overview_ajax = new Plugin_Overview_Ajax($core);
            $plugin_overview = new Plugin_Overview($feed_deserializer, $builder_page);
            $plugin_overview->register();

            $settings_save = new Settings_Save($activator, $reviews_cron);
            $settings_save->register();

            $plugin_settings = new Plugin_Settings($feed_deserializer, $builder_page, $debug_info);
            $plugin_settings->register();

            $plugin_support = new Plugin_Support($debug_info);
            $plugin_support->register();

            $admin_rev = new Admin_Rev();
            $admin_rev->register();

            $rateus_ajax = new Admin_Rateus_Ajax();
        }
    }

    public function activate($network_wide = false) {
        $now = time();
        update_option('grw_activation_time', $now);

        add_option('grw_is_multisite', $network_wide);

        add_option('grw_do_activation', true);

        $activator = new Activator(new Database());
        $activator->activate();
    }

    public function deactivate() {
        $this->deactivator->deactivate();
    }
}