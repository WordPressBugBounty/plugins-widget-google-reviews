<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;

class Plugin_Overview {

    private $feed_deserializer;
    private $builder_page;

    public function __construct($feed_deserializer, $builder_page) {
        $this->feed_deserializer = $feed_deserializer;
        $this->builder_page = $builder_page;
    }

    public function register() {
        add_action('grw_admin_page_grw', array($this, 'init'));

        $render_function;
        $feed_count = $this->feed_deserializer->get_feed_count();
        if ($feed_count < 1) {
            $render_function = array($this, 'connect');
        } else {
            $render_function = array($this, 'render');
        }

        add_action('grw_admin_page_grw', $render_function);
    }

    public function init() {

    }

    public function connect() {
        $this->builder_page->render(null);
    }

    public function render() {
        wp_nonce_field('grw_wpnonce', 'grw_nonce');
        wp_enqueue_script('grw-admin-apexcharts-js');
        ?>

        <div class="grw-page-title">
            Overview
        </div>

        <div class="grw-overview-workspace">

            <div class="grw-overview-places">
                <select id="grw-overview-months">
                    <option value="6" selected>6 months</option>
                    <option value="12">a year</option>
                    <option value="24">2 years</option>
                    <option value="36">3 years</option>
                    <option value="60">5 years</option>
                </select>
                <select id="grw-overview-places"></select>
            </div>

            <div class="grw-flex-row">
                <div class="grw-flex-col6">

                    <div class="grw-card">
                        <div class="grw-card-body">
                            <div id="chart"></div>
                        </div>
                    </div>

                </div>

                <div class="grw-flex-col4">

                    <div class="grw-flex-row">

                        <div class="grw-flex-col">
                            <div class="grw-card">
                                <div class="grw-card-header">Rating</div>
                                <div class="grw-card-body grw-card-fh">
                                    <div id="grw-overview-rating"><img src="<?php echo GRW_ASSETS_URL; ?>img/dots-spinner.svg"></div>
                                </div>
                            </div><br>
                            <div class="grw-card">
                                <div class="grw-card-header">Usage Stats</div>
                                <div class="grw-card-body grw-card-fh">
                                    <div id="grw-overview-stats"><img src="<?php echo GRW_ASSETS_URL; ?>img/dots-spinner.svg"></div>
                                </div>
                            </div>
                        </div>

                        <div class="grw-flex-col">
                            <div class="grw-card">
                                <div class="grw-card-header">Latest Reviews</div>
                                <div class="grw-card-body grw-card-fh" style="padding-top:0">
                                    <div id="grw-overview-reviews"><img src="<?php echo GRW_ASSETS_URL; ?>img/dots-spinner.svg"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>

        <?php
    }
}
