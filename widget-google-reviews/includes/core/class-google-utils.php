<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

class Google_Utils {

    private $api_old;
    private $api_new;
    private $dao;
    private $legacy_denied = '';

    public function __construct(Google_Api_Old $api_old, Google_Api_New $api_new, Google_Dao $dao) {
        $this->api_old = $api_old;
        $this->api_new = $api_new;
        $this->dao = $dao;
    }

    // The cron's refresh of one place in one language ($local_img: a value or a closure, read when the place has none); null without an API key.
    public function refresh($place, $lang, $local_img) {
        $key = get_option('grw_google_api_key');
        if (!$key || strlen($key) === 0) {
            return null;
        }
        return $this->call('refresh', $place->place_id, $lang, $key, Place_Settings::local_img($place, $local_img));
    }

    public function local_img($pid, $default) {
        return Place_Settings::local_img($this->dao->get_place($pid), $default);
    }

    // Only the legacy API sorts reviews by newest, and Google projects created after March 2025 cannot enable it
    public function call($method, $pid, $lang, $key, $local_img = false) {
        if (!$this->legacy_denied) {
            $response = $this->api_old->$method($pid, $lang, $key, $local_img);
            $this->legacy_denied = empty($response['result']['denied']) ? '' : $response['result']['error_message'];
        }
        if ($this->legacy_denied) {
            $response = $method == 'place' ? $this->api_new->place($pid, $lang, $key) : $this->api_new->connect($pid, $lang, $key, $local_img);
        }
        if (!empty($response['result']['denied'])) {
            $error = $response['result']['error_message'];
            update_option('grw_google_api_error', 'Places API: ' . $this->legacy_denied . "\nPlaces API (New): " . (isset($error->message) ? $error->message : $error));
        } elseif ($response['status'] == 'success' && get_option('grw_google_api_error')) {
            delete_option('grw_google_api_error');
        }
        return $response;
    }

}
