<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;
use WP_Rplg_Google_Reviews\Includes\Core\Connect_Google_New;

class Feed_Ajax {

    private $core;
    private $view;
    private $feed_serializer;
    private $feed_deserializer;
    private $cgn;

    public function __construct(Connect_Google_New $cgn, Feed_Serializer $feed_serializer, Feed_Deserializer $feed_deserializer, Core $core, View $view) {
        $this->cgn = $cgn;
        $this->feed_serializer = $feed_serializer;
        $this->feed_deserializer = $feed_deserializer;
        $this->core = $core;
        $this->view = $view;

        add_action('wp_ajax_grw_feed_save_ajax', array($this, 'save_ajax'));
        add_action('wp_ajax_grw_get_place', array($this, 'get_place'));
    }

    public function save_ajax() {

        $post_id = $this->feed_serializer->save($_POST['post_id'], $_POST['title'], $_POST['content']);

        if (isset($post_id)) {
            $feed = $this->feed_deserializer->get_feed($post_id);

            $data = $this->core->get_reviews($feed, true);
            $businesses = $data['businesses'];
            $reviews = $data['reviews'];
            $options = $data['options'];

            echo $this->view->render($feed->ID, $businesses, $reviews, $options, true);
        }

        wp_die();
    }

    public function get_place() {
        if (current_user_can('manage_options')) {
            if (isset($_POST['grw_nonce']) === false) {
                $error = __('Unable to call request. Make sure you are accessing this page from the Wordpress dashboard.', 'widget-google-reviews');
                $response = compact('error');
            } else {
                check_admin_referer('grw_wpnonce', 'grw_nonce');

                $pid = sanitize_text_field(wp_unslash($_POST['pid']));
                $lang = isset($_POST['lang']) ? sanitize_text_field(wp_unslash($_POST['lang'])) : null;
                $token = sanitize_text_field(wp_unslash($_POST['token']));

                $google_api_key = get_option('grw_google_api_key');
                $api_key_filled = $google_api_key && strlen($google_api_key) > 0;
                $gpa_old = get_option('grw_gpa_old');

                if ($api_key_filled && $gpa_old !== 'true') {
                    $response = $this->cgn->place($pid, $google_api_key);
                } else {
                    if ($api_key_filled && $gpa_old === 'true') {
                        $url = $this->api_url($pid, $google_api_key, $lang);
                    } else {
                        $url = 'https://app.richplugins.com/gpaw2/place/json?pid=' . $pid . '&token=' . $token .
                           '&siteurl=' . get_option('siteurl') . '&authcode=' . get_option('grw_auth_code');

                        if ($lang && strlen($lang) > 0) {
                            $url = $url . '&lang=' . $lang;
                        }
                    }

                    $res = wp_remote_get($url);
                    $body = wp_remote_retrieve_body($res);
                    $body_json = json_decode($body);

                    if (!$body_json) {
                        $result = $body_json;
                        $status = 'failed';
                    } elseif (isset($body_json->error_message)) {
                        $result = array('error_message' => $body_json->error_message);
                        $status = 'failed';
                    } elseif (isset($body_json->result) && !isset($body_json->result->rating)) {
                        $result = array('error_message' => 'The place you are trying to connect to does not have a rating yet.');
                        $status = 'failed';
                    } else {
                        if ($api_key_filled) {
                            $photo = $this->business_avatar($body_json->result, $google_api_key);
                            $body_json->result->business_photo = $photo;
                        }
                        $result = $body_json->result;
                        $status = 'success';
                    }
                    $response = compact('status', 'result');
                }
            }
            header('Content-type: text/json');
            echo json_encode($response);
            wp_die();
        }
    }

    function api_url($placeid, $google_api_key, $reviews_lang = '', $reviews_sort = '') {
        $url = GRW_GOOGLE_PLACE_API . 'details/json?placeid=' . $placeid . '&key=' . $google_api_key;
        if (strlen($reviews_lang) > 0) {
            $url = $url . '&language=' . $reviews_lang;
        }
        if (strlen($reviews_sort) > 0) {
            $url = $url . '&reviews_sort=' . $reviews_sort;
        }
        return $url;
    }

    function business_avatar($response_result_json, $google_api_key) {
        if (isset($response_result_json->photos)) {
            $url = add_query_arg(
                array(
                    'photoreference' => $response_result_json->photos[0]->photo_reference,
                    'key'            => $google_api_key,
                    'maxwidth'       => '300',
                    'maxheight'      => '300',
                ),
                'https://maps.googleapis.com/maps/api/place/photo'
            );
            return $url; //$this->upload_image($url, $response_result_json->place_id);
        }
        return null;
    }

    function upload_image($url, $name) {
        $res = wp_remote_get($url, array('timeout' => 8));

        if(is_wp_error($res)) {
            // LOG
            return null;
        }

        $bits = wp_remote_retrieve_body($res);
        $filename = $name . '.jpg';

        $upload_dir = wp_upload_dir();
        $full_filepath = $upload_dir['path'] . '/' . $filename;
        if (file_exists($full_filepath)) {
            wp_delete_file($full_filepath);
        }

        $upload = wp_upload_bits($filename, null, $bits);
        return $upload['url'];
    }

}