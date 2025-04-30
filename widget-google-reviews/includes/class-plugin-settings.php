<?php

namespace WP_Rplg_Google_Reviews\Includes;

class Plugin_Settings {

    private $feed_deserializer;
    private $builder_page;
    private $debug_info;

    public function __construct($feed_deserializer, $builder_page, $debug_info) {
        $this->feed_deserializer = $feed_deserializer;
        $this->builder_page = $builder_page;
        $this->debug_info = $debug_info;
    }

    public function register() {
        $render_func;
        $feed_count = $this->feed_deserializer->get_feed_count();
        if ($feed_count < 1) {
            $render_func = array($this, 'connect');
        } else {
            $render_func = array($this, 'render');
        }

        add_action('grw_admin_page_grw-settings', array($this, 'init'));
        add_action('grw_admin_page_grw-settings', $render_func);
    }

    public function init() {

    }

    public function connect() {
        $this->builder_page->render(null);
    }

    public function render() {

        $tab = isset($_GET['grw_tab']) && strlen($_GET['grw_tab']) > 0 ? sanitize_text_field(wp_unslash($_GET['grw_tab'])) : 'active';

        $grw_enabled         = get_option('grw_active') == '1';
        $async_css           = get_option('grw_async_css');
        $grw_demand_assets   = get_option('grw_demand_assets');
        $grw_freq_revs_upd   = get_option('grw_freq_revs_upd');
        $gpa_old             = get_option('grw_gpa_old');
        $grw_google_api_key  = get_option('grw_google_api_key');
        $grw_activation_time = get_option('grw_activation_time');
        ?>

        <div class="grw-page-title">
            Settings
        </div>

        <?php do_action('grw_admin_notices'); ?>

        <div class="grw-settings-workspace">

            <div data-nav-tabs="">

                <div class="nav-tab-wrapper">
                    <a href="#grw-general"  class="nav-tab<?php if ($tab == 'active')   { ?> nav-tab-active<?php } ?>">General</a>
                    <a href="#grw-google"   class="nav-tab<?php if ($tab == 'google')   { ?> nav-tab-active<?php } ?>">Google</a>
                    <a href="#grw-advance"  class="nav-tab<?php if ($tab == 'advance')  { ?> nav-tab-active<?php } ?>">Advance</a>
                </div>

                <div id="grw-general" class="tab-content" style="display:<?php echo $tab == 'active' ? 'block' : 'none'?>;">
                    <h3>General Settings</h3>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php?action=grw_settings_save&grw_tab=active&active=' . (string)((int)($grw_enabled != true)))); ?>">
                        <div class="grw-field">
                            <div class="grw-field-label">
                                <label>Google Reviews plugin is currently <b><?php echo $grw_enabled ? 'enabled' : 'disabled' ?></b></label>
                            </div>
                            <div class="wp-review-field-option">
                                <?php wp_nonce_field('grw-wpnonce_active', 'grw-form_nonce_active'); ?>
                                <input type="submit" name="active" class="button" value="<?php echo $grw_enabled ? 'Disable' : 'Enable'; ?>" />
                            </div>
                        </div>
                        <div class="grw-field">
                            <div class="grw-field-label">
                                <label>Async CSS assets</label>
                            </div>
                            <div class="wp-review-field-option">
                                <label>
                                    <input type="hidden" name="grw_async_css" value="false">
                                    <input type="checkbox" id="grw_async_css" name="grw_async_css" value="true" <?php checked('true', $async_css); ?>>
                                    Asynchronous CSS loads in the background
                                </label>
                            </div>
                        </div>
                        <div class="grw-field">
                            <div class="grw-field-label">
                                <label>Load assets on demand</label>
                            </div>
                            <div class="wp-review-field-option">
                                <label>
                                    <input type="hidden" name="grw_demand_assets" value="false">
                                    <input type="checkbox" id="grw_demand_assets" name="grw_demand_assets" value="true" <?php checked('true', $grw_demand_assets); ?>>
                                    Load static assets (JS/CSS) only on pages where reviews are showing
                                </label>
                                <div style="padding-top:15px">
                                    <input type="submit" value="Save" name="save" class="button" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div id="grw-google" class="tab-content" style="display:<?php echo $tab == 'google' ? 'block' : 'none'?>;">
                    <h3>Google</h3>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php?action=grw_settings_save&grw_tab=google')); ?>">
                        <?php wp_nonce_field('grw-wpnonce_save', 'grw-form_nonce_save'); ?>
                        <div class="grw-field">
                            <div class="grw-field-label">
                                <label>Frequency of review updates</label>
                            </div>
                            <div class="wp-review-field-option">
                                <select name="grw_freq_revs_upd">
                                    <option value="daily" <?php selected('daily', $grw_freq_revs_upd); ?>>Daily</option>
                                    <option value="weekly" <?php selected('weekly', $grw_freq_revs_upd); ?>>Once weekly</option>
                                    <option value="fortnightly " <?php selected('fortnightly', $grw_freq_revs_upd); ?>>Every two weeks </option>
                                    <option value="monthly" <?php selected('monthly', $grw_freq_revs_upd); ?>>Once monthly</option>
                                </select>
                            </div>
                        </div>
                        <div class="grw-field">
                            <div class="grw-field-label">
                                <label>Use old Places API</label>
                            </div>
                            <div class="wp-review-field-option">
                                <label>
                                    <input type="hidden" name="grw_gpa_old" value="false">
                                    <input type="checkbox" id="grw_gpa_old" name="grw_gpa_old" value="true" <?php checked('true', $gpa_old); ?>>
                                    Applies to API keys created before March 1, 2025,<br>provided that the Places API (New) has not been enabled in Google Console.
                                </label>
                            </div>
                        </div>
                        <div class="grw-field">
                            <div class="grw-field-label">
                                <label>Google Places API key</label>
                            </div>
                            <div class="wp-review-field-option">
                                <input type="text" id="grw_google_api_key" name="grw_google_api_key" class="regular-text" value="<?php echo esc_attr($grw_google_api_key); ?>">
                                <?php if (!$grw_google_api_key && time() - $grw_activation_time > 60 * 60 * 48) { ?>
                                <div class="grw-warn">Your Google API key is not set for this reason, reviews are not automatically updated daily.<br>Please create your own Google API key and save here.</div>
                                <?php } ?>
                                <p>Google API key is required to automatically update and fetch new reviews.<br>With your own API key, there's no limit to collecting reviews, you can connect more than 10 and collect them daily.</p>
                                <p>After you created your own API key, it's required to add your bank card to confirm usage of this Key.<br>Please do not worry <b>Google gives 1000 free API requests monthly</b> and<br>it's enough for automatically updated up to 2-3 connected your Google places.</p>
                                <p>Here is extrimy complete guide on <a href="<?php echo admin_url('admin.php?page=grw-support&grw_tab=fig#fig_api_key'); ?>" target="_blank">how to create your own API key</a>.</p>
                                <div style="padding-top:15px">
                                    <input type="submit" value="Save" name="save" class="button" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div id="grw-advance" class="tab-content" style="display:<?php echo $tab == 'advance' ? 'block' : 'none'?>;">
                    <h3>Advance</h3>
                    <?php include_once(dirname(GRW_PLUGIN_FILE) . '/includes/page-setting-advance.php'); ?>
                </div>

            </div>

        </div>
        <?php
    }

}
