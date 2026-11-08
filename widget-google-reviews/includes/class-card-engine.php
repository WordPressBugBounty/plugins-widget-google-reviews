<?php

namespace WP_Rplg_Google_Reviews\Includes;

/*
 * Layout engine, format v1, for review cards and rating blocks: the PHP twin of the CDN js/card.js, which describes the format and
 * the kinds; both pass fixtures.json. This master lives in richplugins/plugins/shared/card-engine: plugin builds copy it, changing
 * only the namespace line.
 */
class Card_Engine {

    const KINDS = array(
        'card' => array(
            'root'     => 'rpi-card',
            'required' => 'text',
            'elements' => array('photo', 'name', 'time', 'stars', 'text', 'logo', 'platform', 'media'),
            'attrs'    => array('top' => array('photo'), 'side' => array('photo'), 'bottom' => array('photo'), 'logo' => array('photo', 'name', 'stars'), 'stars' => array('text'), 'cover' => array('media')),
        ),
        'story' => array(
            'root'     => 'rpi-card',
            'required' => null,
            'elements' => array('photo', 'name', 'time', 'stars', 'text', 'logo', 'platform', 'media', 'icon', 'phrase'),
            'attrs'    => array('top' => array('photo'), 'side' => array('photo'), 'bottom' => array('photo'), 'logo' => array('photo', 'name', 'stars'), 'stars' => array('text'), 'cover' => array('media'),
                                'on' => array('logo')),
        ),
        'rating' => array(
            'root'     => 'rpi-rate',
            'required' => null,
            'elements' => array('photo', 'name', 'title', 'scale', 'grade', 'stars', 'based', 'count', 'powered', 'wordmark', 'logo', 'badge_photo', 'badge_name', 'label', 'phrase', 'avatars', 'write', 'seeall'),
            'attrs'    => array('top' => array('photo'), 'side' => array('photo'), 'bottom' => array('photo'), 'logo' => array('photo', 'name', 'stars', 'scale', 'based'),
                                'stars' => array('text'), 'nonum' => array('stars'), 'one' => array('stars'), 'first' => array('stars'),
                                'outof' => array('grade'), 'short' => array('based', 'powered'), 'bold' => array('based', 'count'), 'dot' => array('count', 'based', 'label'),
                                'noauthor' => array('phrase'), 'icon' => array('label'), 'n' => array('avatars')),
        ),
    );
    const SECTION_ATTRS = array('center', 'band', 'sep', 'bubble', 'gap');
    const GROUP_ATTRS = array('center', 'start', 'band', 'sep', 'gap');
    // Every element takes these, after the kind's own.
    const ITEM_ATTRS = array('band', 'sep', 'gap');
    const MAX_DEPTH = 16;
    // What JavaScript's \s matches; PCRE's \s differs (U+0085, U+180E, U+FEFF).
    const SPACE = '/[\t\n\x0b\f\r \x{a0}\x{1680}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}\x{feff}]+/u';

    private $s;
    private $i = 0;
    private $depth = 0;

    private $data;
    private $p;
    private $logo_on;
    private $stars_on;
    private $bubble;
    private $avatop;
    private $avabottom;
    private $avaside;
    private $anchor_at;
    private $last_at;

    private static function kind($name) {
        return array_key_exists($name, self::KINDS) ? self::KINDS[$name] : self::KINDS['card'];
    }

    /* ------------------------------------------------------------ format */

    public static function parse($src, $kind = 'card') {
        $p = new self();
        $s = $p->s = (string) preg_replace(self::SPACE, '', (string) $src);
        $cut = strpos($s, ';');
        $flow = $cut === false ? strlen($s) : $cut;
        $sections = array();
        do {
            if ($sections) $p->i++;
            $a = (array) $p->attrs();
            $body = $p->column();
            $sections[] = array('attrs' => $a, 'items' => isset($body['dir']) && $body['dir'] === 'col' && empty($body['group']) ? $body['items'] : array($body));
        } while ($p->at() === '|' && $p->i < $flow);
        if ($p->i !== $flow) $p->unexpected();

        $corner = false;
        if ($cut !== false) {
            $p->i = $cut + 1;
            foreach (explode(';', (string) substr($s, $cut + 1)) as $o) {
                if (!preg_match('/^([a-z_]+)(?:\{([a-z_0-9:,]*)\})?$/', $o, $m)) $p->fail('bad overlay "' . $o . '"');
                if ($m[1] === 'logo') $corner = in_array('start', explode(',', isset($m[2]) ? $m[2] : ''), true) ? 'start' : true;
                $p->i += strlen($o) + 1;
            }
        }
        return self::normalize(array('kind' => array_key_exists($kind, self::KINDS) ? $kind : 'card', 'sections' => $sections, 'corner' => $corner));
    }

    private function at() {
        return $this->i < strlen($this->s) ? $this->s[$this->i] : '';
    }

    // $this->i counts bytes; messages count characters, as card.js does.
    private function fail($msg) {
        throw new \InvalidArgumentException($msg . ' (position ' . (preg_match_all('/./su', (string) substr($this->s, 0, $this->i)) + 1) . ')');
    }

    private function unexpected() {
        $this->fail(preg_match('/./su', $this->s, $m, 0, $this->i) ? 'unexpected "' . $m[0] . '"' : 'unexpected end');
    }

    private function attrs() {
        if ($this->at() !== '{') return null;
        $end = strpos($this->s, '}', $this->i);
        if ($end === false) $this->fail('missing }');
        // ";" starts the overlays, so it cannot appear inside braces.
        $semi = strpos(substr($this->s, $this->i, $end - $this->i), ';');
        if ($semi !== false) {
            $this->i += $semi;
            $this->unexpected();
        }
        $out = array();
        foreach (explode(',', substr($this->s, $this->i + 1, $end - $this->i - 1)) as $a) {
            if ($a === '') continue;
            $kv = explode(':', $a);
            if (!preg_match('/^[a-z_]+$/', $kv[0])) $this->fail('bad attribute "' . $a . '"');
            $out[$kv[0]] = !isset($kv[1]) ? true : (preg_match('/^\d{1,9}$/', $kv[1]) ? (int) $kv[1] : $kv[1]);
        }
        $this->i = $end + 1;
        return $out;
    }

    private function column() {
        $items = array($this->row());
        while ($this->at() === ',') {
            $this->i++;
            $items[] = $this->row();
        }
        return count($items) === 1 ? $items[0] : array('dir' => 'col', 'items' => $items);
    }

    private function row() {
        $items = array($this->item());
        while ($this->at() === '+' || $this->at() === '(') {
            if ($this->at() === '+') $this->i++;
            $items[] = $this->item();
        }
        return count($items) === 1 ? $items[0] : array('dir' => 'row', 'items' => $items);
    }

    private function item() {
        $hidden = $this->at() === '-';
        if ($hidden) $this->i++;
        if ($this->at() === '(') {
            if (++$this->depth > self::MAX_DEPTH) $this->fail('groups nested too deep');
            $this->i++;
            $inner = $this->column();
            if ($this->at() !== ')') $this->fail('missing )');
            $this->i++;
            $this->depth--;
            $node = isset($inner['dir']) && $inner['dir'] === 'col' ? $inner : array('dir' => 'col', 'items' => array($inner));
            $node['group'] = true;
        } elseif ($this->at() === '~') {
            $this->i++;
            $node = array('spacer' => true);
        } else {
            $n = strspn($this->s, 'abcdefghijklmnopqrstuvwxyz_', $this->i);
            if (!$n) $this->unexpected();
            $node = array('el' => substr($this->s, $this->i, $n));
            $this->i += $n;
        }
        $a = $this->attrs();
        if ($a !== null) $node['attrs'] = $a;
        if ($hidden) $node['hidden'] = true;
        return $node;
    }

    // Known attrs in a fixed order, so one layout has one spelling; attrs from a newer format are kept as they are.
    private static function tidy($a, $known, $K) {
        if (!$a) return null;
        $out = array();
        foreach ($known as $k) {
            if (isset($a[$k]) && ($k !== 'gap' || is_int($a[$k]))) $out[$k] = $a[$k];
        }
        foreach ($a as $k => $v) {
            if (!in_array($k, self::SECTION_ATTRS, true) && !in_array($k, self::GROUP_ATTRS, true) && !in_array($k, self::ITEM_ATTRS, true) && !array_key_exists($k, $K['attrs'])) $out[$k] = $v;
        }
        return $out ? $out : null;
    }

    private static function normalize($model) {
        $K = self::kind($model['kind']);
        $seen = array();
        $sections = array();
        foreach ($model['sections'] as $c) {
            $c['attrs'] = (array) self::tidy($c['attrs'], self::SECTION_ATTRS, $K);
            $c['items'] = self::clean_all($c['items'], $seen, $K);
            if (self::filled($c['items'])) $sections[] = $c;
        }
        if ($K['required'] && !isset($seen[$K['required']])) {
            if (!$sections) $sections[] = array('attrs' => array(), 'items' => array());
            $sections[count($sections) - 1]['items'][] = array('el' => $K['required']);
        }
        if (!$sections) throw new \InvalidArgumentException('no elements');
        return array('kind' => $model['kind'], 'sections' => $sections, 'corner' => isset($seen['logo:placed']) ? false : ($model['corner'] === 'start' ? 'start' : (bool) $model['corner']));
    }

    private static function clean_all($items, &$seen, $K) {
        $out = array();
        foreach ($items as $n) {
            $n = self::clean($n, $seen, $K);
            if ($n !== null) $out[] = $n;
        }
        return $out;
    }

    private static function clean($n, &$seen, $K) {
        if (isset($n['el'])) {
            if (!in_array($n['el'], $K['elements'], true) || isset($seen[$n['el']])) return null;
            // A hidden element claims no placement: only a shown logo/stars or a host's attr takes the place (and the logo the corner's).
            if (in_array($n['el'], array('logo', 'stars'), true) && empty($n['hidden'])) {
                if (isset($seen[$n['el'] . ':placed'])) return null;
                $seen[$n['el'] . ':placed'] = true;
            }
            $seen[$n['el']] = true;
            if ($n['el'] === $K['required']) unset($n['hidden']);
            $a = isset($n['attrs']) ? $n['attrs'] : array();
            foreach ($K['attrs'] as $k => $on) {
                if (isset($a[$k]) && !in_array($n['el'], $on, true)) unset($a[$k]);
            }
            foreach (array('logo', 'stars') as $k) {
                if (empty($a[$k]) || !array_key_exists($k, $K['attrs'])) continue;
                if (isset($seen[$k . ':placed'])) unset($a[$k]);
                else $seen[$k . ':placed'] = true;
            }
            if (!empty($a['top'])) unset($a['side'], $a['bottom']);
            elseif (!empty($a['side'])) unset($a['bottom']);
            $n['attrs'] = self::tidy($a, array_merge(array_keys($K['attrs']), self::ITEM_ATTRS), $K);
            if (!$n['attrs']) unset($n['attrs']);
            return $n;
        }
        // The grammar accepts "-" on groups and spacers, but only elements can be hidden.
        unset($n['hidden']);
        $n['attrs'] = self::tidy(isset($n['attrs']) ? $n['attrs'] : null, isset($n['spacer']) ? array() : self::GROUP_ATTRS, $K);
        if (!$n['attrs']) unset($n['attrs']);
        if (isset($n['spacer'])) return $n;
        $n['items'] = self::clean_all($n['items'], $seen, $K);
        if (!self::filled($n['items'])) return null;
        // Serialize writes a one-item row as a group, and parse merges a group that holds only a group: undo both here.
        $only = count($n['items']) === 1 ? $n['items'][0] : null;
        if ($only && empty($n['group'])) return $only;
        if ($only && !empty($only['group'])) {
            if (isset($n['attrs'])) $only['attrs'] = $n['attrs'];
            return $only;
        }
        return $n;
    }

    private static function filled($items) {
        foreach ($items as $n) {
            if (!isset($n['spacer'])) return true;
        }
        return false;
    }

    public static function serialize($model) {
        $flow = array();
        foreach ($model['sections'] as $c) {
            $items = array();
            foreach ($c['items'] as $n) $items[] = self::out($n, 'col');
            $flow[] = self::attrs_text($c['attrs']) . implode(',', $items);
        }
        return implode('|', $flow) . ($model['corner'] ? ';logo' . ($model['corner'] === 'start' ? '{start}' : '') : '');
    }

    private static function attrs_text($a) {
        $out = array();
        foreach ((array) $a as $k => $v) $out[] = $v === true ? $k : $k . ':' . $v;
        return $out ? '{' . implode(',', $out) . '}' : '';
    }

    private static function out($n, $parent) {
        if (isset($n['el'])) {
            $text = $n['el'];
        } elseif (isset($n['spacer'])) {
            $text = '~';
        } else {
            $text = '';
            foreach ($n['items'] as $k => $c) {
                $text .= ($k === 0 ? '' : ($n['dir'] === 'row' ? (empty($c['group']) ? '+' : '') : ',')) . self::out($c, $n['dir']);
            }
            $bare = empty($n['group']) && !isset($n['attrs']) && count($n['items']) > 1 && $n['dir'] === 'row' && $parent === 'col';
            if (!$bare) $text = '(' . $text . ')';
        }
        return (empty($n['hidden']) ? '' : '-') . $text . self::attrs_text(isset($n['attrs']) ? $n['attrs'] : null);
    }

    /* ------------------------------------------------------------ render */

    /*
     * $p is the product, an array: 'slot' and 'frame' classes and one callable per element it draws, called with the data (a review
     * or a business) and array('cls' => ..., 'logo' => bool, 'stars' => bool, 'attrs' => array); each returns a single root that carries cls.
     * An optional 'classes' callable names the structure after the roles: the frame, each row and each cell get the classes it returns
     * for array('what' => frame|row|cell, 'els' => the element names held, 'push' => bool, 'attrs' => array).
     * An element without a callable renders nothing. Optional 'slot_attrs' and 'corner' (the frame draws the corner logo itself, rpi-logo,
     * when 'corner' is missing or returns ''; otherwise it is only marked as having a corner, rpi-corner_drawn).
     */
    public static function render($data, $model, $p) {
        $r = new self();
        $r->data = $data;
        $r->p = $p;
        return $r->block($model);
    }

    private function block($model) {
        $K = self::kind($model['kind']);
        $shown = $all = array();
        foreach ($model['sections'] as $c) $all = array_merge($all, self::leaves($c));
        // The backdrop is no line: the frame's first and last lines are what the corner, the bands and the border photos go by.
        $cover = null;
        foreach ($all as $l) {
            if ($l['el'] === 'media' && !empty($l['attrs']['cover'])) $cover = $l;
        }
        foreach ($model['sections'] as $c) {
            if ($cover) {
                $items = array();
                foreach ($c['items'] as $n) {
                    $n = self::without($n, 'media');
                    if ($n !== null) $items[] = $n;
                }
                if (!$items) continue;
                $c['items'] = $items;
            }
            if (self::visible($c)) $shown[] = $c;
        }
        $this->anchor_at = $bubble_at = -1;
        $this->last_at = count($shown) - 1;
        foreach ($shown as $k => $c) {
            if ($K['required'] && $this->anchor_at < 0 && in_array($K['required'], array_column(self::leaves($c), 'el'), true)) $this->anchor_at = $k;
            if ($bubble_at < 0 && !empty($c['attrs']['bubble'])) $bubble_at = $k;
        }
        $this->bubble = $bubble_at >= 0;
        // The tail points at the lines below, else above: at the middle of a centred line, at the end of one the photo ends.
        $tail = $this->bubble ? ($bubble_at < $this->last_at ? 'down' : ($bubble_at > 0 ? 'up' : '')) : '';
        $beside = $tail ? $shown[$tail === 'down' ? $bubble_at + 1 : $bubble_at - 1] : null;
        $lines = array();
        foreach ($beside ? $beside['items'] : array() as $n) {
            if (self::visible($n)) $lines[] = $n;
        }
        $near = $lines ? $lines[$tail === 'down' ? 0 : count($lines) - 1] : null;
        $row = $near ? self::one_row($near) : null;
        if ($row) $near = array('attrs' => isset($near['attrs']) ? $near['attrs'] : array()) + $row;
        $centred = $beside && (!empty($beside['attrs']['center']) || !empty($near['attrs']['center']));
        $end = !$centred && $near && isset($near['dir']) && $near['dir'] === 'row'
            && self::first_shown(array($near))['el'] !== 'photo' && self::last_shown(array($near))['el'] === 'photo';

        $host = null;
        foreach ($all as $l) {
            if (!empty($l['attrs']['logo'])) {
                $host = $l;
                break;
            }
        }
        $this->logo_on = $host && empty($host['hidden']) ? $host['el'] : null;
        $this->stars_on = null;
        foreach ($all as $l) {
            if (!empty($l['attrs']['stars'])) {
                $this->stars_on = empty($l['hidden']) ? $l['el'] : null;
                break;
            }
        }
        // The logo of a hidden element moves to the corner rather than disappearing with it.
        $corner = $model['corner'] ? $model['corner'] : $host && !empty($host['hidden']);

        $first = $shown ? self::first_shown($shown[0]['items']) : null;
        $last = $shown ? self::last_shown($shown[$this->last_at]['items']) : null;
        $this->avatop = $this->on_border($first, 'top');
        $this->avabottom = $this->on_border($last, 'bottom');
        $this->avaside = false;
        foreach ($shown as $c) {
            foreach ($c['items'] as $item) {
                if ($this->on_border(self::first_shown(array($item)), 'side')) $this->avaside = true;
            }
        }
        // The border lifts the photo's whole line, so nothing may share that line with it.
        if ($this->avatop) $shown[0]['items'] = self::alone($shown[0]['items'], $first);
        if ($this->avabottom) $shown[$this->last_at]['items'] = self::alone($shown[$this->last_at]['items'], $last, true);

        $shown_items = array();
        foreach ($shown as $c) $shown_items = array_merge($shown_items, $c['items']);
        // A frame of one plain line is that line (a badge, a tag): the row's items are the frame's.
        $single_line = !$this->bubble && !$this->avatop && !$this->avabottom && !$this->avaside && count($shown) === 1 ? self::lines($shown[0]['items']) : array();
        $single = null;
        if (count($single_line) === 1 && !$single_line[0][1] && !isset($single_line[0][0]['el']) && empty($shown[0]['attrs']['band']) && empty($shown[0]['attrs']['sep'])
            && empty($single_line[0][0]['attrs']['band']) && empty($single_line[0][0]['attrs']['sep'])) {
            $single = self::row_of($single_line[0][0]);
        }
        $before = $inside = $after = '';
        if ($single) $inside = $this->inner($single);
        else foreach ($shown as $k => $c) {
            if (!$this->bubble || $k === $bubble_at) $inside .= $this->section($c, $k, false);
            elseif ($k < $bubble_at) $before .= $this->section($c, $k, true);
            else $after .= $this->section($c, $k, true);
        }

        $provider = empty($this->data->provider) ? 'google' : htmlspecialchars($this->data->provider, ENT_QUOTES);
        $drawn = $corner && isset($this->p['corner']) ? (string) $this->p['corner']($this->data, array('cls' => 'rpi-corner', 'attrs' => array())) : '';
        $backdrop = $cover ? $this->node($cover, '') : '';
        $line_n = $single ? $single_line[0][0] : null;
        $line_a = $line_n && isset($line_n['attrs']) ? $line_n['attrs'] : array();
        $frame = self::join('rpi-box', $single ? 'rpi-row' : '', $this->p['frame'], $this->bubble ? 'rpi-bubble' : '', $tail ? 'rpi-bubble_' . $tail : '',
            $centred ? 'rpi-bubble_center' : ($end ? 'rpi-bubble_end' : ''), $this->avatop ? 'rpi-avatop' : '', $this->avabottom ? 'rpi-avabottom' : '',
            $this->avaside ? 'rpi-avaside' : '', $corner ? ($drawn === '' ? 'rpi-logo rpi-logo-' . $provider : 'rpi-corner_drawn') : '', $corner === 'start' ? 'rpi-logo-start' : '',
            $single && !empty($shown[0]['attrs']['center']) ? 'rpi-center' : '', $single ? self::own($line_a) : '', $single ? $this->role(empty($line_n['group']) ? 'row' : 'cell', $line_n, false) : '',
            $this->role('frame', array('items' => $shown_items), false));
        $slot = self::join($this->p['slot'], $K['root']);
        $atts = isset($this->p['slot_attrs']) ? $this->p['slot_attrs']($this->data) : '';
        $gap = $single ? self::gap($line_n) : '';
        // The slot is the frame when the product gives the frame no classes of its own and no line stands outside it; a style the
        // product puts on its slot takes the line's gap in.
        if ($this->p['frame'] === '' && !$this->bubble) return '<div class="' . self::join($slot, $frame) . '"' . self::with_style($atts, $gap) . '>' . $inside . $drawn . $backdrop . '</div>';
        return '<div class="' . $slot . '"' . $atts . '>' .
            $before . '<div class="' . $frame . '"' . $gap . '>' . $inside . $drawn . $backdrop . '</div>' . $after . '</div>';
    }

    /*
     * The roles: the old markup's names on the nodes that behave as its parts did, so the product CSS and users' CSS address a part and
     * not a path. rpi-slider-btn is a cell of the buttons alone (the narrow header's policy: its own centred line). The set is closed;
     * a product adds its own names through 'classes'.
     */
    private static function roles($what, $els) {
        return $what === 'cell' && !array_diff($els, array('write', 'seeall')) ? 'rpi-slider-btn' : '';
    }

    private function role($what, $n, $push) {
        $els = array();
        foreach (self::leaves($n) as $l) {
            if (empty($l['hidden'])) $els[] = $l['el'];
        }
        $own = isset($this->p['classes'])
            ? (string) $this->p['classes']($this->data, array('what' => $what, 'els' => $els, 'push' => (bool) $push, 'attrs' => isset($n['attrs']) ? $n['attrs'] : array()))
            : '';
        return self::join(self::roles($what, $els), $own);
    }

    private static function own($a) {
        return self::join(empty($a['center']) ? '' : 'rpi-center', empty($a['start']) ? '' : 'rpi-start', empty($a['band']) ? '' : 'rpi-band', empty($a['sep']) ? '' : 'rpi-sep');
    }

    private function node($n, $cls) {
        $a = isset($n['attrs']) ? $n['attrs'] : array();
        if (isset($n['el'])) {
            if (!empty($n['hidden']) || !isset($this->p[$n['el']])) return '';
            return $this->p[$n['el']]($this->data, array('cls' => self::join($cls, self::own($a), $this->avaside && $n['el'] === 'photo' ? 'rpi-side' : ''),
                'logo' => $n['el'] === $this->logo_on, 'stars' => $n['el'] === $this->stars_on, 'attrs' => $a));
        }
        if (!self::visible($n)) return '';
        $row = self::row_of($n);
        $classes = self::join($row ? 'rpi-row' : 'rpi-col', $cls, self::own($a),
            $this->role(empty($n['group']) ? 'row' : 'cell', $n, (bool) preg_match('/\brpi-push\b/', $cls)));
        return '<div class="' . $classes . '"' . self::gap($n) . '>' . $this->inner($row ?: $n) . '</div>';
    }

    private static function with_style($atts, $gap) {
        if ($gap === '') return $atts;
        return strpos($atts, ' style="') !== false ? str_replace(' style="', substr($gap, 0, -1) . ';', $atts) : $atts . $gap;
    }

    // A group of one row is that row, a group of one element a row of one: a cell whose items sit side by side (card.css gives a row
    // inside a row the cell's width). The row node when the node is a row, else null: its lines then stack.
    private static function row_of($n) {
        $only = !empty($n['group']) && count($n['items']) === 1 ? $n['items'][0] : null;
        $m = self::one_row($n) ?: $n;
        return $m['dir'] === 'row' || $only && !isset($only['dir']) ? $m : null;
    }

    private function inner($m) {
        $html = '';
        foreach (self::lines($m['items']) as $l) {
            $html .= $this->node($l[0], $l[1] ? 'rpi-push' : '');
        }
        return $html;
    }

    // A section is a box only when it needs one: several lines kept tight that are not the anchor's, or a band behind several lines.
    private function section($c, $k, $outside) {
        $a = $c['attrs'];
        $ls = self::lines($c['items']);
        $center = empty($a['center']) ? '' : 'rpi-center';
        $band = !$this->bubble && !($this->avatop && $k === 0) && !($this->avabottom && $k === $this->last_at) && !empty($a['band']) ? 'rpi-band' : '';
        $sep = !$this->bubble && !empty($a['sep']) && $k > 0 ? 'rpi-sep' : '';
        $bottom = !$this->bubble && $this->anchor_at >= 0 && $k === $this->anchor_at + 1 ? 'rpi-push' : '';
        $html = '';
        if (count($ls) > 1 && ($k !== $this->anchor_at || $band || isset($a['gap']))) {
            foreach ($ls as $l) $html .= $this->node($l[0], self::join($center, $l[1] ? 'rpi-push' : ''));
            return '<div class="' . self::join('rpi-col', $center, $band, $sep, $bottom) . '"' . self::gap($c) . '>' . $html . '</div>';
        }
        foreach ($ls as $j => $l) {
            $n = isset($l[0]['el']) && ($band || $outside || $j === 0 && $sep) ? array('dir' => 'row', 'items' => array($l[0])) : $l[0];
            $push = ($j === 0 && $bottom) || $l[1];
            $html .= $this->node($n, self::join($center, $j === 0 ? $band : '', $j === 0 ? $sep : '', $push ? 'rpi-push' : ''));
        }
        return $html;
    }

    // "~" marks the next visible item rpi-push: flex.css sends it to the far end of its row or the bottom of its column by an auto margin.
    private static function lines($items) {
        $out = array();
        $push = false;
        foreach ($items as $n) {
            if (isset($n['spacer'])) {
                $push = true;
            } elseif (self::visible($n)) {
                $out[] = array($n, $push);
                $push = false;
            }
        }
        return $out;
    }

    private static function one_row($n) {
        return !empty($n['group']) && count($n['items']) === 1 && isset($n['items'][0]['dir']) && $n['items'][0]['dir'] === 'row' ? $n['items'][0] : null;
    }

    private static function visible($n) {
        if (isset($n['el'])) return empty($n['hidden']);
        if (isset($n['spacer'])) return false;
        foreach ($n['items'] as $c) {
            if (self::visible($c)) return true;
        }
        return false;
    }

    private static function leaves($n) {
        if (isset($n['el'])) return array($n);
        $out = array();
        foreach (isset($n['items']) ? $n['items'] : array() as $c) $out = array_merge($out, self::leaves($c));
        return $out;
    }

    // $n without the element $el; a row left with one item becomes that item.
    private static function without($n, $el) {
        if (!isset($n['items'])) return isset($n['el']) && $n['el'] === $el ? null : $n;
        $items = array();
        foreach ($n['items'] as $c) {
            $c = self::without($c, $el);
            if ($c !== null) $items[] = $c;
        }
        if (!self::visible(array('items' => $items))) return null;
        if (count($items) === 1 && empty($n['group'])) return $items[0];
        $n['items'] = $items;
        return $n;
    }

    // $x moves out of the line that holds it onto a line of its own, just before the rest of that line (after it with $after).
    private static function alone($items, $x, $after = false) {
        foreach ($items as $k => $n) {
            if (in_array($x['el'], array_column(self::leaves($n), 'el'), true)) break;
        }
        if (isset($items[$k]['el'])) return $items;
        $rest = self::without($items[$k], $x['el']);
        $line = $rest ? ($after ? array($rest, $x) : array($x, $rest)) : array($x);
        return array_merge(array_slice($items, 0, $k), $line, array_slice($items, $k + 1));
    }

    private static function first_shown($items) {
        foreach (self::leaves(array('items' => $items)) as $l) {
            if (empty($l['hidden'])) return $l;
        }
        return null;
    }

    private static function last_shown($items) {
        $last = null;
        foreach (self::leaves(array('items' => $items)) as $l) {
            if (empty($l['hidden'])) $last = $l;
        }
        return $last;
    }

    private function on_border($l, $k) {
        return !$this->bubble && $l && $l['el'] === 'photo' && !empty($l['attrs'][$k]);
    }

    private static function join() {
        return implode(' ', array_unique(preg_split('/ +/', implode(' ', func_get_args()), -1, PREG_SPLIT_NO_EMPTY)));
    }

    private static function gap($n) {
        return isset($n['attrs']['gap']) ? ' style="--gap:' . (int) $n['attrs']['gap'] . 'px"' : '';
    }
}
