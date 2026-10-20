<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

// The place's own setting (the Places page) first, then the widget connection's (7.1 widgets carry refresh, local_img, a photo), then the default; isset() covers NULL columns and a table the version bump has not reached.
final class Place_Settings {

    const COLUMNS = array(
        'refresh'      => 'TINYINT(1)',
        'local_img'    => 'TINYINT(1)',
        'custom_photo' => 'VARCHAR(255)',
    );

    // MySQL hands a TINYINT back as a string, and old connections may hold 'true' / 'false'.
    public static function on($value) {
        return is_string($value) ? filter_var($value, FILTER_VALIDATE_BOOLEAN) : (bool) $value;
    }

    // $conns: the widget connections of the place. Without its own value a place refreshes when any of them says so (a connection without the flag says yes); with none, it does not.
    public static function refresh($place, $conns) {
        return isset($place->refresh) ? self::on($place->refresh) : self::by_widgets($conns);
    }

    public static function by_widgets($conns) {
        foreach ($conns as $conn) {
            if (!isset($conn->refresh) || self::on($conn->refresh)) return true;
        }
        return false;
    }

    // $default may be a closure, so a fallback query runs only for a place without a value of its own.
    public static function local_img($place, $default) {
        if (isset($place->local_img)) return self::on($place->local_img);
        return self::on($default instanceof \Closure ? $default() : $default);
    }

    public static function photo($place, $conn = null) {
        return !empty($place->custom_photo) ? $place->custom_photo : self::clean(!empty($conn->photo) ? $conn->photo : $place->photo);
    }

    // Google's own photo, apart from the custom one (the Places form's "Google's photo").
    public static function google_photo($place) {
        return self::clean($place->photo);
    }

    private static function clean($photo) {
        // Photo URLs stored by 7.1 and older may carry the Google API key
        return empty($photo) || strpos($photo, 'key=') !== false ? GRW_GOOGLE_BIZ : $photo;
    }
}
