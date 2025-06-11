<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

class Google_Connect {

    private $api_old;
    private $api_new;

    public function __construct(Google_Api_Old $api_old, Google_Api_New $api_new) {
        $this->api_old = $api_old;
        $this->api_new = $api_new;

        add_action('wp_ajax_grw_hide_review', array($this, 'hide_review'));
        add_action('wp_ajax_grw_connect_google', array($this, 'connect_google'));
        add_action('wp_ajax_grw_place_autocomplete', array($this, 'place_autocomplete'));
        add_action('wp_ajax_grw_get_place', array($this, 'get_place'));
    }

    public function hide_review() {
        global $wpdb;

        if (current_user_can('editor') || current_user_can('administrator')) {
            if (isset($_POST['grw_wpnonce']) === false) {
                $error = __('Unable to call request. Make sure you are accessing this page from the Wordpress dashboard.', 'widget-google-reviews');
                $response = compact('error');
            } else {
                check_admin_referer('grw_wpnonce', 'grw_wpnonce');

                $review = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT * FROM " . $wpdb->prefix . Database::REVIEW_TABLE .
                        " WHERE id = %d", $_POST['id']
                    )
                );

                $hide = $review->hide == '' ? 'y' : '';
                $wpdb->update($wpdb->prefix . Database::REVIEW_TABLE, array('hide' => $hide), array('id' => $_POST['id']));

                // Cache clear
                if (isset($_POST['feed_id'])) {
                    delete_transient('grw_feed_' . GRW_VERSION . '_' . $_POST['feed_id'] . '_reviews', false);
                } else {
                    $feed_ids = get_option('grw_feed_ids');
                    if (!empty($feed_ids)) {
                        $ids = explode(",", $feed_ids);
                        foreach ($ids as $id) {
                            delete_transient('grw_feed_' . GRW_VERSION . '_' . $id . '_reviews', false);
                        }
                    }
                }

                $response = array('hide' => $hide);
            }
            header('Content-type: text/javascript');
            echo json_encode($response);
            die();
        }
    }

    public function connect_google() {
        if (current_user_can('manage_options')) {

            $response = null;

            if (isset($_POST['grw_wpnonce']) === false) {
                $error = __('Unable to call request. Make sure you are accessing this page from the Wordpress dashboard.', 'widget-google-reviews');
                $response = compact('error');
            } else {
                check_admin_referer('grw_wpnonce', 'grw_wpnonce');

                if (isset($_POST['key'])) {
                    $key = sanitize_text_field(wp_unslash($_POST['key']));
                    if (strlen($key) > 0) {
                        update_option('grw_google_api_key', $key);
                    }
                }

                $pid = sanitize_text_field(wp_unslash($_POST['id']));
                $lang = sanitize_text_field(wp_unslash($_POST['lang']));
                $local_img = sanitize_text_field(wp_unslash($_POST['local_img']));
                $key = get_option('grw_google_api_key');

                if ($key && strlen($key) > 0) {

                    $gpa_old = get_option('grw_gpa_old');
                    if ($gpa_old === 'true') {
                        $response = $this->api_old->connect($pid, $lang, $key, $local_img);
                    } else {
                        $response = $this->api_new->connect($pid, $lang, $key, $local_img);
                    }

                } else {
                    $token = isset($_POST['token']) ? sanitize_text_field(wp_unslash($_POST['token'])) : null;
                    if (strlen($token) > 0) {
                        $siteurl = get_option('siteurl');
                        $authcode = get_option('grw_auth_code');
                        $url = 'https://app.richplugins.com/gpaw2/get/json?' .
                               'pid=' . $pid . '&token=' . $token .
                               '&siteurl=' . $siteurl . '&authcode=' . $authcode .
                               ($lang && strlen($lang) > 0 ? '&lang=' . $lang : '');

                        $response = $this->api_old->call($url, null, $local_img);
                    }
                }

                if (isset($_POST['feed_id'])) {
                    delete_transient('grw_feed_' . GRW_VERSION . '_' . $_POST['feed_id'] . '_reviews', false);
                }
            }

            header('Content-type: text/javascript');
            echo json_encode($response);
            die();
        }
    }

     public function place_autocomplete() {
        if (current_user_can('manage_options')) {
            if (isset($_POST['grw_nonce']) === false) {
                $error = __('Unable to call request. Make sure you are accessing this page from the Wordpress dashboard.', 'widget-google-reviews');
                $result = compact('error');
            } else {
                check_admin_referer('grw_wpnonce', 'grw_nonce');

                $key = get_option('grw_google_api_key');
                if (strlen($key) > 0) {
                    $input = sanitize_text_field(wp_unslash($_POST['input']));
                    $url = GRW_GOOGLE_PLACE_API . 'autocomplete/json?input=' . $input . '&types=establishment&key=' . $key;
                    $res = wp_remote_get($url);
                    $body = wp_remote_retrieve_body($res);
                    $result = json_decode($body);
                }
            }

            header('Content-type: text/json');
            echo json_encode($result);
            wp_die();
        }
    }

    public function get_place() {
        if (current_user_can('manage_options')) {

            $response = null;

            if (isset($_POST['grw_nonce']) === false) {
                $error = __('Unable to call request. Make sure you are accessing this page from the Wordpress dashboard.', 'widget-google-reviews');
                $response = compact('error');
            } else {
                check_admin_referer('grw_wpnonce', 'grw_nonce');

                $pid = sanitize_text_field(wp_unslash($_POST['pid']));
                $lang = isset($_POST['lang']) ? sanitize_text_field(wp_unslash($_POST['lang'])) : null;
                $key = get_option('grw_google_api_key');

                if ($key && strlen($key) > 0) {

                    $gpa_old = get_option('grw_gpa_old');
                    if ($gpa_old === 'true') {
                        $response = $this->api_old->place($pid, $lang, $key);
                    } else {
                        $response = $this->api_new->place($pid, $lang, $key);
                    }

                } else {
                    $token = isset($_POST['token']) ? sanitize_text_field(wp_unslash($_POST['token'])) : null;
                    if (strlen($token) > 0) {
                        $siteurl = get_option('siteurl');
                        $authcode = get_option('grw_auth_code');

                        $url = 'https://app.richplugins.com/gpaw2/place/json?' .
                               'pid=' . $pid . '&token=' . $token .
                               '&siteurl=' . $siteurl . '&authcode=' . $authcode .
                               ($lang && strlen($lang) > 0 ? '&lang=' . $lang : '');

                        $response = $this->api_old->call($url, null, $local_img, false);
                    }
                }
            }

            header('Content-type: text/json');
            echo json_encode($response);
            wp_die();
        }
    }

    public function refresh($args) {
        $pid = $args[0];
        $lang = $args[1];
        $local_img = isset($args[2]) ? $args[2] : 'false';

        $key = get_option('grw_google_api_key');
        if ($key && strlen($key) > 0) {

            $gpa_old = get_option('grw_gpa_old');
            if ($gpa_old === 'true') {
                $response = $this->api_old->refresh($pid, $lang, $key, $local_img);
            } else {
                $response = $this->api_new->connect($pid, $lang, $key, $local_img);
            }
        }
    }

}