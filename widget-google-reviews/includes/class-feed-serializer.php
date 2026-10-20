<?php

namespace WP_Rplg_Google_Reviews\Includes;

class Feed_Serializer {

    public function save($post_id, $title, $content) {

        if (!current_user_can('manage_options')) {
            die('The account you\'re logged in to doesn\'t have permission to access this page.');
        }

        check_admin_referer('grw_wpnonce', 'grw_nonce');

        $json = $this->sanitize_json(wp_unslash($content));

        // Storing a broken payload leaves a widget that cannot be rendered or repaired.
        if ($json === false) {
            return false;
        }

        $post_id = wp_insert_post(array(
            'ID'           => sanitize_text_field(wp_unslash($post_id)),
            'post_title'   => sanitize_text_field(wp_unslash($title)),
            // wp_insert_post() unslashes its input; without this every JSON escape loses its backslash.
            'post_content' => wp_slash($json),
            'post_type'    => Post_Types::FEED_POST_TYPE,
            'post_status'  => 'publish',
        ));
        return $post_id;
    }

    function sanitize_json($json) {
        $arr = json_decode($json, true, 512, JSON_INVALID_UTF8_SUBSTITUTE);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // TODO: log
            return false;
        }

        $this->sanitize_json_recurs($arr);
        if (isset($arr['options']) && is_array($arr['options'])) {
            $arr['options'] = Themes::sanitize($arr['options']);
        }
        return wp_json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    function sanitize_json_recurs(&$input) {
        if (!is_array($input)) return;

        foreach ($input as $key => &$value) {
            if (is_array($value)) {
                $this->sanitize_json_recurs($value);
                continue;
            }

            if (is_string($key) && is_string($value)) {
                if (stripos($key, 'url') !== false) {
                    $value = esc_url_raw($value);
                } else {
                    $value = sanitize_textarea_field($value);
                }
            }
        }
        unset($value);
    }
}
