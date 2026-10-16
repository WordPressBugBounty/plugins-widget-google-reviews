// The badge part of a step page. The plugin draws every badge (grw_theme_data, grw_theme_preview), as it draws it on the site;
// badge.js then rotates the phrases. The badge's content is its rating_layout, which the step 2 toggles edit.
function grw_badge_kit(W, data, cfg) {
    const state = W.state, h = W.h, esc = W.esc, M = GRW_MODEL;

    const DEFAULTS = {badge_pos: 'right', badge_tone: 'light', badge_click: 'sidebar'};
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
        const note = h('p', {class: 'description'}, '<span class="dashicons dashicons-info-outline grw-badge-note-ico"></span><b>Sample data.</b> <a href="#" class="grw-badge-find">Find your place</a> above to see the badges with your real rating and reviews.');
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
            const color = h('input', {type: 'color', class: 'grw-badge-color', title: 'Star color', value: '#fbbc04', list: 'grw-badge-colors'});
            const toneOf = () => cb.checked ? (preset.opts.badge_tone === 'glass' ? 'glass-dark' : 'dark') : (preset.opts.badge_tone || 'light');
            const starColor = () => color.value.toLowerCase() === '#fbbc04' ? '' : color.value;
            // The design copied into a widget, with the tile's tone and star colour.
            const options = () => {
                const o = Object.assign({}, DEFAULTS, M.applyTheme({}, preset), {badge_tone: toneOf()});
                if (starColor()) W.setStyleVar('--badge-star-color', starColor(), o);
                if (shared && shared.anonym) o.anonym_avatar = true;
                return o;
            };
            const chosen = () => state.presetName === preset.name && !!state.options;
            const memo = state.cards[preset.name] || (state.cards[preset.name] = {dark: false, color: '#fbbc04'});
            if (chosen()) {
                memo.dark = /dark/.test(state.options.badge_tone || '');
                memo.color = W.styleVar('--badge-star-color') || '#fbbc04';
            }
            cb.checked = shared ? shared.dark : memo.dark;
            color.value = shared ? shared.color || '#fbbc04' : memo.color;
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
                if (shared) { cb.checked = memo.dark = shared.dark; color.value = memo.color = shared.color || '#fbbc04'; }
                draw();
                gate();
            });
            btn.onclick = () => {
                if (!chosen()) {
                    // When the saved widget is not a badge the badge is saved as a widget of its own (Plugin_Badge::save): not on the site yet.
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
    let drawSeq = 0, drawTimer = 0;
    function preview(stage) {
        // A place that finishes connecting reloads the data; the next draw follows it.
        if (!data()) return;
        const embed = state.options.badge_pos === 'embed';
        stage.classList.toggle('grw-badge-stage-float', !embed);
        stage.classList.toggle('grw-badge-stage-edge', embed && !!state.options.badge_bar);
        stage.classList.toggle('grw-badge-stage-glass', /^glass/.test(state.options.badge_tone || ''));
        clearTimeout(drawTimer);
        drawTimer = setTimeout(() => {
            const mine = ++drawSeq;
            W.post('grw_theme_preview', {pids: state.selected, langs: W.langs(), post_id: state.feedId || '', options: JSON.stringify(state.options)}, res => {
                if (mine !== drawSeq || !stage.isConnected) return;
                if (res.status !== 'success') return W.toast(W.errorOf(res) || 'Could not load the preview.', 'error');
                // The lightbox moves the popup out of the root on the first open, so it is captured once here.
                const popup = (state.options.anonym_avatar ? data().popup_anonym : data().popup) || '';
                let popupEl = null;
                const root = show(stage, res.result.html, !embed, popup ? () => grw_popup_open(root, popupEl) : null);
                if (!root) return;
                root.insertAdjacentHTML('beforeend', popup);
                popupEl = root.querySelector('.grw-popup');
            });
        }, 250);
    }

    // A look variable on the drawn badge, with no new render.
    const paint = (stage, name, value) => {
        const r = stage.querySelector('.wp-gr');
        if (r) value ? r.style.setProperty(name, value) : r.style.removeProperty(name);
    };

    function renderEditor(ctx) {
        const o = state.options, ui = ctx.ui, stage = ctx.stage;
        const drawLive = () => preview(stage);
        const layout = () => o.rating_layout || '';
        const after = [];
        const set = str => { o.rating_layout = str; drawLive(); after.forEach(f => f()); };
        const attr = (el, name) => !!M.attr(layout(), KIND, el, name);

        const POS_PILL = [['right', '↘ Bottom right'], ['left', '↙ Bottom left'], ['top-right', '↗ Top right'], ['top-left', '↖ Top left'], ['embed', '▭ Embed']];
        const POS_BAR = [['top', '▔ Top'], ['bottom', '▁ Bottom'], ['embed', '▬ Embed']];

        /* ---- 1. Position ---- */
        const b1 = ui.card('Position', true);
        const posRows = h('div', {class: 'grw-pl-pos'});
        const posButtons = [];
        const posRow = (title, items, bar) => {
            const g = h('div', {class: 'grw-pl-seg grw-pl-seg-grid'});
            items.forEach(([v, t]) => {
                const b = h('button', {type: 'button'}, esc(t));
                b.onclick = () => {
                    o.badge_pos = v;
                    if (!!o.badge_bar !== bar) {
                        // A bar keeps its rating as one group beside the phrase; a pill puts the phrase under it.
                        o.rating_layout = design(bar) || M.badgeLayout(flags(bar));
                        // A pill's width is its plate, a bar's is its phrase column: each form keeps its own (and the slider's number under Fit) while the other is shown.
                        const to = widths[bar ? 'bar' : 'pill'];
                        widths[bar ? 'pill' : 'bar'] = {width: o.badge_width, num: widthSlider.querySelector('input').value};
                        o.badge_width = to ? to.width : '';
                        syncWidth(to ? to.num : 320);
                    }
                    o.badge_bar = bar;
                    posButtons.forEach(x => x.el.classList.toggle('grw-pl-on', x.bar === bar && x.v === v));
                    syncContent();
                    syncLook();
                    drawLive();
                };
                posButtons.push({el: b, v, bar});
                g.append(b);
            });
            posRows.append(h('div', {class: 'grw-pl-sub'}, title), g);
        };
        posRow(isSticker() ? 'Sticker' : 'Badge', POS_PILL, false);
        posRow('Bar', POS_BAR, true);
        // A bar in a corner is drawn at that edge, so its button lights up the edge it collapses to.
        const curBar = !!o.badge_bar, curPos = o.badge_pos || 'right';
        const curV = curBar && curPos !== 'embed' ? (/^top/.test(curPos) ? 'top' : 'bottom') : curPos;
        posButtons.forEach(x => x.el.classList.toggle('grw-pl-on', x.bar === curBar && x.v === curV));
        b1.append(posRows);
        b1.append(ui.toggle('hide_float_badge', 'Hide on mobile'));

        /* ---- 2. Look ---- */
        const b2 = ui.card('Look', true);
        b2.append(...ui.row('Tone', ui.seg('badge_tone', [['light', 'Light'], ['dark', 'Dark'], ['glass', 'Glass'], ['glass-dark', 'Glass dark']])));
        b2.append(...ui.row('Star color', ui.color(W.styleVar('--badge-star-color') || '#fbbc04', 'Star color', v => { const c = v.toLowerCase() === '#fbbc04' ? '' : v; W.setStyleVar('--badge-star-color', c); paint(stage, '--badge-star-color', c); })));
        // A plate shaped by its radius (a circle, a pill, a pennant's top corners) has no corners the slider could hold.
        const radius = /^(\d+)px$/.exec(W.styleVar('--badge-radius') || '14px');
        // A bar runs edge to edge and has no corners: the row goes when the position makes one, and comes back with a pill.
        const corners = radius && +radius[1] <= 30 ? ui.slider('Corners', 0, 30, 1, +radius[1], 'px', v => { const c = v == 14 ? '' : v + 'px'; W.setStyleVar('--badge-radius', c); paint(stage, '--badge-radius', c); }) : null;
        if (corners) b2.append(corners);
        const syncLook = () => { if (corners) corners.hidden = !!o.badge_bar; };
        syncLook();
        b2.append(ui.slider('Opacity', 40, 100, 5, Math.round((parseFloat(W.styleVar('--badge-opacity')) || 1) * 100), '%', v => { const c = v == 100 ? '' : String(v / 100); W.setStyleVar('--badge-opacity', c); paint(stage, '--badge-opacity', c); }));

        /* ---- 3. Size ---- */
        const b3 = ui.card('Size', false);
        b3.append(ui.slider('Text size', 11, 20, 0.5, o.badge_size || 13, 'px', v => { o.badge_size = +v; drawLive(); }));
        // Stickers go down to 86px. Fit off brings back the width the widget had: the slider still holds it.
        const width = v => v == 320 ? '' : +v;
        const widthSlider = ui.slider('Width', 80, 480, 1, o.badge_width && o.badge_width !== 'auto' ? o.badge_width : 320, 'px', v => { o.badge_width = width(v); drawLive(); });
        const fit = ui.toggle('badge_width', 'Fit the first line', {get: () => o.badge_width === 'auto', set: v => { o.badge_width = v ? 'auto' : width(widthSlider.querySelector('input').value); widthSlider.hidden = v; }});
        const widths = {};
        const syncWidth = num => {
            fit.querySelector('input').checked = o.badge_width === 'auto';
            widthSlider.hidden = o.badge_width === 'auto';
            widthSlider.set(o.badge_width && o.badge_width !== 'auto' ? o.badge_width : num);
        };
        syncWidth(320);
        b3.append(fit, widthSlider);

        /* ---- 4. Content: the toggles read and write the rating layout ---- */
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
        const b4 = ui.card('Content', false);
        const content = [];
        const toggle = (label, get, put) => {
            const t = ui.toggle('', label, {get, set: v => set(put(v))});
            content.push(() => { t.querySelector('input').checked = get(); });
            return t;
        };
        // A bar always has the logo on the rating line; a wordmark (powered) on the line already is the brand, so the stars get no icon beside it.
        // Off: the logo where the design had it, else a circle takes it in the corner (on the arc), anything else in front.
        const compact = toggle('Logo on the rating line', () => attr('stars', 'logo') || !M.has(layout(), KIND, 'logo') && !/;logo$/.test(layout()),
            v => {
                if (v) return M.has(layout(), KIND, 'powered') ? bare(layout(), 'logo') : M.attr(bare(layout(), 'logo'), KIND, 'stars', 'logo', true);
                const off = M.attr(layout(), KIND, 'stars', 'logo', false);
                return restore(off, 'logo') || (W.styleVar('--badge-radius') === '50%' ? off + ';logo' : M.lead(off, KIND, 'logo'));
            });
        b4.append(compact);
        b4.append(toggle('One star instead of five', () => attr('stars', 'one'), v => M.attr(layout(), KIND, 'stars', 'one', v)));
        b4.append(toggle('Stars before the rating', () => attr('stars', 'first'), v => M.attr(layout(), KIND, 'stars', 'first', v)));
        b4.append(toggle('Count after a dot, not in brackets', () => attr('count', 'dot'), v => M.attr(layout(), KIND, 'count', 'dot', v)));
        b4.append(toggle('Hide review authors', () => attr('phrase', 'noauthor'), v => M.attr(layout(), KIND, 'phrase', 'noauthor', v)));
        b4.append(ui.toggle('anonym_avatar', 'Anonymize profile photos'));
        const eligible = rpi.Badge.Live.topRated(rpi.Badge.Live.biz({data: data()}), {badge_toprated: true});
        const icon = ui.select('', [['', 'None'], ['medal', 'Medal'], ['check', 'Check'], ['award', 'Award'], ['rosette', 'Rosette']], () => set(M.attr(layout(), KIND, 'label', 'icon', icon.value || false)));
        // Shown off below the threshold but left as saved: the badge draws the label by itself once the place qualifies.
        const top = ui.toggle('', 'Top rated label', {disabled: !eligible, title: eligible ? '' : TOP_RATED_NOTE, get: () => eligible && M.has(layout(), KIND, 'label'),
            set: v => {
                const on = restore(layout(), 'label') || M.attr(M.after(layout(), KIND, 'label', M.has(layout(), KIND, 'count') ? 'count' : 'stars'), KIND, 'label', 'dot', true);
                set(v ? M.attr(on, KIND, 'label', 'icon', icon.value || false) : M.drop(layout(), KIND, 'label'));
            }});
        content.push(() => { top.querySelector('input').checked = eligible && M.has(layout(), KIND, 'label'); });
        b4.append(top);
        if (!eligible) b4.append(h('div', {class: 'grw-pl-hint'}, TOP_RATED_NOTE + '.'));
        icon.value = M.attr(layout(), KIND, 'label', 'icon') || (M.has(layout(), KIND, 'label') ? '' : 'medal');
        content.push(() => { const v = M.attr(layout(), KIND, 'label', 'icon'); if (M.has(layout(), KIND, 'label')) icon.value = v || ''; });
        b4.append(...ui.row('Label icon', icon));
        const syncContent = () => { compact.querySelector('input').disabled = !!o.badge_bar; content.forEach(f => f()); };
        syncContent();

        /* ---- 5. Elements: size (a share of the text size) and colour of what the layout shows ---- */
        const b5 = ui.card('Elements', false);
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
        const shown = ELEMENTS.filter(e => M.has(layout(), KIND, e[0]) || e[0] === 'logo' && corner());
        const rows = shown.filter((e, i) => shown.findIndex(x => x[2] === e[2]) === i).map(([name, label, sizeVar, def, colorVar, tone]) => {
            const v = typeof sizeVar === 'function' ? sizeVar() : sizeVar, d = typeof def === 'function' ? def() : def, base = o.badge_size || 13;
            const was = W.styleVar(v), px = /px$/.test(was), pct = Math.round((px ? parseFloat(was) / base : parseFloat(was) || d) * 100);
            const box = h('div');
            box.append(ui.slider(label + ' size', 50, 300, 1, pct, '%', n => { const c = n == pct ? was : px ? Math.round(n / 100 * base) + 'px' : n / 100 + 'em'; W.setStyleVar(v, c); paint(stage, v, c); }));
            if (colorVar) {
                const had = W.styleVar(colorVar), init = had || (TONE_FG[o.badge_tone] || TONE_FG.light)[tone];
                box.append(...ui.row(label + ' color', ui.color(init, label + ' color', c => { const w = c.toLowerCase() === init.toLowerCase() ? had : c; W.setStyleVar(colorVar, w); paint(stage, colorVar, w); })));
            }
            b5.append(box);
            return [box, ELEMENTS.filter(e => e[2] === sizeVar).map(e => e[0])];
        });
        const syncElements = () => rows.forEach(([box, names]) => { box.hidden = !names.some(n => M.has(layout(), KIND, n) || n === 'logo' && corner()); });
        after.push(syncElements);
        if (!rows.length) b5.append(h('div', {class: 'grw-pl-hint'}, 'This design has no elements to size.'));

        /* ---- 6. Behaviour ---- */
        const b6 = ui.card('Behaviour', false);
        b6.append(ui.slider('Phrase change', 3, 15, 1, o.badge_interval || 6, 's', v => { o.badge_interval = v == 6 ? '' : v; drawLive(); }));
        b6.append(ui.toggle('badge_close', 'Close button'));

        return drawLive;
    }

    /* ------------------------------------------------------------ step 3: publish */

    function renderPublish(row) {
        const embed = (state.options || {}).badge_pos === 'embed';
        if (!embed) {
            const label = on => on ? 'Displayed on the site' : 'Display on the site';
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
        DEFAULTS,
        init,
        payload: () => ({global: state.global ? '1' : '0'}),
        presets: renderPresets,
        sticker: isSticker,
        noun,
        editor: renderEditor,
        preview,
        publish: renderPublish
    };
}
