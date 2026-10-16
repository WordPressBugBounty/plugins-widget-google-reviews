<?php

namespace WP_Rplg_Google_Reviews\Includes;

// The designs of the CDN's assets/json/themes.json: what the Create Widget page offers and copies into a widget (its layouts, its
// variables, its options). A widget holds its own look; nothing here is read when it renders.
class Themes {

    // The choices of the cards' shadow control.
    const SHADOWS = array(
        'none'  => 'none',
        'light' => '0 2px 10px rgba(0, 0, 0, .04)',
        'soft'  => '0 1px 2px rgba(0, 0, 0, .06), 0 2px 8px rgba(0, 0, 0, .08)',
        'grw'   => 'var(--rev-shadow)',
    );

    // The option keys of older widgets that a layout string replaces: dropped from a save that carries the string.
    const LEGACY_CARD = array('card_style');
    const LEGACY_RATING = array('header_center', 'header_hide_photo', 'header_hide_name', 'header_show_scale', 'header_platform', 'header_order',
                                'header_bold_count', 'header_short_count', 'header_hide_grade', 'hide_based_on', 'hide_writereview',
                                'badge_logo_hide', 'badge_based_hide', 'badge_onestar', 'badge_compact', 'badge_order', 'badge_dot', 'badge_author_hide',
                                'badge_toprated', 'badge_icon');

    const CSS_VARS_MAX = 20000;

    // In the CSS variables field every card variable may start with --card-; these three keep their older names on the page.
    const ALIASES = array('--card-name-color' => '--name-color', '--card-time-color' => '--time-color', '--card-img-filter' => '--img-filter');

    private static $themes;

    // In debug mode the file comes from the CDN, as the rpi modules do; otherwise, or if the CDN does not answer, the copy the build put beside them.
    public static function all() {
        if (self::$themes === null) {
            $json = null;
            if (get_option('grw_debug_mode') == '1') {
                $res = wp_remote_get(apply_filters('grw_cdn_url', 'https://cdn.reviewsplugin.com') . '/assets/json/themes.json', array('timeout' => 3));
                if (wp_remote_retrieve_response_code($res) === 200) $json = json_decode(wp_remote_retrieve_body($res), true);
            }
            if (!is_array($json)) {
                $file = GRW_PLUGIN_PATH . 'assets/' . GRW_VERSION . '/themes.json';
                $json = is_readable($file) ? json_decode(file_get_contents($file), true) : null;
            }
            self::$themes = array();
            foreach (is_array($json) && isset($json['themes']) && is_array($json['themes']) ? $json['themes'] : array() as $theme) {
                if (!is_array($theme) || empty($theme['id']) || empty($theme['opts']['view_mode'])) continue;
                self::$themes[] = $theme + array('name' => '', 'vars' => array());
            }
        }
        return self::$themes;
    }

    public static function get($id) {
        foreach (self::all() as $theme) {
            if ($theme['id'] === $id) return $theme;
        }
        return null;
    }

    // The first design of a layout in the file: what a widget made outside the gallery starts with.
    public static function first($mode) {
        foreach (self::all() as $theme) {
            if ($theme['opts']['view_mode'] === $mode) return $theme;
        }
        return null;
    }

    // What a design puts into a widget: its options and its variables as style_vars.
    public static function options($theme) {
        return $theme['opts'] + array('style_vars' => self::declarations($theme['vars']));
    }

    // The card variables the card controls set; the save checks their values, every other variable is kept as the builder has always kept it.
    const CARD_VARS = array('--card-bg', '--card-tail', '--card-br', '--card-br-color', '--card-shadow', '--card-radius', '--card-band-bg', '--card-sep-color',
                            '--card-star-color', '--card-star-size', '--name-color', '--card-color', '--time-color', '--card-img-size', '--img-filter', '--card-text-lines');

    // What the admin pages draw and edit widgets with.
    public static function client() {
        return array('themes' => self::all(), 'shadows' => self::SHADOWS, 'legacy' => Legacy_Presets::PRESETS);
    }

    public static function declarations($vars) {
        $css = '';
        foreach ($vars as $k => $v) $css .= $k . ':' . $v . ';';
        return $css;
    }

    // On save: the layouts in canonical form or empty, the keys they replace gone, the variables only as the controls set them.
    public static function sanitize($options) {
        foreach (array('card_layout' => 'card', 'rating_layout' => 'rating') as $key => $kind) {
            if (!isset($options[$key])) continue;
            try {
                $options[$key] = is_string($options[$key]) && $options[$key] !== '' ? Card_Engine::serialize(Card_Engine::parse($options[$key], $kind)) : '';
            } catch (\InvalidArgumentException $e) {
                $options[$key] = '';
            }
        }
        // A widget in the current model holds both strings (a badge only the rating one); either one means the older keys are stale.
        if (!empty($options['card_layout']) || !empty($options['rating_layout'])) {
            foreach (array_merge(self::LEGACY_CARD, self::LEGACY_RATING) as $key) unset($options[$key]);
        }
        if (isset($options['style_vars']) && !is_string($options['style_vars'])) {
            $options['style_vars'] = '';
        }
        if (!empty($options['style_vars'])) {
            $options['style_vars'] = preg_replace_callback('/(--[\w-]+)\s*:([^;]*);?/', function($m) {
                return in_array($m[1], self::CARD_VARS, true) && !self::valid($m[1], trim($m[2])) ? '' : $m[0];
            }, $options['style_vars']);
        }
        if (isset($options['css_vars'])) {
            $text = is_string($options['css_vars']) ? str_replace(array('<', '>'), '', $options['css_vars']) : '';
            // Cut after the last whole declaration: a cut inside a value would put another value on the page.
            if (mb_strlen($text, 'UTF-8') > self::CSS_VARS_MAX) $text = preg_replace('~[^;\n]*$~', '', mb_substr($text, 0, self::CSS_VARS_MAX, 'UTF-8'));
            $options['css_vars'] = $text;
        }
        return $options;
    }

    // The CSS variables field as kept for the page: only "--name: value" declarations with plain values, the rest of the text ignored.
    // !important wins over the settings, and keeps the builder from reading these back into style_vars.
    public static function css_vars($text) {
        if (!is_string($text) || $text === '') return '';
        $css = '';
        // Saved text is capped in characters already; this bound in bytes only guards older data, and it too ends at a whole declaration.
        if (strlen($text) > 4 * self::CSS_VARS_MAX) $text = preg_replace('~[^;\n]*$~', '', substr($text, 0, 4 * self::CSS_VARS_MAX));
        $text = preg_replace('~/\*.*?(\*/|$)~s', '', $text);
        // A line ending in a comma goes on: a shadow or a font list pasted over several lines.
        $text = preg_replace('~,\s*[\r\n]\s*~', ', ', $text);
        preg_match_all('~(?<![\w-])(--[\w-]{1,100})\s*:([^;{}\r\n]*)~', $text, $m, PREG_SET_ORDER);
        $bg = null;
        $tail = false;
        foreach ($m as $d) {
            $v = trim(preg_replace('~!\s*important\s*$~i', '', trim($d[2])));
            if ($v !== '' && strlen($v) <= 500 && preg_match('~^[\w\s#%.,()/*+-]+$~', $v) && !preg_match('~url\(|expression\(|/\*|,$~i', $v) && self::balanced($v)) {
                $name = isset(self::ALIASES[$d[1]]) ? self::ALIASES[$d[1]] : $d[1];
                $css .= $name . ':' . $v . '!important;';
                if ($name === '--card-bg') $bg = $v;
                if ($name === '--card-tail') $tail = true;
            }
        }
        // As with the builder's background control, the speech bubble's tail takes the background unless the field sets it.
        return $bg !== null && !$tail ? $css . '--card-tail:' . $bg . '!important;' : $css;
    }

    // An unclosed bracket would swallow every declaration after it.
    private static function balanced($v) {
        $depth = 0;
        foreach (str_split($v) as $c) {
            $depth += $c === '(' ? 1 : ($c === ')' ? -1 : 0);
            if ($depth < 0) return false;
        }
        return $depth === 0;
    }

    // Colours keep the alphabet the builder has always saved (#hex, names); the rest are the values of the card controls.
    private static function valid($name, $v) {
        $px = function($min, $max) use ($v) {
            return preg_match('/^(\d+)px$/', $v, $m) && $m[1] >= $min && $m[1] <= $max;
        };
        switch ($name) {
            case '--card-bg':
            case '--card-tail':      return (bool) preg_match('/^([#0-9a-z]+|linear-gradient\(135deg, #[0-9a-f]{6}, #[0-9a-f]{6}\))$/i', $v);
            case '--card-br':        return $v === '1px solid' || $v === 'none';
            case '--card-shadow':    return in_array($v, self::SHADOWS, true);
            case '--card-radius':    return $px(0, 24);
            case '--card-star-size': return $px(12, 28);
            case '--card-img-size':  return $px(32, 64);
            case '--img-filter':     return $v === 'none' || $v === 'grayscale(1)';
            case '--card-text-lines': return (bool) preg_match('/^([1-9]|1[0-9]|20|none)$/', $v);
        }
        return (bool) preg_match('/^[#0-9a-z]+$/i', $v);
    }
}
