<?php

namespace WP_Rplg_Google_Reviews\Includes;

class Plugin_Support {

    private $debug_info;

    public function __construct($debug_info) {
        $this->debug_info = $debug_info;
    }

    public function register() {
        add_action('grw_admin_page_grw-support', array($this, 'init'));
        add_action('grw_admin_page_grw-support', array($this, 'render'));
    }

    public function init() {

    }

    public function render() {

        $tab = isset($_GET['grw_tab']) && strlen($_GET['grw_tab']) > 0 ? sanitize_text_field(wp_unslash($_GET['grw_tab'])) : 'welcome';

        $gpa_old = get_option('grw_gpa_old');
        $grw_google_api_key = get_option('grw_google_api_key');

        ?>
        <div class="grw-page-title">
            Support and Troubleshooting
        </div>

        <div class="grw-support-workspace">

            <div data-nav-tabs="">

                <div class="nav-tab-wrapper">
                    <a href="#welcome" class="nav-tab<?php if ($tab == 'welcome') { ?> nav-tab-active<?php } ?>">
                        <?php echo __('Welcome', 'widget-google-reviews'); ?>
                    </a>
                    <a href="#fig" class="nav-tab<?php if ($tab == 'fig') { ?> nav-tab-active<?php } ?>">
                        <?php echo __('Full Installation Guide', 'widget-google-reviews'); ?>
                    </a>
                    <a href="#support" class="nav-tab<?php if ($tab == 'support') { ?> nav-tab-active<?php } ?>">
                        <?php echo __('Support', 'widget-google-reviews'); ?>
                    </a>
                    <a href="#advance" class="nav-tab<?php if ($tab == 'advance') { ?> nav-tab-active<?php } ?>">
                        <?php echo __('Advance Options', 'widget-google-reviews'); ?>
                    </a>
                </div>

                <div id="welcome" class="tab-content" style="display:<?php echo $tab == 'welcome' ? 'block' : 'none'?>;">
                    <h3>Google Reviews Widget for WordPress</h3>
                    <div class="grw-flex-row">
                        <div class="grw-flex-col">
                            <span>Google Reviews plugin is an easy and fast way to integrate Google business reviews right into your WordPress website. This plugin works instantly and keep all Google places and reviews in WordPress database thus it has no depend on external services.</span>
                            <p style="font-size:20px;text-align:center"><b><u>Please read '<a href="<?php echo admin_url('admin.php?page=grw-support&grw_tab=fig'); ?>">Full Installation Guide</a>' to completely understand how it works and set up the plugin</u></b>.</p>
                            <p>Also you can find most common answers and solutions for most common questions and issues in next tabs.</p>
                            <div class="grw-alert grw-alert-success">
                                <strong>Try more features in the Business version</strong>: Merge Google, Facebook and Yelp reviews, Beautiful themes (Slider, Grid, Trust Badges), Shortcode support, Rich Snippets, Rating filter, Any sorting, Include/Exclude words filter, Hide/Show any elements, Priority support and many others.
                                <a class="button-primary button" href="https://richplugins.com/business-reviews-bundle-wordpress-plugin?promo=GRGROW23" target="_blank" style="margin-left:10px">Upgrade to Business</a>
                            </div>
                            <br>
                            <div class="grw-socials">
                                <script src="https://apis.google.com/js/platform.js"></script>
                                <div class="g-ytsubscribe" data-channelid="UCfTAPWvWJkGRVhZ1AN5DtvA" data-layout="default" data-count="default"></div>

                                <div id="fb-root" style="display:inline-block"></div>
                                <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v12.0&appId=276175796521349&autoLogAppEvents=1" nonce="MYsLkxjF"></script>
                                <div class="fb-like" data-href="https://richplugins.com/" data-layout="button_count" data-action="like" data-show-faces="true" data-share="false"></div>

                                <a href="https://twitter.com/richplugins?ref_src=twsrc%5Etfw" class="twitter-follow-button" data-show-count="false">Follow @richplugins</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                            </div>
                        </div>
                        <div class="grw-flex-col">
                            <iframe width="100%" height="315" src="https://www.youtube.com/embed/rMbwqCjDc80" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>

                <div id="fig" class="tab-content" style="display:<?php echo $tab == 'fig' ? 'block' : 'none'?>;">
                    <h3>How to connect Google reviews</h3>
                    <?php include_once(dirname(GRW_PLUGIN_FILE) . '/includes/page-setting-fig.php'); ?>
                </div>

                <div id="support" class="tab-content" style="display:<?php echo $tab == 'support' ? 'block' : 'none'?>;">
                    <h3>Most Common Questions</h3>
                    <?php include_once(dirname(GRW_PLUGIN_FILE) . '/includes/page-setting-support.php'); ?>
                </div>

                <div id="advance" class="tab-content" style="display:<?php echo $tab == 'advance' ? 'block' : 'none'?>;">
                    <h3>Advance Options</h3>
                    <?php include_once(dirname(GRW_PLUGIN_FILE) . '/includes/page-setting-advance.php'); ?>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php?action=grw_settings_save&grw_tab=advance')); ?>">
                        <?php wp_nonce_field('grw-wpnonce_save', 'grw-form_nonce_save'); ?>
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
                                <div style="padding-top:15px">
                                    <input type="submit" value="Save" name="save" class="button" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

            </div>
        </div>
        <?php
    }
}
