<?php
namespace WP_Rplg_Google_Reviews\Includes\Core;

class Connect_Helper {

    public function upload_image($url, $name) {

        $res = wp_remote_get($url, array('timeout' => 8));
        if (is_wp_error($res)) {
            $this->log_error('remote_get: ' . $res->get_error_message());
            return $url;
        }

        $code = wp_remote_retrieve_response_code($res);
        if ($code !== 200) {
            $this->log_error('remote_get http ' . $code . ' for ' . strtok($url, '?'));
            return $url;
        }

        $bits = wp_remote_retrieve_body($res);
        if (empty($bits)) {
            $this->log_error('remote_get empty body for ' . strtok($url, '?'));
            return $url;
        }

        $upload_dir = wp_upload_dir(null, true);
        if (!empty($upload_dir['error'])) {
            $this->log_error('upload_dir: ' . $upload_dir['error']);
            return $url;
        }

        $filename = $name . '.jpg';
        $full_filepath = trailingslashit($upload_dir['path']) . $filename;
        if (file_exists($full_filepath)) {
            wp_delete_file($full_filepath);
        }

        $upload = wp_upload_bits($filename, null, $bits);
        if (!empty($upload['error'])) {
            $this->log_error('upload_bits: ' . $upload['error']);
            return $url;
        }

        return isset($upload['url']) ? $upload['url'] : $url;
    }

    // What failed when a request brought no place back; never a word about the place, which may well have a rating.
    public static function failed($res, $json = null) {
        if (is_wp_error($res)) {
            $reason = $res->get_error_message();
        } else if (isset($json->error_message) || isset($json->status)) {
            $reason = isset($json->error_message) ? $json->error_message : $json->status;
        } else if (isset($json->error->message)) {
            $reason = $json->error->message;
        } else {
            $code = wp_remote_retrieve_response_code($res);
            $reason = $code == 200 ? 'the answer was empty or broken' : 'HTTP ' . trim($code . ' ' . wp_remote_retrieve_response_message($res));
        }
        // A wrong or deleted Place ID: trying again would not help.
        $later = in_array($reason, array('NOT_FOUND', 'INVALID_REQUEST'), true) ? '' : ' Try again in a few minutes.';
        return 'Could not connect: ' . rtrim($reason, '. ') . '.' . $later;
    }

    private function log_error($message) {
        $opt = get_option('grw_last_error', '');
        if (empty($opt)) {
            $opt = floor(microtime(true) * 1000) . ': ';
        }
        update_option('grw_last_error', $opt . $message . '; ');
    }
}