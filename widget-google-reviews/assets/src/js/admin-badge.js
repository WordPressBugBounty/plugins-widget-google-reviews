// The badge part of a step page. The plugin draws every badge (grw_theme_data, grw_theme_preview), as it draws it on the site;
// badge.js then rotates the phrases. The badge's content is its rating_layout, which the step 2 toggles edit.
function grw_badge_kit(W, data, cfg) {
    const state = W.state, h = W.h, esc = W.esc, M = GRW_MODEL;

    const DEFAULTS = cfg.badge;
    const TOP_RATED_NOTE = 'Top rated appears from a 4.5 rating and 10 reviews';
    const PRESETS = cfg.themes.filter(t => t.opts.view_mode === 'badge');
    const STICKER = t => /^badge:sticker-/.test(t.id);
    const isSticker = () => PRESETS.some(p => p.name === state.presetName && STICKER(p));
    // A sticker edited away from its design and reloaded is a badge again in the texts, as it is in the gallery filter.
    const noun = () => isSticker() ? 'sticker' : 'badge';
    const KIND = 'rating';

    // Each host gets its own root id: badge.js keys its close state by it.
    let seq = 0;
    function show(host, html, fixed, click) {
        host.querySelectorAll('.rpi-badge').forEach(b => { if (b.rpiLiveStop) b.rpiLiveStop(); });
        host.innerHTML = html || '';
        const r = host.querySelector('.wp-gr');
        if (!r) return null;
        const id = 'grwb' + (++seq);
        Object.keys(sessionStorage).filter(k => k.indexOf('rpi_badge_grwb') === 0).forEach(k => sessionStorage.removeItem(k));
        r.classList.add('grw-badge-root');
        if (!fixed) r.classList.add('grw-badge-static');
        r.dataset.id = id;
        r.dataset.exec = 'true';
        rpi.Badge(r, {onclick: click || function() {}});
        return r;
    }

    // Dark and the star colour over a drawn badge, without a new render.
    function tone(r, dark, color) {
        const b = r.querySelector('.rpi-badge');
        if (b) {
            const glass = b.classList.contains('rpi-badge-glass') || b.classList.contains('rpi-badge-glass-dark');
            ['light', 'dark', 'glass', 'glass-dark'].forEach(t => b.classList.remove('rpi-badge-' + t));
            b.classList.add('rpi-badge-' + (glass ? (dark ? 'glass-dark' : 'glass') : (dark ? 'dark' : 'light')));
        }
        // The design's own star colour comes back when the picker returns to its default.
        if (r.grwStar === undefined) r.grwStar = r.style.getPropertyValue('--badge-star-color');
        if (color || r.grwStar) r.style.setProperty('--badge-star-color', color || r.grwStar); else r.style.removeProperty('--badge-star-color');
    }

    /* ------------------------------------------------------------ step 1: presets */

    // shared: the gallery sets star color, dark and anonymized photos for all tiles at once, so the tiles have no controls of their own.
    function renderPresets(host, head, shared, group) {
        const wrap = h('div', {class: 'grw-badge-design'});
        const note = W.sampleNote('above to see the badges with your real rating and reviews.');
        const noteText = () => { note.hidden = !data().sample; };
        noteText();
        // The gallery shows one note for all its sections and passes no head.
        if (head !== null) (head || wrap).append(note);
        const grid = h('div', {class: 'grw-badge-grid'});
        W.colors();
        wrap.append(grid);
        host.append(wrap);
        // Below the label's threshold (badge.js: 4.5 and 10 reviews) the card still previews it, only its button locks.
        const eligible = () => rpi.Badge.Live.topRated(rpi.Badge.Live.biz({data: data()}), {badge_toprated: true});
        const cards = [];
        PRESETS.filter(p => !group || (group === 'sticker') === STICKER(p)).forEach(preset => {
            const card = h('div', {class: 'grw-badge-card'});
            const head = h('div', {class: 'grw-badge-card-head'}, '<span>' + esc(preset.name) + '</span>');
            const tools = h('div', {class: 'grw-badge-card-tools'});
            const dark = h('label', {class: 'grw-badge-switch', title: 'Dark tone'});
            const cb = h('input', {type: 'checkbox'});
            dark.append(cb, h('i'), document.createTextNode('Dark'));
            const color = h('input', {type: 'color', class: 'grw-badge-color', title: 'Star color', value: W.STAR, list: 'grw-badge-colors'});
            const toneOf = () => cb.checked ? (preset.opts.badge_tone === 'glass' ? 'glass-dark' : 'dark') : (preset.opts.badge_tone || 'light');
            const starColor = () => color.value.toLowerCase() === W.STAR ? '' : color.value;
            // The design copied into a widget, with the tile's tone and star colour.
            const options = () => {
                const o = Object.assign({}, DEFAULTS, M.applyTheme({}, preset), {theme: preset.id, badge_tone: toneOf()});
                if (starColor()) W.setStyleVar('--badge-star-color', starColor(), o);
                if (shared && shared.anonym) o.anonym_avatar = true;
                return o;
            };
            const chosen = () => state.presetName === preset.name && !!state.options;
            const memo = state.cards[preset.name] || (state.cards[preset.name] = {dark: false, color: W.STAR});
            if (chosen()) {
                memo.dark = /dark/.test(state.options.badge_tone || '');
                memo.color = W.styleVar('--badge-star-color') || W.STAR;
            }
            cb.checked = shared ? shared.dark : memo.dark;
            color.value = shared ? shared.color || W.STAR : memo.color;
            const changed = () => {
                memo.dark = cb.checked;
                memo.color = color.value;
                if (chosen()) {
                    [state.options, state.preset].forEach(o => { o.badge_tone = toneOf(); W.setStyleVar('--badge-star-color', starColor() || preset.vars['--badge-star-color'] || '', o); });
                }
                draw();
            };
            color.oninput = changed;
            const stage = h('div', {class: 'grw-badge-stage' + (preset.opts.badge_bar ? ' grw-badge-stage-bar' : '') + (preset.opts.badge_tone === 'glass' ? ' grw-badge-stage-glass' : ''), inert: ''});
            const draw = () => {
                const r = show(stage, state.data && state.data.themes ? state.data.themes[preset.id] : '', false);
                stage.classList.toggle('grw-themes-dark', cb.checked);
                if (r) tone(r, cb.checked, starColor());
            };
            cb.onchange = changed;
            const btn = h('button', {type: 'button', class: 'button button-primary'}, chosen() ? 'Selected' : 'Select');
            card.classList.toggle('grw-badge-card-sel', chosen());
            const lock = h('p', {class: 'grw-badge-card-lock', hidden: true}, '<span class="dashicons dashicons-info-outline grw-badge-note-ico"></span>' + TOP_RATED_NOTE);
            const gate = () => {
                const off = M.has(preset.opts.rating_layout, KIND, 'label') && !eligible();
                btn.disabled = off;
                btn.title = off ? TOP_RATED_NOTE : '';
                lock.hidden = !off;
            };
            gate();
            // A redraw follows the controls above the gallery but leaves the chosen badge's options alone: step 2 may have changed them.
            cards.push(() => {
                if (shared) { cb.checked = memo.dark = shared.dark; color.value = memo.color = shared.color || W.STAR; }
                draw();
                gate();
            });
            btn.onclick = () => {
                if (!chosen()) {
                    // A badge picked for a widget saved as a slider, grid, list or rating is not on the site: its switch is on the Publish step.
                    const saved = W.savedOptions();
                    if (saved && /^(slider|grid|list|rating)$/.test(saved.view_mode || '')) state.global = false;
                    state.options = options();
                    state.preset = Object.assign({}, state.options);
                    state.presetName = preset.name;
                }
                W.go(2);
            };
            tools.append(...(shared ? [] : [color, dark]), btn);
            head.append(tools);
            card.append(head, stage, lock);
            grid.append(card);
            draw();
        });
        // While a place connects there is no data; the tiles are drawn again once it comes.
        return {refresh() { if (!data()) return; noteText(); cards.forEach(f => f()); }};
    }

    /* ------------------------------------------------------------ step 2: editor */

    // The badge on a stage that stands for the page: in its corner or in the content, as the site shows it. Drawn by the plugin
    // from the options as they are; a change of look paints at once, a change of content asks for a new render.
    function preview(stage) {
        // A place that finishes connecting reloads the data; the next draw follows it.
        if (!data()) return;
        const embed = state.options.badge_pos === 'embed';
        stage.classList.toggle('grw-badge-stage-float', !embed);
        stage.classList.toggle('grw-badge-stage-edge', embed && !!state.options.badge_bar);
        stage.classList.toggle('grw-badge-stage-glass', /^glass/.test(state.options.badge_tone || ''));
        W.preview(stage, state.options, html => {
            // The lightbox moves the popup out of the root on the first open, so it is captured once here.
            const popup = (state.options.anonym_avatar ? data().popup_anonym : data().popup) || '';
            let popupEl = null;
            const root = show(stage, html, !embed, popup ? () => grw_popup_open(root, popupEl) : null);
            if (!root) return;
            root.insertAdjacentHTML('beforeend', popup);
            popupEl = root.querySelector('.grw-popup');
        });
    }

    function renderEditor(ctx) {
        const o = state.options, ui = ctx.ui, stage = ctx.stage;
        const drawLive = () => preview(stage);
        const layout = () => o.rating_layout || '';
        // Every change of the layout is followed by the kit's redraw: the controls read it again and the badge is drawn anew.
        const set = str => { o.rating_layout = str; };
        const attr = (el, name) => !!M.attr(layout(), KIND, el, name);
        // A look variable on the drawn badge, with no new render.
        const paint = (name, value) => W.paint(stage, {[name]: value});
        let sync = () => {};

        const POS_PILL = [['right', '↘ Bottom right'], ['left', '↙ Bottom left'], ['top-right', '↗ Top right'], ['top-left', '↖ Top left'], ['embed', '▭ Embed']];
        const POS_BAR = [['top', '▔ Top'], ['bottom', '▁ Bottom'], ['embed', '▬ Embed']];

        // The layout as flags, for the one case that rewrites it whole: a bar made a pill or a pill made a bar.
        const flagsOf = (s, bar) => {
            const a = (el, name) => !!M.attr(s, KIND, el, name), has = el => M.has(s, KIND, el);
            return {badge_bar: bar, badge_compact: a('stars', 'logo') || !has('logo'), badge_logo_hide: !a('stars', 'logo') && !has('logo'),
                badge_onestar: a('stars', 'one'), badge_order: a('stars', 'first') ? 'stars' : '', badge_based_hide: !has('count'), badge_dot: a('count', 'dot'),
                badge_author_hide: a('phrase', 'noauthor'), badge_toprated: has('label'), badge_icon: M.attr(s, KIND, 'label', 'icon') || ''};
        };
        const flags = bar => flagsOf(layout(), bar);
        // The design the widget was made from. A toggle that cannot know where the design had an element puts it back there,
        // when the rest of the layout is still the design's; a pill made a bar and back is the design again on the same terms.
        const theme = PRESETS.find(p => p.name === state.presetName) || null;
        const bare = (s, el) => M.drop(s, KIND, el).replace(/;logo$/, '');
        const restore = (cur, el) => theme && (M.has(theme.opts.rating_layout, KIND, el) || el === 'logo' && /;logo$/.test(theme.opts.rating_layout))
            && bare(theme.opts.rating_layout, el) === bare(cur, el) ? theme.opts.rating_layout : null;
        // The layout on screen is still the other form's, so the design is compared as it would be in that form.
        const design = bar => theme && !!theme.opts.badge_bar === bar && M.badgeLayout(flagsOf(theme.opts.rating_layout, !bar)) === rpi.Card.serialize(rpi.Card.parse(layout(), KIND)) ? theme.opts.rating_layout : null;

        // A pill's width is its plate, a bar's is its phrase column: each form keeps its own (and the slider's number under Fit)
        // while the other is shown. Stickers go down to 86px; Fit off brings back the width the slider still holds.
        const width = v => v == 320 ? '' : +v;
        let widthNum = o.badge_width && o.badge_width !== 'auto' ? o.badge_width : 320;
        const widths = {};
        // A bar in a corner is drawn at that edge, so its button lights up the edge it collapses to.
        const posOf = () => { const bar = !!o.badge_bar, pos = o.badge_pos || 'right'; return {bar, v: bar && pos !== 'embed' ? (/^top/.test(pos) ? 'top' : 'bottom') : pos}; };
        const posGroups = [];
        const posRow = (rows, title, items, bar) => {
            const g = h('div', {class: 'grw-pl-seg grw-pl-seg-grid'});
            items.forEach(([v, t]) => {
                const b = h('button', {type: 'button'}, esc(t));
                b.onclick = () => {
                    o.badge_pos = v;
                    if (!!o.badge_bar !== bar) {
                        // A bar keeps its rating as one group beside the phrase; a pill puts the phrase under it.
                        o.rating_layout = design(bar) || M.badgeLayout(flags(bar));
                        const to = widths[bar ? 'bar' : 'pill'];
                        widths[bar ? 'pill' : 'bar'] = {width: o.badge_width, num: widthNum};
                        o.badge_width = to ? to.width : '';
                        widthNum = to ? to.num : 320;
                    }
                    o.badge_bar = bar;
                    sync();
                    drawLive();
                };
                g.append(b);
            });
            posGroups.push({g, items, bar});
            rows.append(h('div', {class: 'grw-pl-sub'}, title), g);
        };

        // A plate shaped by its radius (a circle, a pill, a pennant's top corners) has no corners the slider could hold.
        const radiusOf = () => /^(\d+)px$/.exec(W.styleVar('--badge-radius') || '14px');
        const radius = radiusOf();

        // The toggles of the content read and write the rating layout.
        const content = (label, get, put) => ({type: 'toggle', label, get, set: v => set(put(v))});
        const eligible = rpi.Badge.Live.topRated(rpi.Badge.Live.biz({data: data()}), {badge_toprated: true});
        // The icon the label gets when it is switched on: the one shown, or the one chosen while the label was off.
        let iconPick = M.attr(layout(), KIND, 'label', 'icon') || (M.has(layout(), KIND, 'label') ? '' : 'medal');

        // Elements: size (a share of the text size) and colour of what the layout shows.
        const TONE_FG = {light: ['#202124', '#5f6368'], dark: ['#ffffff', '#bdc1c6'], glass: ['#202124', '#5f6368'], 'glass-dark': ['#ffffff', '#cfd3d8']};
        const corner = () => /;logo$/.test(layout());
        // element, label, size variable, its css default in em, colour variable, which tone colour the element takes (0 text, 1 muted)
        const ELEMENTS = [
            ['grade', 'Rating number', '--badge-grade-fs', 1.1, '--badge-grade-color', 0],
            ['scale', 'Scale', '--badge-scale-fs', .8],
            ['stars', 'Stars', '--badge-star-size', 1.15],
            ['based', 'Reviews text', '--badge-based-fs', 1, '--badge-based-color', 1],
            ['count', 'Count', '--badge-based-fs', .96, '--badge-based-color', 1],
            ['logo', 'Logo', () => corner() ? '--badge-corner-size' : '--badge-logo-size', () => corner() ? 1.7 : 2.3],
            ['powered', 'Wordmark', '--badge-wordmark-h', 1.3],
        ];
        const shownEl = ELEMENTS.filter(e => M.has(layout(), KIND, e[0]) || e[0] === 'logo' && corner());
        const elementRows = shownEl.filter((e, i) => shownEl.findIndex(x => x[2] === e[2]) === i).map(([name, label, sizeVar, def, colorVar, toneAt]) => {
            const v = typeof sizeVar === 'function' ? sizeVar() : sizeVar, d = typeof def === 'function' ? def() : def, base = o.badge_size || 13;
            const was = W.styleVar(v), px = /px$/.test(was), pct = Math.round((px ? parseFloat(was) / base : parseFloat(was) || d) * 100);
            const names = ELEMENTS.filter(e => e[2] === sizeVar).map(e => e[0]);
            return {type: 'custom', if: () => names.some(n => M.has(layout(), KIND, n) || n === 'logo' && corner()), render: () => {
                const box = h('div');
                box.append(ui.slider(label + ' size', 50, 300, 1, pct, '%', n => { const c = n == pct ? was : px ? Math.round(n / 100 * base) + 'px' : n / 100 + 'em'; W.setStyleVar(v, c); paint(v, c); }));
                if (colorVar) {
                    const had = W.styleVar(colorVar), init = had || (TONE_FG[o.badge_tone] || TONE_FG.light)[toneAt];
                    box.append(...ui.row(label + ' color', ui.color(init, label + ' color', c => { const w = c.toLowerCase() === init.toLowerCase() ? had : c; W.setStyleVar(colorVar, w); paint(colorVar, w); })));
                }
                return box;
            }};
        });

        // "In the page" picked on the badge that is displayed on the site: the save takes it off every page.
        const offSite = h('div', {class: 'notice notice-warning inline grw-pl-notice'}, '<p>This takes the ' + noun() + ' off every page. Place it with its shortcode or block.</p>');

        sync = ui.table([
            {title: 'Layout', open: true, rows: cfg.designRows()},
            {title: 'Position', open: true, rows: [
                {type: 'custom', render: () => {
                    const rows = h('div', {class: 'grw-pl-pos'});
                    posRow(rows, isSticker() ? 'Sticker' : 'Badge', POS_PILL, false);
                    posRow(rows, 'Bar', POS_BAR, true);
                    rows.append(offSite);
                    return rows;
                }, read: () => {
                    const cur = posOf();
                    posGroups.forEach(({g, items, bar}) => W.press(g, bar === cur.bar ? g.children[items.findIndex(([v]) => v === cur.v)] : null));
                    offSite.hidden = !(state.global && o.badge_pos === 'embed');
                }},
                {type: 'toggle', key: 'hide_float_badge', label: 'Hide on mobile'}
            ]},
            {title: 'Look', open: true, rows: [
                {type: 'seg', key: 'badge_tone', label: 'Tone', items: [['light', 'Light'], ['dark', 'Dark'], ['glass', 'Glass'], ['glass-dark', 'Glass dark']]},
                {type: 'color', label: 'Star color', get: () => W.styleVar('--badge-star-color') || W.STAR, set: v => { const c = v.toLowerCase() === W.STAR ? '' : v; W.setStyleVar('--badge-star-color', c); paint('--badge-star-color', c); }},
                // A bar runs edge to edge and has no corners: the row goes when the position makes one, and comes back with a pill.
                radius && +radius[1] <= 30 && {type: 'slider', label: 'Corners', min: 0, max: 30, step: 1, unit: 'px', get: () => +(radiusOf() || radius)[1], set: v => { const c = v == 14 ? '' : v + 'px'; W.setStyleVar('--badge-radius', c); paint('--badge-radius', c); }, if: () => !o.badge_bar},
                {type: 'slider', label: 'Opacity', min: 40, max: 100, step: 5, unit: '%', get: () => Math.round((parseFloat(W.styleVar('--badge-opacity')) || 1) * 100), set: v => { const c = v == 100 ? '' : String(v / 100); W.setStyleVar('--badge-opacity', c); paint('--badge-opacity', c); }}
            ]},
            {title: 'Size', open: false, rows: [
                {type: 'slider', label: 'Text size', min: 11, max: 20, step: 0.5, unit: 'px', get: () => o.badge_size || 13, set: v => { o.badge_size = +v; drawLive(); }},
                {type: 'toggle', key: 'badge_width', label: 'Fit the first line', get: () => o.badge_width === 'auto', set: v => { o.badge_width = v ? 'auto' : width(widthNum); }},
                {type: 'slider', label: 'Width', min: 80, max: 480, step: 1, unit: 'px', get: () => o.badge_width && o.badge_width !== 'auto' ? o.badge_width : widthNum, set: v => { widthNum = +v; o.badge_width = width(v); drawLive(); }, if: () => o.badge_width !== 'auto'}
            ]},
            {title: 'Content', open: false, rows: [
                // A bar always has the logo on the rating line; a wordmark (powered) on the line already is the brand, so the stars get no icon beside it.
                // Off: the logo where the design had it, else a circle takes it in the corner (on the arc), anything else in front.
                Object.assign(content('Logo on the rating line', () => attr('stars', 'logo') || !M.has(layout(), KIND, 'logo') && !/;logo$/.test(layout()),
                    v => {
                        if (v) return M.has(layout(), KIND, 'powered') ? bare(layout(), 'logo') : M.attr(bare(layout(), 'logo'), KIND, 'stars', 'logo', true);
                        const off = M.attr(layout(), KIND, 'stars', 'logo', false);
                        return restore(off, 'logo') || (W.styleVar('--badge-radius') === '50%' ? off + ';logo' : M.lead(off, KIND, 'logo'));
                    }), {disabled: () => !!o.badge_bar}),
                content('One star instead of five', () => attr('stars', 'one'), v => M.attr(layout(), KIND, 'stars', 'one', v)),
                content('Stars before the rating', () => attr('stars', 'first'), v => M.attr(layout(), KIND, 'stars', 'first', v)),
                content('Count after a dot, not in brackets', () => attr('count', 'dot'), v => M.attr(layout(), KIND, 'count', 'dot', v)),
                content('Hide review authors', () => attr('phrase', 'noauthor'), v => M.attr(layout(), KIND, 'phrase', 'noauthor', v)),
                {type: 'toggle', key: 'anonym_avatar', label: 'Anonymize profile photos'},
                // Shown off below the threshold but left as saved: the badge draws the label by itself once the place qualifies.
                {type: 'toggle', label: 'Top rated label', disabled: !eligible, title: eligible ? '' : TOP_RATED_NOTE, get: () => eligible && M.has(layout(), KIND, 'label'), set: v => {
                    const on = restore(layout(), 'label') || M.attr(M.after(layout(), KIND, 'label', M.has(layout(), KIND, 'count') ? 'count' : 'stars'), KIND, 'label', 'dot', true);
                    set(v ? M.attr(on, KIND, 'label', 'icon', iconPick || false) : M.drop(layout(), KIND, 'label'));
                }},
                !eligible && {type: 'custom', render: () => h('div', {class: 'grw-pl-hint'}, TOP_RATED_NOTE + '.')},
                {type: 'select', label: 'Label icon', items: [['', 'None'], ['medal', 'Medal'], ['check', 'Check'], ['award', 'Award'], ['rosette', 'Rosette']],
                    get: () => M.has(layout(), KIND, 'label') ? M.attr(layout(), KIND, 'label', 'icon') || '' : iconPick,
                    set: v => { iconPick = v; set(M.attr(layout(), KIND, 'label', 'icon', v || false)); }}
            ]},
            {title: 'Elements', open: false, rows: elementRows.length ? elementRows : [{type: 'custom', render: () => h('div', {class: 'grw-pl-hint'}, 'This design has no elements to size.')}]},
            {title: 'Behaviour', open: false, rows: [
                {type: 'slider', label: 'Phrase change', min: 3, max: 15, step: 1, unit: 's', get: () => o.badge_interval || 6, set: v => { o.badge_interval = v == 6 ? '' : v; drawLive(); }},
                {type: 'toggle', key: 'badge_close', label: 'Close button'}
            ]}
        ]);
        W.sync = () => sync();

        return () => { sync(); drawLive(); };
    }

    /* ------------------------------------------------------------ step 3: publish */

    function renderPublish(row) {
        const embed = (state.options || {}).badge_pos === 'embed';
        const label = on => on ? 'Displayed on the site' : 'Display on the site';
        if (embed) {
            // The switch is shown off, so the user learns why this badge cannot go on every page.
            const btn = h('button', {type: 'button', class: 'button button-primary button-hero', disabled: true}, label(false));
            row.append(btn, h('p', {class: 'description'}, 'This ' + noun() + ' sits in the page content. Pick a corner or bar position in Set up to show it on every page.'));
        } else {
            const btn = h('button', {type: 'button', class: 'button button-primary button-hero'}, label(state.global));
            btn.disabled = state.global || state.saving;
            const remove = h('a', {href: '#', class: 'grw-badge-uninstall'}, 'Remove from the site');
            remove.hidden = !state.global || state.saving;
            const set = on => {
                const id = state.feedId;
                btn.disabled = true;
                W.save({global: on ? '1' : '0'}, res => {
                    btn.disabled = state.global;
                    if (res.status !== 'success') return W.toast(W.errorOf(res) || 'Could not save.', 'error');
                    const now = !!res.result.global;
                    state.global = now;
                    // A badge deleted or made a slider elsewhere is saved as a new one, and only its own switch puts that one on the site.
                    if (state.step === 3 && (state.feedId !== id || !btn.isConnected)) W.go(3);
                    if (state.feedId !== id) {
                        return W.toast('This ' + noun() + ' was deleted or changed elsewhere, so it was saved as a new one. It is not displayed on the site yet.', 'error');
                    }
                    btn.textContent = label(now);
                    btn.disabled = now;
                    remove.hidden = !now;
                    if (now) W.toast('The ' + noun() + ' is now displayed on the site.' + (res.result.replaced ? ' It replaced widget #' + res.result.replaced + '.' : ''), 'success', {label: 'View site', onClick: () => window.open(W.V.home)});
                    else if (!on) W.toast('The ' + noun() + ' is no longer displayed on the site.');
                });
            };
            btn.onclick = () => set(true);
            remove.onclick = e => { e.preventDefault(); set(false); };
            row.append(btn, remove);
        }
        return embed ? 'Place the ' + noun() + ' in the page content with the shortcode ' : 'Need it on one page only? Put it there with the shortcode ';
    }

    // The design as its card picks it, with its own tone and star colour (the reset of step 2); keep: the widget's own values that stay.
    function pick(preset, keep) {
        const kept = {};
        Object.keys(keep || {}).forEach(k => { if (keep[k] !== undefined) kept[k] = keep[k]; });
        state.options = Object.assign({}, DEFAULTS, M.applyTheme({}, preset), {theme: preset.id}, kept);
        state.preset = Object.assign({}, state.options);
        state.presetName = preset.name;
    }

    function init() {
        state.global = state.feedId ? !!W.V.global : false;
        if (state.options) {
            // The design the widget still carries, if any: its layout, its form options and its own variables; the star colour is the page's.
            const fit = PRESETS.filter(p => M.hasTheme(state.options, p, ['--badge-star-color']));
            fit.sort((x, y) => Object.keys(y.opts).length + Object.keys(y.vars).length - Object.keys(x.opts).length - Object.keys(x.vars).length);
            state.presetName = fit.length ? fit[0].name : null;
        }
    }

    return {
        init,
        pick,
        presets: renderPresets,
        sticker: isSticker,
        stickerOf: STICKER,
        noun,
        editor: renderEditor,
        preview,
        publish: renderPublish
    };
}
