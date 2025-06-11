<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

class Google_Utils {

    private $api_old;
    private $api_new;

    public function __construct(Google_Api_Old $api_old, Google_Api_New $api_new) {
        $this->api_old = $api_old;
        $this->api_new = $api_new;
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