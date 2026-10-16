/*
 * The widget's look as the editors handle it: card variables as the card controls' values, a theme copied into a widget,
 * the look of an older widget written in the current model, and the dark look. Pure functions over option objects and the
 * style_vars text; the gallery and the builder call them, the themes.json generator runs them in node.
 */
const GRW_MODEL = (function () {
    'use strict';

    // The option keys of older widgets that a layout string replaces; a save that carries the string drops them.
    const LEGACY_KEYS = ['card_style', 'header_center', 'header_hide_photo', 'header_hide_name', 'header_show_scale', 'header_platform', 'header_order',
        'header_bold_count', 'header_short_count', 'header_hide_grade', 'hide_based_on', 'hide_writereview',
        'badge_logo_hide', 'badge_based_hide', 'badge_onestar', 'badge_compact', 'badge_order', 'badge_dot', 'badge_author_hide', 'badge_toprated', 'badge_icon'];

    // The card controls' values of the Classic card: what a control shows for a variable the widget does not set.
    const LIGHT = {bg: 'color', bg1: '#f4f4f4', bg2: '#ffffff', border: false, borderColor: '#dddddd', shadow: 'none', radius: 8, band: '#f1f1f1',
        divider: '#e2e2e2', stars: '#fb8e28', starSize: 20, name: '#154fc1', text: '#222222', date: '#555555', photo: 44, gray: false, lines: '5'};
    // "Dark background" on a light card: a solid dark fill that holds on any site, light lines and words; the bar's plate darkens with it.
    const DARK = {bg: 'color', bg1: '#383e45', borderColor: '#4c535b', band: '#41474e', divider: '#4c535b', name: '#eeeeee', text: '#ececec', date: '#bbbbbb'};
    const DARK_PLATE = '#383e45', LIGHT_PLATE = '#ffffff';

    const pairs = str => String(str || '').split(';').reduce((o, p) => {
        const i = p.indexOf(':');
        if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim();
        return o;
    }, {});
    const text = vars => Object.keys(vars).map(n => n + ':' + vars[n] + ';').join('');

    // The card variables of the controls' values, the ones a theme in themes.json holds.
    function cardVars(s, shadows) {
        const bg = s.bg === 'none' ? 'transparent' : s.bg === 'gradient' ? 'linear-gradient(135deg, ' + s.bg1 + ', ' + s.bg2 + ')' : s.bg1;
        return {
            // An unfilled tail would show the bubble's border line across its base.
            '--card-bg': bg, '--card-tail': s.bg === 'none' && s.border ? s.borderColor : bg, '--card-br': s.border ? '1px solid' : 'none',
            '--card-br-color': s.borderColor, '--card-shadow': shadows[s.shadow] || 'none', '--card-radius': s.radius + 'px',
            '--card-band-bg': s.band, '--card-sep-color': s.divider, '--card-star-color': s.stars, '--card-star-size': s.starSize + 'px',
            '--name-color': s.name, '--card-color': s.text, '--time-color': s.date, '--card-img-size': s.photo + 'px', '--img-filter': s.gray ? 'grayscale(1)' : 'none',
            '--card-text-lines': s.lines
        };
    }
    const CARD_VARS = Object.keys(cardVars(LIGHT, {}));

    // The controls' values back from the variables v, over the values s.
    function cardRead(v, s, shadows) {
        const px = k => parseInt(v[k], 10), g = /^linear-gradient\(135deg, (#[0-9a-f]{6}), (#[0-9a-f]{6})\)$/i.exec(v['--card-bg'] || '');
        if (g) Object.assign(s, {bg: 'gradient', bg1: g[1], bg2: g[2]});
        else if (v['--card-bg']) Object.assign(s, v['--card-bg'] === 'transparent' ? {bg: 'none'} : {bg: 'color', bg1: v['--card-bg']});
        if (v['--card-br']) s.border = v['--card-br'] === '1px solid';
        if (v['--card-shadow']) s.shadow = Object.keys(shadows).find(k => shadows[k] === v['--card-shadow']) || s.shadow;
        if (v['--img-filter']) s.gray = v['--img-filter'] !== 'none';
        if (v['--card-text-lines']) s.lines = v['--card-text-lines'];
        [['borderColor', '--card-br-color'], ['band', '--card-band-bg'], ['divider', '--card-sep-color'], ['stars', '--card-star-color'],
            ['name', '--name-color'], ['text', '--card-color'], ['date', '--time-color']].forEach(([k, n]) => { if (v[n]) s[k] = v[n]; });
        [['radius', '--card-radius'], ['starSize', '--card-star-size'], ['photo', '--card-img-size']].forEach(([k, n]) => { if (v[n]) s[k] = px(n); });
        return s;
    }

    // The card controls' values of a widget: its own variables over the Classic ones.
    const skinOf = (styleVars, shadows) => cardRead(pairs(styleVars), Object.assign({}, LIGHT), shadows);

    // style_vars with every card variable set from the skin; what else it holds stays.
    function withCard(styleVars, skin, shadows) {
        const v = pairs(styleVars);
        CARD_VARS.forEach(n => { delete v[n]; });
        return text(Object.assign(v, cardVars(skin, shadows)));
    }

    const lum = hex => { const n = parseInt(String(hex).slice(1, 7), 16); return ((n >> 16) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 255000; };

    /*
     * "Dark background" on and off over style_vars. On: a light card takes the dark fill and lines, a transparent one keeps its
     * background and takes the light words, a card that is dark already stays; near-black stars turn light; a bar plate darkens.
     * Off: the text as it was before dark went on (snapshot), or the Classic light values when there is none.
     */
    function dark(styleVars, on, shadows, snapshot) {
        if (!on) {
            if (snapshot != null) return snapshot;
            const s = skinOf(styleVars, shadows);
            if (s.bg === 'color' && s.bg1 === DARK.bg1) Object.assign(s, {bg1: LIGHT.bg1});
            Object.keys(DARK).forEach(k => { if (k !== 'bg' && k !== 'bg1' && s[k] === DARK[k]) s[k] = LIGHT[k]; });
            if (s.stars === DARK.name) s.stars = LIGHT.stars;
            return plate(withCard(styleVars, s, shadows), LIGHT_PLATE);
        }
        const s = skinOf(styleVars, shadows);
        if (!(s.bg === 'color' && lum(s.bg1) < .3)) {
            Object.assign(s, DARK, s.bg === 'none' ? {bg: 'none'} : {});
            if (lum(s.stars) < .3) s.stars = DARK.name;
        }
        return plate(withCard(styleVars, s, shadows), DARK_PLATE);
    }
    // A design's white plate follows the dark switch and comes back; a plate switched off, or one of the builder's own colour, is left alone.
    const plate = (sv, color) => sv.replace(/--slider-head-card-bg:\s*(#ffffff|#383e45)(?=;)/, '--slider-head-card-bg:' + color);

    /* ------------------------------------------------------------ themes */

    // The theme copied into the options: its opts replace the same keys, its vars the same declarations; the rest of the widget stays.
    // The flags a layout string replaces go, so an older widget picking a theme is in the current model.
    function applyTheme(options, theme) {
        const o = Object.assign({}, options, theme.opts);
        LEGACY_KEYS.forEach(k => { delete o[k]; });
        const v = pairs(o.style_vars);
        Object.keys(theme.vars || {}).forEach(n => { delete v[n]; });
        o.style_vars = text(v) + text(theme.vars || {});
        return o;
    }

    // Whether the options still carry the theme: every opt and var of the theme with its value, except the vars in ignore.
    const hasTheme = (options, theme, ignore) => {
        const v = pairs(options.style_vars);
        return Object.keys(theme.opts).every(k => String(options[k]) === String(theme.opts[k])) &&
            Object.keys(theme.vars || {}).every(n => (ignore && ignore.includes(n)) || v[n] === theme.vars[n]);
    };

    const defaultTheme = (themes, mode) => themes.find(t => t.opts.view_mode === mode) || null;

    /* ------------------------------------------------------------ older widgets */

    // The rating header of the header flags as a layout string; wide = the slider's and grid's header, where the button sits beside the column.
    function headerLayout(o, wide) {
        const attrs = list => list.filter(Boolean).length ? '{' + list.filter(Boolean).join(',') + '}' : '';
        const part = {
            scale: o.header_show_scale ? 'scale' : '',
            name: o.header_hide_name ? '' : 'name',
            stars: 'stars' + (o.header_hide_grade ? '{nonum}' : ''),
            based: o.hide_based_on ? '' : 'based' + attrs([o.header_short_count && 'short', o.header_bold_count && 'bold']),
            platform: o.header_platform ? 'powered{short}' : ''
        };
        const def = ['scale', 'name', 'stars', 'based', 'platform'], seen = [];
        const lines = [];
        String(o.header_order || '').split(',').concat(def).forEach(g => {
            const keys = g.split('+').map(s => s.trim()).filter(k => def.includes(k) && !seen.includes(k));
            seen.push(...keys);
            const parts = keys.map(k => part[k]).filter(Boolean);
            if (parts.length) lines.push(parts.join('+'));
        });
        if (!o.header_platform) lines.push('powered');
        const write = !o.hide_writereview, photo = !o.header_hide_photo;
        if (o.header_center) return canonical('{center}' + (photo ? ['photo'] : []).concat(lines, write ? ['write'] : []).join(','));
        if (write && !wide) lines.push('write');
        const col = lines.join(',');
        if (photo) return canonical('photo(' + col + ')' + (write && wide ? '+~+write' : ''));
        return canonical(write && wide ? (lines.length > 1 ? '(' + col + ')' : col) + '+~+write' : col);
    }

    // The engine's one spelling of a layout, so a converted widget matches its design in the gallery.
    const canonical = str => rpi.Card.serialize(rpi.Card.parse(str, 'rating'));

    // The live badge of the badge flags as a layout string.
    function badgeLayout(o) {
        const compact = !!o.badge_compact || !!o.badge_bar;
        const attrs = list => list.filter(Boolean).length ? '{' + list.filter(Boolean).join(',') + '}' : '';
        const icon = o.badge_icon === undefined ? 'medal' : o.badge_icon;
        const head = ['stars' + attrs([compact && !o.badge_logo_hide && 'logo', o.badge_onestar && 'one', o.badge_order === 'stars' && 'first']),
            !o.badge_based_hide && 'count' + (o.badge_dot ? '{dot}' : ''),
            o.badge_toprated && 'label{dot' + (icon ? ',icon:' + icon : '') + '}'].filter(Boolean).join('+');
        const phrase = 'phrase' + (o.badge_author_hide ? '{noauthor}' : '');
        // A bar keeps the rating as one group beside the phrase, so the phrase moves under it whole when the bar is narrow.
        const body = o.badge_bar ? '(' + head + ')+' + phrase : head + ',' + phrase;
        return canonical(!compact && !o.badge_logo_hide ? 'logo+(' + body + ')' : body);
    }

    // The header of a slider beside its reviews, of a list and of a rating is a column; above or below the reviews and on a grid it is wide.
    const wideHeader = o => o.view_mode === 'grid' || o.view_mode === 'slider' && String(o.slider_head_pos || '2') !== '2';

    // The look of an older slider or grid card in the card controls' values (public-main.css: --rev-color, --rev-bg, --text-color,
    // --star-color, grw-round, grw-shadow, wp-dark; the options missing from old widgets are Core's defaults).
    function standardSkin(o, shadows) {
        const v = pairs(o.style_vars), s = Object.assign({}, LIGHT, o.dark_theme ? {bg: 'none', text: '#ececec', date: '#bbbbbb'} : {});
        // Widgets saved before the card background checkbox hid the background by making the card colour itself transparent.
        if (o.hide_backgnd || v['--rev-color'] === 'transparent' || (v['--rev-bg'] || (o.dark_theme ? 'transparent' : '')) === 'transparent') s.bg = 'none';
        else Object.assign(s, {bg: 'color', bg1: v['--rev-color'] || (o.dark_theme ? '#ffffff14' : s.bg1)});
        s.radius = o.show_round ? 8 : 0;
        s.shadow = o.show_shadow ? 'grw' : 'none';
        if (v['--text-color']) s.text = v['--text-color'];
        if (v['--star-color']) s.stars = v['--star-color'];
        if (v['--name-color']) s.name = v['--name-color'];
        // Its fixed text height in lines of the Standard card's 24px, plus the line "read more" takes in a cut text: the 100px default is
        // five. A height such as auto or 100% showed the whole text; one the browser ignored left the default.
        const h = String(o.slider_text_height || '').trim().toLowerCase(), n = /^(\d*\.?\d+)(px|r?em)?$/.exec(h);
        if (n && +n[1] > 0) s.lines = String(Math.min(8, Math.max(2, Math.round(n[1] * (n[2] && n[2] !== 'px' ? 16 : 1) / 24) + 1)));
        else if (/^(auto|unset|initial|inherit|revert|(min-|max-|fit-)content|\d*\.?\d+%)$/.test(h)) s.lines = 'none';
        return s;
    }

    /*
     * An older widget in the current model: a card preset becomes the card's own layout and variables, the Standard card the
     * Classic look, the header and badge flags a rating layout. cfg: {legacy: {id: {layout, vars}}, themes, shadows}.
     * A widget that is in the model already comes back as it is.
     */
    function convert(options, cfg) {
        const o = Object.assign({}, options);
        const mode = o.view_mode || 'list';
        const cards = mode === 'slider' || mode === 'grid';
        const preset = cards && cfg.legacy[o.card_style];
        if (preset) {
            o.card_layout = o.card_layout || preset.layout;
            o.style_vars = text(Object.assign({}, preset.vars, pairs(o.style_vars)));
        } else if (cards && !o.card_layout) {
            const def = defaultTheme(cfg.themes, mode);
            o.card_layout = def ? def.opts.card_layout : '';
            o.style_vars = withCard(o.style_vars, standardSkin(o, cfg.shadows), cfg.shadows);
        }
        if (!o.rating_layout) o.rating_layout = mode === 'badge' ? badgeLayout(o) : headerLayout(o, wideHeader(o));
        // Before card presets every button label was white; the card header's outlined button reads --btn-txt-color.
        const v = pairs(o.style_vars);
        if (!o.card_style && v['--btn-color'] && !v['--btn-txt-color']) o.style_vars = text(Object.assign(v, {'--btn-txt-color': '#ffffff'}));
        // Unnamed controls of the old builder saved under these keys.
        LEGACY_KEYS.concat(['', 'null']).forEach(k => { delete o[k]; });
        return o;
    }

    // Whether the options are an older widget's, which the editors convert on open.
    const isLegacy = o => LEGACY_KEYS.some(k => k in o) || !o.rating_layout || ((o.view_mode === 'slider' || o.view_mode === 'grid') && !o.card_layout);

    /* ------------------------------------------------------------ rating layout helpers for the controls */

    // The element's node in a parsed model, or null.
    function find(model, el) {
        let hit = null;
        const walk = n => { if (n.el === el) hit = n; else if (n.items) n.items.forEach(walk); };
        model.sections.forEach(c => c.items.forEach(walk));
        return hit;
    }
    // The attr of an element of the layout string: read (value or undefined) and set (true, a value, or false to drop it).
    function attr(layout, kind, el, name, value) {
        const model = rpi.Card.parse(layout, kind), n = find(model, el);
        if (value === undefined) return n && n.attrs ? n.attrs[name] : undefined;
        if (!n) return layout;
        n.attrs = n.attrs || {};
        if (value === false) delete n.attrs[name]; else n.attrs[name] = value;
        return rpi.Card.serialize(rpi.Card.normalize(model));
    }
    const has = (layout, kind, el) => { const n = find(rpi.Card.parse(layout, kind), el); return !!n && !n.hidden; };
    const out = model => rpi.Card.serialize(rpi.Card.normalize(model));

    // The layout without the element; a section left with one group opens that group into its lines.
    function drop(layout, kind, el) {
        const model = rpi.Card.parse(layout, kind);
        const walk = n => {
            if (!n.items) return;
            n.items = n.items.filter(c => c.el !== el);
            n.items.forEach(walk);
        };
        model.sections.forEach(walk);
        // Normalized first: a row left with the group alone has become the group by then.
        const tidy = rpi.Card.parse(out(model), kind);
        tidy.sections.forEach(c => { if (c.items.length === 1 && c.items[0].group) c.items = c.items[0].items; });
        return out(tidy);
    }
    // The element in front of everything: a row of it and the first section's lines as one group beside it.
    function lead(layout, kind, el) {
        const model = rpi.Card.parse(drop(layout, kind, el), kind);
        const c = model.sections[0];
        c.items = [{dir: 'row', items: [{el}, {dir: 'col', group: true, items: c.items}]}];
        return out(model);
    }
    // The element right after another, on its line; without that other element, at the end of the first line.
    function after(layout, kind, el, prev) {
        const model = rpi.Card.parse(drop(layout, kind, el), kind);
        let done = false;
        const walk = n => {
            if (!n.items || done) return;
            const k = n.items.findIndex(c => c.el === prev);
            if (k >= 0) {
                // In a row it joins the row; a column line becomes a row of the two.
                if (n.dir === 'row') n.items.splice(k + 1, 0, {el});
                else n.items[k] = {dir: 'row', items: [n.items[k], {el}]};
                done = true;
                return;
            }
            n.items.forEach(walk);
        };
        model.sections.forEach(walk);
        if (!done) {
            const first = model.sections[0].items[0];
            if (first.dir === 'row') first.items.push({el});
            else model.sections[0].items[0] = {dir: 'row', items: [first, {el}]};
        }
        return out(model);
    }

    return {LEGACY_KEYS, LIGHT, CARD_VARS, pairs, text, cardVars, cardRead, skinOf, withCard, dark, applyTheme, hasTheme, defaultTheme,
        headerLayout, badgeLayout, wideHeader, standardSkin, convert, isLegacy, attr, has, drop, lead, after};
})();
