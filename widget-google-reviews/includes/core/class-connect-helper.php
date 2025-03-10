<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

class Connect_Helper {

    public function upload_image($url, $name) {
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