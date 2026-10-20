// Create Widget: every design of themes.json as the plugin draws it (grw_theme_data), on one step page with the badges (grw_badge_kit).
// A pick copies the design's options and variables into the widget; from then on the widget holds its own look.
function grw_themes_page() {
    const root = document.getElementById('grw-themes');
    if (!root || !window.rpi || !rpi.Badge) return;

    const V0 = JSON.parse(root.dataset.vars), C = V0.cards, M = GRW_MODEL, D = V0.defaults || {};
    const BADGE_DEFAULTS = {badge_pos: D.badge_pos, badge_tone: D.badge_tone, badge_click: D.badge_click};
    const CFG = {themes: C.themes, shadows: C.shadows, legacy: C.legacy, badge: BADGE_DEFAULTS, designRows};
    const LAYOUTS = [['slider', 'Slider'], ['grid', 'Grid']];
    // Layouts without cards: one look each.
    const PLAIN = [['list', 'List'], ['rating', 'Rating']];
    const KINDS = LAYOUTS.concat(PLAIN);
    const BADGE_KINDS = [['badge', 'Badge'], ['sticker', 'Stickers']];
    const hasCards = mode => LAYOUTS.some(([k]) => k === mode);
    // The variables the page's own controls change: a widget still carries its design when only these differ.
    const OWN_VARS = M.CARD_VARS.concat(['--star-color', '--badge-star-color', '--slider-head-card-bg']);

    const asked = (V0.feedId && V0.options.view_mode) || new URLSearchParams(location.search).get('kind');
    let W, state, h, esc, kit, filter = KINDS.concat([['badge'], ['sticker']]).some(([k]) => k === asked) ? asked : 'all';

    const isTheme = o => !!o && KINDS.some(([k]) => k === o.view_mode);
    const theme = () => isTheme(state ? state.options : V0.feedId ? V0.options : null);

    // innerHTML does not run the widget's inline script (it sizes the row), so it is put in anew; then the site script starts the widget.
    function mount(host, html, ready) {
        // The old render's slider and column objects go with it: alive, they keep resize listeners and write stale column rules.
        if (window.rpi && rpi.Utils && rpi.Utils.clearIn) rpi.Utils.clearIn(host);
        host.innerHTML = html;
        if (ready) ready();
        host.querySelectorAll('script').forEach(s => { const n = document.createElement('script'); n.textContent = s.textContent; s.replaceWith(n); });
        host.querySelectorAll('.wp-gr[data-exec="false"]').forEach(r => grw_init(r, r.dataset.layout));
    }

    /* ------------------------------------------------------------ step 1 */

    // The design's variables as the gallery shows them: under "Dark site background" the dark look, with the stars colour picked above.
    const galleryVars = t => {
        const sh = state.shared;
        let sv = M.text(t.vars);
        if (sh.dark) sv = M.dark(sv, true, C.shadows);
        if (sh.color) sv += '--star-color:' + sh.color + ';';
        return sv;
    };

    // The look over the server's render: star colour and dark come from the controls above the gallery.
    function look(stage) {
        const r = stage.querySelector('.wp-gr'), sh = state.shared;
        stage.classList.toggle('grw-themes-dark', sh.dark);
        if (!r) return;
        r.classList.toggle('wp-dark', sh.dark);
        if (stage.grwTheme) W.paint(stage, galleryVars(stage.grwTheme) + (sh.color ? '' : '--star-color:;'));
    }

    // A grid tile shows whole rows: two, then two more on each "More reviews", as many cards a row as its width holds.
    function twoRows(stage) {
        const cards = [...stage.querySelectorAll('.grw-review')], more = stage.querySelector('.grw-content > .wp-google-url');
        if (!cards.length || !more) return;
        let rows = 2;
        const fit = () => {
            const n = rows * (parseInt(getComputedStyle(cards[0]).getPropertyValue('--col'), 10) || 1);
            cards.forEach((c, i) => c.classList.toggle('grw-hide', i >= n));
            more.style.display = n >= cards.length ? 'none' : '';
        };
        more.onclick = () => { rows += 2; fit(); return false; };
        // --col follows the width class the site script puts on the row a frame or more after a resize.
        new MutationObserver(fit).observe(stage.querySelector('.grw-row'), {attributeFilter: ['class']});
        fit();
    }

    // The design copied into the widget as the gallery shows it: the shared toggles (dark, anonymize, stars colour) ride along.
    function pickTheme(t) {
        const sh = state.shared;
        state.options = M.applyTheme({}, t);
        state.options.theme = t.id;
        state.options.style_vars = galleryVars(t);
        // The design's own light look, for "Dark site background" switched off on step 2 after a pick made with it on.
        state.light = sh.dark ? M.text(t.vars) + (sh.color ? '--star-color:' + sh.color + ';' : '') : null;
        state.kept = {};
        state.darkened = null;
        if (sh.dark) state.options.dark_theme = true;
        if (sh.anonym) state.options.anonym_avatar = true;
        state.preset = Object.assign({}, state.options);
        state.presetName = null;
    }

    // The design copied into the widget as a pick on step 1 does it, with the gallery toggles as the widget has them: a badge keeps
    // its position, every widget its hidden reviews.
    function applyDesign(t) {
        const o = state.options;
        Object.assign(state.shared, {dark: !!o.dark_theme, anonym: !!o.anonym_avatar});
        const hidden = o.hidden;
        if (t.opts.view_mode === 'badge') {
            // A badge picked for a widget saved as a slider, grid, list or rating is not on the site: its switch is on the Publish step.
            if (isTheme(W.savedOptions())) state.global = false;
            kit.pick(t, {badge_pos: o.badge_pos, anonym_avatar: o.anonym_avatar});
        } else pickTheme(t);
        if (hidden) state.options.hidden = hidden;
    }

    // Back to the design picked last (the options' theme; a widget saved without one takes its layout's first design). False when
    // no design is known.
    function resetTheme() {
        const o = state.options;
        const t = C.themes.find(x => x.id === o.theme) || (theme() ? null : C.themes.find(x => x.name === state.presetName)) || M.defaultTheme(C.themes, o.view_mode);
        if (!t) return false;
        applyDesign(t);
        return true;
    }

    // The Layout and Theme rows of step 2: the kind, then its designs. The value is the options' theme (the design picked last, the
    // one the reset returns to; "Custom" for a widget saved without one, or with one of another kind, offered only then). A pick is
    // a pick on step 1 that stays on step 2 — the editor is built anew for it. Slider and grid share their card designs, so one
    // keeps its look as the other's twin; another kind opens on its first design.
    const kindOf = t => t.opts.view_mode !== 'badge' ? t.opts.view_mode : kit.stickerOf(t) ? 'sticker' : 'badge';
    function designRows() {
        const o = () => state.options;
        const kind = () => { const v = o().view_mode; return v !== 'badge' ? v : kit.stickerOf({id: o().theme || ''}) || kit.sticker() ? 'sticker' : 'badge'; };
        const own = () => C.themes.find(t => t.id === o().theme && kindOf(t) === kind());
        const pick = t => { applyDesign(t); W.rebuild(); };
        return [
            {type: 'select', label: 'Layout', items: KINDS.concat(BADGE_KINDS), get: kind, change: () => {},
                set: k => { const t = own(); if (hasCards(k) && hasCards(o().view_mode)) { o().view_mode = k; if (t) o().theme = k + t.id.slice(t.id.indexOf(':')); W.rebuild(); } else pick(C.themes.find(t => kindOf(t) === k)); }},
            {type: 'select', label: 'Theme', items: [['', 'Custom']].concat(C.themes.filter(t => kindOf(t) === kind()).map(t => [t.id, t.name || t.opts.view_mode])), change: () => {},
                get: () => own() ? o().theme : '', hidden: () => own() ? [''] : [],
                set: id => pick(C.themes.find(t => t.id === id))}
        ];
    }

    function renderPresets(host, head) {
        const sh = state.shared;
        // Every design for every widget: a saved slider may become a badge and a badge a grid; the save keeps the widget's id.
        const kinds = KINDS;
        // The gallery opens on the current design's kind: a layout switched on step 2 shows its own section.
        const cur = state.options && state.options.view_mode;
        if (kinds.concat(BADGE_KINDS).some(([k]) => k === cur)) filter = cur;
        else if (filter !== 'all' && !kinds.concat(BADGE_KINDS).some(([k]) => k === filter)) filter = 'all';
        if (filter === 'badge' && kit.sticker()) filter = 'sticker';
        const filters = h('div', {class: 'grw-pl-seg grw-themes-filter', role: 'group', 'aria-label': 'Layout'});
        const tools = h('div', {class: 'grw-themes-tools'});
        // The first colour of the palette stands for each theme's own stars, as on the badges.
        const stars = h('span', {class: 'grw-themes-stars'});
        const color = h('input', {type: 'color', class: 'grw-badge-color', list: 'grw-badge-colors', 'aria-label': 'Stars color', title: 'Stars color'});
        color.value = sh.color || W.STAR;
        // Dragging in the picker fires "input" many times a frame: meanwhile only the star variables move, once a frame;
        // "change" (the picker released or closed) redraws the badges and the rest.
        let frame = 0;
        color.oninput = () => {
            sh.color = color.value.toLowerCase() === W.STAR ? null : color.value;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const c = sh.color || '';
                stages.forEach(st => W.paint(st, {'--star-color': c}));
                host.querySelectorAll('.grw-badge-root').forEach(r => c ? r.style.setProperty('--badge-star-color', c) : r.style.removeProperty('--badge-star-color'));
            });
        };
        color.onchange = () => changed('color');
        stars.append(document.createTextNode('Stars'), color);
        const switcher = (key, label) => {
            const l = h('label', {class: 'grw-badge-switch'});
            const c = h('input', {type: 'checkbox'});
            c.checked = sh[key];
            c.onchange = () => { sh[key] = c.checked; changed(key); };
            l.append(c, h('i'), document.createTextNode(label));
            return l;
        };
        tools.append(stars, switcher('dark', 'Dark site background'), switcher('anonym', 'Anonymize profile photos'));
        const note = W.sampleNote('above to see the designs with your real rating and reviews.');
        head.append(filters, tools, note);
        const count = h('span');
        head.querySelector('h2').append(' ', count);
        W.colors();

        // 38 live widgets at once make the page heavy: each is drawn as it comes near the screen.
        const lazy = new IntersectionObserver(es => es.forEach(e => {
            if (!e.isIntersecting) return;
            lazy.unobserve(e.target);
            e.target.grwDraw();
        }), {rootMargin: '600px 0px'});

        const sections = [];
        const section = (key, title, parent) => {
            const sec = h('section', {class: 'grw-themes-section', 'data-kind': key});
            sec.append(h('h3', null, esc(title)));
            (parent || host).append(sec);
            return sec;
        };
        const stages = [];
        // A design without a header takes half a row; so does a rating design, which is a header alone.
        const half = t => !!t.opts.header_hide_social || t.opts.view_mode === 'rating';
        // A half tile left alone between whole ones takes the next half tile up beside it in the page itself, so Tab goes in the order seen.
        const arranged = themes => {
            const out = [];
            let alone = -1;
            themes.forEach(t => {
                if (!half(t)) out.push(t);
                else if (alone < 0) alone = out.push(t) - 1;
                else { out.splice(alone + 1, 0, t); alone = -1; }
            });
            return out;
        };
        const tile = (grid, t) => {
            const layout = t.opts.view_mode, name = t.name || layout;
            const card = h('div', {class: 'grw-badge-card' + (half(t) ? ' grw-themes-half' : '')});
            const top = h('div', {class: 'grw-badge-card-head'}, '<span>' + esc(name) + '</span>');
            const chosen = () => theme() && M.hasTheme(state.options, t, OWN_VARS);
            const stage = h('div', {class: 'grw-badge-stage grw-themes-stage'});
            stage.grwTheme = t;
            stages.push(stage);
            const btn = h('button', {type: 'button', class: 'button button-primary', 'aria-label': (chosen() ? 'Selected: ' : 'Select ') + name + ' ' + layout}, chosen() ? 'Selected' : 'Select');
            card.classList.toggle('grw-badge-card-sel', chosen());
            btn.onclick = () => {
                if (!chosen()) pickTheme(t);
                W.go(2);
            };
            top.append(btn);
            card.append(top, stage);
            grid.append(card);
            // While a place connects there is no data; the gallery is drawn again once it comes.
            // Shaped before the widget lays itself out: a first layout with the server's two reviews makes scroll anchoring jump a row.
            return () => { stage.grwDraw = () => { if (!state.data) return; mount(stage, state.data.themes[t.id], () => { look(stage); if (layout === 'grid') twoRows(stage); }); }; lazy.observe(stage); };
        };
        kinds.forEach(([layout, title]) => {
            const sec = section(layout, title);
            const grid = h('div', {class: 'grw-badge-grid grw-themes-grid'});
            sec.append(grid);
            const cards = arranged(C.themes.filter(t => t.opts.view_mode === layout)).map(t => tile(grid, t));
            sections.push({sec, key: layout, draw: () => cards.forEach(f => f())});
        });
        const badges = BADGE_KINDS.map(([key, title]) => {
            const sec = section(key, title);
            const drawn = kit.presets(sec, null, sh, key);
            sections.push({sec, key, draw: () => drawn.refresh(), drawn: true});
            return drawn;
        });

        // Colour and dark repaint what is drawn; the photos are the server's, so they need the data again.
        function changed(key) {
            if (key === 'anonym') return W.loadData(refresh, host);
            stages.forEach(look);
            badges.forEach(b => b.refresh());
        }

        // A hidden section is drawn when it is shown: a slider started at zero width would keep the narrowest columns.
        const show = () => {
            sections.forEach(s => {
                s.sec.hidden = filter !== 'all' && filter !== s.key;
                if (!s.sec.hidden && !s.drawn) { s.drawn = true; s.draw(); }
            });
            count.textContent = '(' + host.querySelectorAll('.grw-themes-section:not([hidden]) .grw-badge-card').length + ')';
        };
        [['all', 'All']].concat(kinds, BADGE_KINDS).forEach(([v, t]) => {
            const b = h('button', {type: 'button', class: v === filter ? 'grw-pl-on' : '', 'aria-pressed': String(v === filter)}, esc(t));
            b.onclick = () => {
                filter = v;
                W.press(filters, b);
                show();
                // Scrolled into the list, the new one starts under the stuck bar; on phones only the filters stick.
                const past = host.getBoundingClientRect().top - Math.max(head.getBoundingClientRect().bottom, filters.getBoundingClientRect().bottom);
                if (past < 0) scrollBy(0, past);
            };
            filters.append(b);
        });
        function refresh() { note.hidden = !state.data.sample; sections.forEach(s => { s.drawn = false; }); show(); }
        refresh();
        return {refresh};
    }

    /* ------------------------------------------------------------ step 2 */

    function renderEditor(ctx) {
        if (!theme()) return kit.editor(ctx);
        const o = state.options, ui = ctx.ui, stage = ctx.stage;
        const cards = () => hasCards(o.view_mode);
        // The card variables as the controls show them; a list or a rating holds them unused behind a hidden section.
        const skin = M.skinOf(o.style_vars, C.shadows);
        stage.classList.add('grw-themes-stage');
        stage.classList.toggle('grw-themes-dark', !!o.dark_theme);

        // The page the widget will sit on, for the preview only: nothing of it is saved.
        const PAGES = [['#ffffff', 'White'], ['#f0f0f1', 'Gray'], ['#1d2327', 'Dark']];
        const pageBg = h('div', {class: 'grw-themes-page-bg'});
        const pages = h('div', {class: 'grw-pl-seg', role: 'group', 'aria-label': 'Page background'});
        const custom = h('input', {type: 'color', class: 'grw-badge-color', list: 'grw-badge-colors', 'aria-label': 'Page background color', title: 'Your page color'});
        const setPage = (c, b) => { stage.style.background = c; W.press(pages, b); };
        PAGES.forEach(([c, t]) => { const b = h('button', {type: 'button'}, esc(t)); b.onclick = () => { setPage(c, b); custom.value = c; }; pages.append(b); });
        custom.oninput = () => setPage(custom.value, null);
        pageBg.append(h('span', null, 'Page'), pages, custom);
        stage.closest('.grw-badge-cols').querySelector('.grw-badge-devices').before(pageBg);
        const pageFor = dark => { const i = dark ? 2 : 0; custom.value = PAGES[i][0]; setPage(PAGES[i][0], pages.children[i]); };
        pageFor(o.dark_theme);
        // Dark at once on what is drawn; the render that follows confirms it.
        const darken = v => {
            stage.classList.toggle('grw-themes-dark', v);
            pageFor(v);
            const r = stage.querySelector('.wp-gr');
            if (r) r.classList.toggle('wp-dark', v);
        };

        let sync, hiddenList = [], refocus = null;
        const popup = () => { const w = document.querySelector('.rpi-lightbox-wrap'); return w && w.style.display !== 'none' ? w.querySelector('.grw-popup') : null; };
        // The band and line colours apply to what is drawn, so the rows are sorted out again after each render. An open rating popup
        // is the lightbox's old node: the new render's popup takes its place. The button of a review just hidden or shown gets the focus back.
        const load = () => W.preview(stage, o, (html, hidden) => {
            hiddenList = hidden;
            const was = popup();
            mount(stage, html);
            if (was) { const p = stage.querySelector('.grw-popup'); if (p) grw_popup_open(stage.querySelector('.wp-gr'), p); else was.closest('.rpi-lightbox-wrap').querySelector('.rpi-x').click(); }
            if (refocus) { const b = document.querySelector(':is(.grw-badge-stage, .rpi-lightbox-wrap) [data-id="' + refocus + '"] .grw-rv-hide'); refocus = null; if (b) b.focus({preventScroll: true}); }
            if (sync) sync();
        }, {admin: 1});

        // Two scopes: this widget (the hidden option, saved with it) and all widgets (the review's own flag, by grw_hide_review).
        // An emptied list keeps the key only when the saved widget holds it: either way a hide and its undo leave the widget as saved.
        const setHidden = (id, on) => { const ids = (o.hidden || '').split(',').filter(x => x && x !== String(id)); if (on) ids.push(id); if (ids.length || 'hidden' in (W.savedOptions() || {})) o.hidden = ids.join(','); else delete o.hidden; refocus = id; };
        const toggleSite = id => { refocus = id; W.post('grw_hide_review', {id, feed_id: state.feedId || ''}, res => { if (!('hide' in res)) return W.toast(res.error || W.errorOf(res) || 'Could not change the review.', 'error'); load(); }); };
        const show = r => { if (r.widget) setHidden(r.id, false); if (r.site) toggleSite(r.id); else load(); };
        let menu = null;
        const closeMenu = () => { const m = menu; if (!m) return; menu = null; m.remove(); ['click', 'scroll'].forEach(ev => document.removeEventListener(ev, away, true)); document.removeEventListener('keydown', onKey); };
        const away = e => { if (menu && (e.type === 'scroll' || !menu.contains(e.target) && e.target !== menu.btn)) closeMenu(); };
        const onKey = e => { if (e.key === 'Escape') { const b = menu.btn; closeMenu(); b.focus(); } };
        // On the body, at the button's place: the rating popup opens in the lightbox, outside the stage.
        const openMenu = btn => {
            closeMenu();
            menu = h('div', {class: 'grw-rv-menu', role: 'menu'});
            menu.btn = btn;
            menu.addEventListener('focusout', e => { if (menu && !menu.contains(e.relatedTarget) && e.relatedTarget !== btn) closeMenu(); });
            [['Hide in this widget', () => { setHidden(btn.dataset.id, true); load(); }], ['Hide on all widgets', () => toggleSite(btn.dataset.id)]].forEach(([t, f]) => {
                const b = h('button', {type: 'button', role: 'menuitem'}, t);
                b.onclick = () => { closeMenu(); f(); };
                menu.append(b);
            });
            const r = btn.getBoundingClientRect();
            menu.style.top = (r.bottom + 4) + 'px';
            menu.style.right = (document.documentElement.clientWidth - r.right) + 'px';
            document.body.append(menu);
            menu.firstChild.focus();
            ['click', 'scroll'].forEach(ev => document.addEventListener(ev, away, true));
            document.addEventListener('keydown', onKey);
        };
        const onHide = e => {
            if (!stage.isConnected) return document.removeEventListener('click', onHide);
            const btn = e.target.closest('.grw-rv-hide');
            if (!btn) return;
            const scopes = btn.closest('[data-hidden]').dataset.hidden;
            if (scopes) return show({id: btn.dataset.id, site: /site/.test(scopes), widget: /widget/.test(scopes)});
            if (menu && menu.btn === btn) return closeMenu();
            openMenu(btn);
        };
        document.addEventListener('click', onHide);
        const hiddenRow = () => {
            const box = h('div', {class: 'grw-pl-opt'}), list = h('div', {class: 'grw-pl-opt'});
            box.append(h('span', {class: 'grw-pl-label'}, 'Hidden reviews'), list);
            const scope = r => r.site && r.widget ? 'this widget and all widgets' : r.site ? 'all widgets' : 'this widget';
            const draw = () => {
                list.innerHTML = '';
                hiddenList.forEach(r => {
                    const line = h('div', {class: 'grw-pl-row'});
                    const back = h('button', {type: 'button', class: 'button button-small'}, 'Show again');
                    back.onclick = () => show(r);
                    line.append(h('span', null, esc(r.name || 'Google User') + ' <span class="grw-pl-value">· ' + scope(r) + '</span>'), back);
                    list.append(line);
                });
            };
            return {type: 'custom', if: () => hiddenList.length > 0, render: () => [box], read: draw};
        };
        const opt = k => o[k] === undefined ? D[k] : o[k];
        const headPos = () => { const v = String(opt('slider_head_pos') || '2'); return o.view_mode === 'grid' && v === '2' ? '1' : v; };
        const PLATE = '--slider-head-card-bg', PLATE_COLOR = '--slider-head-card-bg-color';
        const plate = () => W.styleVar(PLATE);
        // What a row applies to.
        const F = {
            slider: () => o.view_mode === 'slider',
            rating: () => o.view_mode === 'rating',
            paged: () => o.view_mode === 'grid' || o.view_mode === 'list',
            header: () => !o.header_hide_social,
            headcard: () => !cards() || o.view_mode === 'grid' || headPos() !== '2',
            headbg: () => !!plate() && plate() !== 'transparent',
            autoplay: () => o.slider_autoplay !== false,
            reviews: () => o.view_mode !== 'rating' || !!o.rating_popup,
            seeall: () => o.view_mode === 'list' || o.view_mode === 'rating' && !!o.rating_popup
        };
        const all = (...fs) => () => fs.every(f => f());

        // A header variable: stored only when it differs from the stylesheet's value, painted at once.
        const sv = (name, value, def) => { const v = value === def ? '' : value; W.setStyleVar(name, v); W.paint(stage, {[name]: v}); };
        const hv = (name, label, def, cond) => ({type: 'color', hex: true, label, if: cond, get: () => W.styleVar(name) || def, set: v => sv(name, v, def)});
        // shown: the stylesheet's size, where the slider rests for a widget without the variable; put back there, nothing is stored.
        const hs = (name, label, min, max, step, shown, unit, cond) => ({type: 'slider', label, min, max, step, unit, if: cond, get: () => parseInt(W.styleVar(name), 10) || shown, set: v => sv(name, v + unit, shown + unit)});
        // Older widgets hold the plate as var(--slider-head-card-bg-color); touched here, the plate holds its colour itself.
        const plateColor = () => /^#/.test(plate()) ? plate() : W.styleVar(PLATE_COLOR) || '#f4f4f4';
        const setPlate = v => { sv(PLATE, v, ''); sv(PLATE_COLOR, '', ''); };
        // A toggle over a themed variable: off keeps the value it replaces, on puts it back; the fixed value serves only a widget that never had one.
        const off = (name, value) => { (state.kept || (state.kept = {}))[name] = W.styleVar(name); return value; };
        const back = (name, value) => state.kept && state.kept[name] !== undefined ? state.kept[name] : value;
        const btnText = () => cards() ? '#1f1f1f' : '#ffffff';
        const RL = () => o.rating_layout || '';
        const attrRow = (el, name, label) => ({type: 'toggle', label, if: () => F.header() && !!RL() && M.has(RL(), 'rating', el),
            get: () => !!RL() && !!M.attr(RL(), 'rating', el, name), set: v => { o.rating_layout = M.attr(RL(), 'rating', el, name, v); }});
        // Painted by set; the rows that hang on it are sorted out without a render.
        const painted = () => sync();
        const tog = (key, label, hint, cond) => ({type: 'toggle', key, label, hint, if: cond, get: () => !!opt(key)});

        /* The layouts: the card lines and the header lines as rows (rpi.CardEditor.Lines), the Photo and Google logo places, and
         * the layout strings themselves under Advanced. A row change is a new layout string and a new render. */
        const E = rpi.Card, Ed = rpi.CardEditor;
        const KEY = {card: 'card_layout', rating: 'rating_layout'}, FALLBACK = {card: 'text', rating: 'stars'};
        const layout = kind => o[KEY[kind]] || '';
        const model = kind => E.parse(layout(kind) || FALLBACK[kind], kind);
        const view = kind => Ed.project(model(kind));
        // A row dropped or moved by a key is no change or click event: the commit is said here.
        const put = (kind, str) => { o[KEY[kind]] = str; sync(); load(); W.commit(); };
        // The rows show a layout as written when the layout they would save draws the same block.
        const stub = kind => { const S = {slot: '', frame: ''}; E.KINDS[kind].elements.forEach(k => { S[k] = (r, x) => '<' + k + ' ' + x.cls + (x.logo ? ' logo' : '') + '>'; }); return S; };
        const drawn = (s, kind) => E.render({}, E.parse(s, kind), stub(kind));
        const NOTE = {card: 'This layout has more nesting than the rows above can show. It renders as written; editing the rows will simplify it.',
            rating: 'This header has more nesting than the rows above can show. It renders as written; editing the rows will simplify it.'};
        const nested = kind => { const s = layout(kind); return !!s && drawn(Ed.canonical(s, kind), kind) !== drawn(s, kind); };
        const HELP = {card: 'Drag rows by ⋮⋮, also between sections. The two squares put a row on the line above; the arrow to a bar pushes it to the right edge; the two bars and a box put it side by side with the lines above.',
            rating: 'The parts of the rating header and their order: drag rows by ⋮⋮, the two squares put a row on the line above, the arrow to a bar pushes it to the right edge; the two bars and a box put it side by side with the lines above.'};
        // The rows are set anew when the string changed elsewhere: a toggle, the code field. Their own view says where the photo
        // stands when the string cannot (a photo alone on its line), so the Photo select reads it.
        const linesRow = (kind, labels, cond) => {
            const box = h('div', {class: 'grw-pl-opt'}), host = h('div', {class: kind === 'card' ? 'grw-card-lines' : 'grw-head-lines'}), note = h('div', {class: 'grw-pl-hint'});
            let last = null;
            const lines = Ed.Lines(host, str => { last = str; put(kind, str); }, labels, kind);
            box.append(h('span', {class: 'grw-pl-label'}, kind === 'card' ? 'Card lines' : 'Header lines'), host, h('div', {class: 'grw-pl-hint'}, esc(HELP[kind])), note);
            const read = () => {
                const s = layout(kind);
                if (s && s !== last) { last = s; lines.set(view(kind)); }
                note.textContent = nested(kind) ? NOTE[kind] : '';
            };
            return {type: 'custom', if: cond, render: () => [box], read, edit: fn => lines.edit(fn), view: () => lines.get() || view(kind)};
        };
        const codeRow = (kind, label, hint, cond) => {
            const input = h('input', {type: 'text', class: 'grw-pl-input code', spellcheck: 'false', autocomplete: 'off', 'aria-label': label});
            const err = h('div', {class: 'grw-card-error', hidden: true});
            const apply = () => {
                let str;
                try { str = E.serialize(E.parse(input.value, kind)); Ed.canonical(str, kind); }
                catch (e) { err.textContent = e.message; err.hidden = false; return; }
                err.hidden = true;
                input.value = str;
                if (str !== layout(kind)) put(kind, str);
            };
            input.onchange = apply;
            input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } };
            const box = h('div', {class: 'grw-pl-opt'});
            box.append(h('span', {class: 'grw-pl-label'}, esc(label)), input);
            // What is typed, and an error under it, stay until the layout changes elsewhere.
            let shown = null;
            return {type: 'custom', if: cond, render: () => [box, h('div', {class: 'grw-pl-hint'}, esc(hint)), err],
                read: () => { const s = layout(kind); if (s !== shown) { shown = s; if (document.activeElement !== input) { input.value = s; err.hidden = true; } } }};
        };
        const cardLines = cards() && linesRow('card', {logo: 'Google logo'});
        const headLines = linesRow('rating', {logo: 'Google logo', powered: 'Powered by Google'}, F.header);
        const photoLock = () => { const v = cardLines.view(); return v.sections.some(s => s.style === 'bubble') ? 'Not shown with a speech bubble' : v.sections[0] && v.sections[0].style === 'band' ? 'Not shown with a band on Section 1' : ''; };
        // "On the top border" takes the photo out of the rows only once it leads Section 1.
        const photoTop = () => { if (cardLines.view().photo !== 'top') return false; const sec = model('card').sections[0], lead = sec && sec.items[0]; return !(lead && (lead.el === 'photo' || lead.dir === 'row' && lead.items[0].el === 'photo')); };

        // Reviews before "More reviews": an older widget may hold any number, and an empty one shows all.
        const pageVal = () => o.pagination === undefined ? D.pagination : String(o.pagination) === '' ? '0' : String(o.pagination);
        const perPage = () => {
            const v = pageVal();
            return {type: 'select', key: 'pagination', label: 'Reviews per page', get: pageVal, if: F.paged,
                items: [...new Set(['3', '4', '5', '6', '8', '9', '10', '12', '15', '20', '30', v])].filter(n => n !== '0').sort((a, b) => a - b).map(n => [n, n]).concat([['0', 'All']])};
        };

        const DEVICES = [['3000', 'Large desktop & TV'], ['1200', 'Desktop'], ['1024', 'Laptop'], ['768', 'Tablet'], ['480', 'Mobile'], ['', 'Custom']];
        // Columns per width as the site script reads them, "width:columns,…"; none means as many as the width holds.
        const breakpoints = () => {
            const box = h('div', {class: 'grw-themes-bp'}), lines = h('div', {class: 'grw-themes-bp-lines'});
            const note = h('div', {class: 'grw-pl-hint'}, 'Auto: as many columns as the width holds.');
            const add = h('button', {type: 'button', class: 'button'}, 'Add breakpoint');
            const list = (o.slider_breakpoints || '').split(',').map(s => s.split(':')).filter(p => p[0] && p[0].trim()).map(p => ({w: p[0].replace('px', '').trim(), c: parseInt(p[1], 10) || 3}));
            const write = () => { o.slider_breakpoints = list.filter(b => b.w).map(b => b.w + ':' + b.c).join(','); load(); };
            const draw = () => {
                lines.innerHTML = '';
                list.forEach((b, i) => {
                    const line = h('div', {class: 'grw-pl-opt'}), top = h('div', {class: 'grw-pl-row'});
                    const known = DEVICES.some(([v]) => v && v === b.w);
                    const sel = ui.select(null, DEVICES, {get: () => known ? b.w : '', set: v => { b.w = v; }, change: () => { write(); draw(); }});
                    sel.setAttribute('aria-label', 'Screen');
                    const x = h('button', {type: 'button', class: 'grw-themes-bp-x', 'aria-label': 'Remove'}, '&times;');
                    x.onclick = () => { list.splice(i, 1); write(); draw(); };
                    top.append(sel, x);
                    if (!known) {
                        const px = h('input', {type: 'number', class: 'grw-pl-input grw-themes-px', min: 100, max: 4000, placeholder: 'px', 'aria-label': 'Width in px'});
                        px.value = b.w;
                        px.onchange = () => { b.w = px.value; write(); };
                        sel.after(px);
                    }
                    line.append(top, ui.slider('Columns', 1, 12, 1, b.c, '', v => { b.c = +v; write(); }));
                    lines.append(line);
                });
                note.hidden = list.length > 0;
            };
            add.onclick = () => { const used = list.map(b => b.w); list.push({w: (DEVICES.find(([v]) => v && used.indexOf(v) < 0) || [''])[0], c: 3}); write(); draw(); };
            draw();
            box.append(lines, note, add);
            return {type: 'custom', render: () => [box]};
        };

        // Every card variable is the widget's own: a change writes the whole set and paints it over the render.
        const skinChanged = () => { o.style_vars = M.withCard(o.style_vars, skin, C.shadows); W.paint(stage, o.style_vars); };
        const sk = cards() ? W.controls(ctx.side, skin, () => { skinChanged(); sync(); }) : null;
        const skinColor = (key, label, cond) => ({type: 'color', hex: true, label, get: () => skin[key], set: v => { skin[key] = v; skinChanged(); }, if: cond});
        const skinSlider = (key, label, min, max, step, unit) => ({type: 'slider', label, min, max, step, unit, get: () => skin[key], set: v => { skin[key] = +v; skinChanged(); }});
        sync = ui.table([
            {title: 'Layout', open: true, rows: designRows()},
            {title: 'Header', open: false, rows: [
                {type: 'toggle', key: 'header_hide_social', label: 'Show the business header', get: () => !o.header_hide_social, set: v => { o.header_hide_social = !v; }},
                // A grid draws its header on top: "Beside" is not offered, and a stored 2 shows as "Above" until the user picks.
                {type: 'select', key: 'slider_head_pos', label: 'Header position', items: [['1', 'Above the reviews'], ['2', 'Beside the reviews'], ['3', 'Below the reviews']],
                    get: headPos, hidden: () => o.view_mode === 'grid' ? ['2'] : [], if: all(cards, F.header)},
                headLines,
                attrRow('stars', 'nonum', 'Hide the rating number'),
                attrRow('based', 'bold', 'Bold review count'),
                attrRow('based', 'short', 'Short review count'),
                attrRow('powered', 'short', 'Short Google logo'),
                {type: 'toggle', label: 'Business name links to Google', if: F.header, get: () => !opt('disable_biz_link'), set: v => { o.disable_biz_link = !v; }},
                {type: 'toggle', label: 'Header background', if: all(F.header, F.headcard), get: F.headbg, set: v => setPlate(v ? back(PLATE, '') || W.styleVar(PLATE_COLOR) || (o.dark_theme ? '#383e45' : '#f4f4f4') : off(PLATE, '')), change: painted},
                {type: 'color', hex: true, label: 'Header background color', if: all(F.header, F.headcard, F.headbg), get: plateColor, set: setPlate},
                {type: 'toggle', label: 'Rounded header corners', if: all(F.header, F.headcard), get: () => W.styleVar('--slider-head-card-radius') !== '0', set: v => sv('--slider-head-card-radius', v ? back('--slider-head-card-radius', '') : off('--slider-head-card-radius', '0'), null), change: painted},
                {type: 'toggle', label: 'Header shadow', if: all(F.header, F.headcard), get: () => !!W.styleVar('--slider-head-card-shadow') && W.styleVar('--slider-head-card-shadow') !== 'none', set: v => sv('--slider-head-card-shadow', v ? back('--slider-head-card-shadow', '') || 'var(--rev-shadow)' : off('--slider-head-card-shadow', ''), null), change: painted}
            ]},
            {title: 'Common', open: false, rows: [
                perPage(),
                {type: 'number', key: 'text_size', label: 'Characters before "read more"', placeholder: 'Default', min: 0, hint: 'Empty: a long review folds at the "Text lines" of the card, and "read more" opens the rest.', if: F.reviews},
                tog('short_last_name', 'Shorten last name (GDPR)', 'Only the first name and the first letter of the last name.', F.reviews),
                tog('anonym_avatar', 'Anonymize profile photos', 'The first letter of the name on a colored circle instead of the photo, which never reaches your site.', F.reviews),
                {type: 'toggle', label: 'Show reviews without text', if: F.reviews, get: () => !opt('min_letter'), set: v => { o.min_letter = !v; }},
                tog('rating_popup', 'Open reviews in a popup on click', 'The rating becomes a button that opens the reviews in a popup.', F.rating)
            ]},
            {title: 'Slider', open: false, if: F.slider, rows: [
                {type: 'toggle', key: 'slider_autoplay', label: 'Autoplay', get: F.autoplay, set: v => { o.slider_autoplay = v; }},
                {type: 'slider', label: 'Speed', min: 1, max: 10, step: 1, unit: 's', get: () => o.slider_speed || D.slider_speed, set: v => { o.slider_speed = v == D.slider_speed ? '' : v; load(); }, if: F.autoplay},
                {type: 'toggle', key: 'slider_mousestop', label: 'Pause on hover', get: () => o.slider_mousestop !== false, set: v => { o.slider_mousestop = v; }, if: F.autoplay},
                {type: 'toggle', key: 'slider_hide_prevnext', label: 'Show arrows', get: () => !o.slider_hide_prevnext, set: v => { o.slider_hide_prevnext = !v; }},
                {type: 'toggle', key: 'slider_hide_dots', label: 'Show dots', get: () => !o.slider_hide_dots, set: v => { o.slider_hide_dots = !v; }}
            ]},
            cards() && {title: 'Columns', open: false, rows: [breakpoints()]},
            cards() && {title: 'Card', open: false, ui: sk, rows: [
                cardLines,
                {type: 'select', label: 'Photo', items: [['beside', 'Beside the rows below it'], ['above', 'On its own line'], ['top', 'On the top border']],
                    get: () => cardLines.view().photo, set: v => cardLines.edit(x => Ed.photoMode(x, v)), change: () => {}, locked: () => ({top: photoLock()})},
                {type: 'custom', if: photoTop, render: () => [h('div', {class: 'grw-pl-hint'}, 'Drag Photo to the very top of Section 1 to put it on the border.')]},
                {type: 'select', label: 'Google logo', items: [['corner', 'Corner'], ['photo', 'On the photo'], ['name', 'Next to the name'], ['stars', 'Next to the stars'], ['layout', 'In the rows above'], ['hidden', 'Hidden']],
                    get: () => cardLines.view().logo, set: v => cardLines.edit(x => { x.logo = v; }), change: () => {}},
                {type: 'seg', key: 'bg', label: 'Background', items: [['color', 'Color'], ['gradient', 'Gradient'], ['none', 'None']]},
                skinColor('bg1', 'Background color', () => skin.bg !== 'none'),
                skinColor('bg2', 'Gradient end color', () => skin.bg === 'gradient'),
                {type: 'toggle', key: 'border', label: 'Border'},
                skinColor('borderColor', 'Border color', () => !!skin.border),
                {type: 'select', key: 'shadow', label: 'Shadow', items: [['none', 'None'], ['light', 'Light'], ['soft', 'Soft'], ['grw', 'Classic']]},
                skinSlider('radius', 'Corner radius', 0, 24, 1, 'px'),
                skinColor('band', 'Band color', () => !!stage.querySelector('.rpi-card .rpi-band')),
                skinColor('divider', 'Line color', () => !!stage.querySelector('.rpi-card .rpi-sep')),
                skinColor('stars', 'Stars color'),
                skinSlider('starSize', 'Stars size', 12, 28, 1, 'px'),
                skinColor('text', 'Text color'),
                // The site script cuts the text when a card is drawn, so a new number of lines needs a new render.
                {type: 'select', key: 'lines', label: 'Text lines', items: [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['none', 'All']],
                    hint: 'Longer reviews end with "read more", which opens the rest in the card.', change: () => { skinChanged(); load(); }},
                skinColor('date', 'Date color'),
                skinSlider('photo', 'Photo size', 32, 64, 2, 'px'),
                {type: 'toggle', key: 'gray', label: 'Gray photos'}
            ]},
            {title: 'Style', open: false, rows: [
                {type: 'toggle', key: 'dark_theme', label: 'Dark site background', set: v => {
                    if (cards()) {
                        state.kept = {};
                        if (v) {
                            state.light = o.style_vars;
                            o.style_vars = M.dark(o.style_vars, v, C.shadows, null);
                            const was = M.pairs(state.light), now = M.pairs(o.style_vars);
                            state.darkened = Object.keys(now).filter(k => now[k] !== was[k]).reduce((d, k) => { d[k] = now[k]; return d; }, {});
                        } else if (state.light == null) {
                            o.style_vars = M.dark(o.style_vars, v, C.shadows, null);
                        } else {
                            // Only what the switch itself changed goes back: a variable set while dark was on stays.
                            const light = state.light, was = M.pairs(light), now = M.pairs(o.style_vars);
                            const d = state.darkened || Object.keys(now).filter(k => now[k] !== was[k]).reduce((x, k) => { x[k] = now[k]; return x; }, {});
                            const touched = Object.keys(now).some(k => k in d ? now[k] !== d[k] : now[k] !== was[k]) || Object.keys(was).some(k => !(k in now) && !(k in d));
                            Object.keys(d).forEach(k => { if (now[k] === d[k]) { if (was[k] === undefined) delete now[k]; else now[k] = was[k]; } });
                            o.style_vars = touched ? M.text(now) : light;
                        }
                        Object.assign(skin, M.skinOf(o.style_vars, C.shadows));
                        W.paint(stage, o.style_vars);
                    }
                    o.dark_theme = v;
                    darken(v);
                }},
                {type: 'toggle', label: 'Uppercase rating label', if: F.header, get: () => W.styleVar('--head-scale-case') !== 'none', set: v => sv('--head-scale-case', v ? 'uppercase' : 'none', 'uppercase'), change: painted},
                hv('--star-color', 'Stars color', '#fb8e28', () => !cards()),
                hv('--star-color', 'Rating stars color', '#fb8e28', cards),
                hv('--head-name-color', 'Business name color', '#333333', F.header),
                hv('--head-scale-color', 'Rating label color', '#333333', F.header),
                hv('--head-based-color', '"Based on N reviews" color', '#555555', F.header),
                hv('--powered-color', '"Powered by Google" color', '#5e5e5e', F.header),
                hv('--btn-color', '"Review us" button color', cards() ? '#ffffff' : '#1f67e7', F.header),
                // The blue button's text shadow goes once its text colour is touched.
                {type: 'color', hex: true, label: '"Review us" button text color', if: F.header, get: () => W.styleVar('--btn-txt-color') || btnText(),
                    set: v => { sv('--btn-txt-color', v, btnText()); sv('--btn-txt-shadow', v === btnText() ? '' : 'none', ''); }},
                {type: 'color', hex: true, label: 'Review author name color', if: F.reviews, get: () => cards() ? skin.name : W.styleVar('--name-color') || '#154fc1',
                    set: v => { if (cards()) { skin.name = v; skinChanged(); } else sv('--name-color', v, '#154fc1'); }},
                hv('--text-color', 'Reviews text color', '#222222', () => F.reviews() && !cards()),
                hs('--head-scale-fs', 'Rating label size', 12, 48, 1, 24, 'px', F.header),
                hs('--head-scale-weight', 'Rating label weight', 100, 900, 100, 700, '', F.header),
                hs('--head-star-size', 'Rating stars size', 12, 48, 1, 20, 'px', F.header),
                // 18 = the 16px "powered by" text × the 1.15em the stylesheet draws the logo at (public-main.css, icons.css).
                hs('--head-logo-size', 'Google logo size', 10, 48, 1, 18, 'px', F.header)
            ]},
            {title: 'Advanced', open: false, rows: [
                cards() && codeRow('card', 'Layout code', 'The card lines as one line: sections "|", lines ",", side by side "+", groups "( )", hidden "-", push to the edge "~". The logo: "photo{logo}", "name{logo}", "stars{logo}", a row of its own, or ";logo" for the corner. Press Enter to apply.'),
                codeRow('rating', 'Header layout code', 'The header lines as one line, in the card lines\' language: photo, name, scale, stars{nonum}, based{short,bold}, count, powered{short}, logo, label, phrase, write, seeall. Press Enter to apply.', F.header),
                {type: 'textarea', key: 'css_vars', label: 'CSS variables', rows: 5, placeholder: '--card-bg: #ffffff; --card-text-size: 14px;',
                    hint: 'For those who know CSS: variables for this widget, one per line. --card-… change the review cards, --head-… the rating header; they win over the controls above.'},
                {type: 'select', key: 'reviewer_avatar_size', label: 'Photo resolution', items: [['56', '56 px (standard)'], ['128', '128 px (Retina)'], ['256', '256 px (max)']],
                    get: () => String(opt('reviewer_avatar_size') || 56), hint: 'Photos show at 44 px; a higher resolution is sharper on Retina screens and loads more data.', if: F.reviews},
                {type: 'select', key: 'cache', label: 'Cache', items: [['1', '1 hour'], ['3', '3 hours'], ['6', '6 hours'], ['12', '12 hours'], ['24', '1 day'], ['48', '2 days'], ['168', '1 week'], ['', 'Disabled (not recommended)']],
                    get: () => o.cache === undefined ? String(D.cache) : String(o.cache), change: () => {}},
                {type: 'number', key: 'reviews_limit', label: 'Maximum reviews to load', placeholder: 'All', min: 0, hint: 'Empty: every review Google gives.', if: F.reviews},
                tog('lazy_load_img', 'Lazy load images', 'Images load when they come near the screen.'),
                tog('nofollow_link', 'Use nofollow links'),
                tog('open_link', 'Open links in a new tab'),
                tog('aria_label', 'ARIA labels for screen readers', 'Spoken labels on the stars and links.'),
                tog('media', 'Show review images', null, F.reviews),
                tog('reply', 'Show owner responses', null, F.reviews),
                tog('google_def_rev_link', 'Use the default Google reviews link', 'When the direct link to all reviews does not work for your place, the standard Google link is used.', F.seeall),
                hiddenRow()
            ]}
        ]);

        // Variables paint, the rest is a render; the device buttons only change the stage width.
        return key => {
            if (key === 'device') return;
            sync();
            load();
        };
    }

    /* ------------------------------------------------------------ step 3 */

    const PLACES = {
        slider: 'A slider fits the home page, between two sections, where visitors decide whether to trust you.',
        grid: 'A grid suits a page of its own, such as Reviews or Testimonials, or the end of a service page.'
    };

    // The column beside the stage on the Publish step: the ways to put the saved widget on a page. Nothing reaches the site by itself,
    // except a floating badge, which its own button shows on every page.
    function resultSide(side) {
        const badge = !theme(), floating = badge && state.options.badge_pos !== 'embed';
        const sc = '[grw id=' + state.feedId + ']';
        const put = h('section', {class: 'grw-pl-card grw-themes-put'});
        put.append(h('h3', null, 'Add it to your site'));
        // A floating badge goes on the site by its own button, and the shortcode is for one page only.
        const byHand = floating ? h('div', {class: 'grw-themes-add'}) : put;
        if (floating) {
            const show = h('div', {class: 'grw-themes-show'});
            kit.publish(show);
            put.append(show, h('p', {class: 'description'}, 'It appears on every page of your site.'), byHand);
            byHand.append(h('p', {class: 'grw-themes-or'}, 'Need it on one page only?'));
        } else if (badge) {
            // In the page: the site switch shown off, with the reason.
            const show = h('div', {class: 'grw-themes-show'});
            kit.publish(show);
            put.append(show);
        }

        // The ways this site has: the block where the block editor edits pages or posts; the Site Editor on a block theme, else a widget area.
        const ED = V0.editor || {};
        const WAYS = [
            ED.block && ['Block editor', 'Edit a page or post, click <b>+</b>, search for <b>Google Reviews</b> and pick <b>' + esc(state.title) + '</b>.'],
            ['Elementor and other builders', 'Add the builder\'s <b>Shortcode</b> element and paste the shortcode into it.'],
            ED.blockTheme ? ['Site Editor', 'In <b>Appearance → Editor</b> open a template part such as the footer, click <b>+</b>, add the <b>Google Reviews</b> block and pick <b>' + esc(state.title) + '</b>.']
                : ED.widgets && ['Widget area', 'In <b>Appearance → Widgets</b> add the <b>Google Reviews</b> widget to a sidebar or footer and choose <b>' + esc(state.title) + '</b>.']
        ].filter(Boolean);
        const field = h('input', {type: 'text', class: 'grw-themes-sc', readonly: true, value: sc, 'aria-label': 'Shortcode'});
        const copy = h('button', {type: 'button', class: floating ? 'button' : 'button button-primary'}, 'Copy');
        copy.onclick = () => {
            field.select();
            (navigator.clipboard ? navigator.clipboard.writeText(sc) : Promise.reject()).catch(() => document.execCommand('copy'));
            copy.textContent = 'Copied';
            setTimeout(() => { copy.textContent = 'Copy'; }, 2000);
        };
        const line = h('div', {class: 'grw-themes-sc-row'});
        line.append(field, copy);
        byHand.append(line, h('p', {class: 'description'}, 'Paste the shortcode into any page, post or text widget.'));
        WAYS.forEach(([t, text]) => {
            const way = h('details', {class: 'grw-themes-way'});
            way.append(h('summary', null, esc(t)), h('p', {class: 'description'}, text));
            byHand.append(way);
        });
        if (!floating) {
            const add = h('div', {class: 'grw-themes-add'});
            const make = h('button', {type: 'button', class: 'button'}, 'Create a draft page');
            const made = h('p', {class: 'description grw-themes-made', 'aria-live': 'polite'}, 'A new draft page "Reviews" with only this widget in it. Nothing changes on your site until you publish that page.');
            const or = h('p', {class: 'grw-themes-or'}, 'No page for it yet?');
            const ready = page => {
                or.hidden = make.hidden = true;
                const title = esc(page.title || '(no title)');
                const view = '<a href="' + esc(page.view) + '" target="_blank" rel="noopener">view it</a>', edit = '<a href="' + esc(page.edit) + '">';
                made.innerHTML = page.live
                    ? 'This widget is on the page "' + title + '": ' + view + ' · ' + edit + 'edit it</a>.'
                    : 'The draft page "' + title + '" is ready: ' + view + ' or ' + edit + 'edit and publish it</a>.';
            };
            // A page that already holds the widget (made here or by hand, published or not) is named, not made again; the server answers it as well.
            if (state.page) ready(state.page);
            make.onclick = () => {
                make.disabled = true;
                W.post('grw_theme_page', {post_id: state.feedId}, res => {
                    if (res.status !== 'success') { make.disabled = false; return W.toast(W.errorOf(res) || 'Could not create the page.', 'error'); }
                    state.page = res.result;
                    ready(res.result);
                    W.toast(res.result.live ? 'This widget is already on a page.' : 'The draft page is ready.');
                });
            };
            add.append(or, make, made);
            put.append(add);
        }
        if (PLACES[state.options.view_mode]) put.append(h('p', {class: 'grw-themes-tip'}, '<span class="dashicons dashicons-lightbulb"></span>' + esc(PLACES[state.options.view_mode])));

        const links = h('p', {class: 'grw-pl-links'}, '<a href="#" class="grw-themes-back">Back to setup</a> · <a href="' + esc(location.pathname + '?page=grw-widget') + '">Create another</a>');
        links.querySelector('.grw-themes-back').onclick = e => { e.preventDefault(); W.go(2); };
        side.append(put, links);
    }


    grw_steps(root, {
        noun: () => theme() ? state.options.view_mode : kit.noun(),
        pick: 'Select a design',
        previewTitle: () => theme() ? 'Widget preview' : kit.sticker() ? 'Sticker preview' : 'Badge preview',
        data: 'grw_theme_data',
        dataKey: () => state.shared.anonym ? 'anonym' : '',
        dataFields: () => ({anonym: state.shared.anonym ? '1' : ''}),
        save: () => theme() ? 'grw_theme_save' : 'grw_badge_save',
        defaults: () => theme() ? {view_mode: 'slider'} : BADGE_DEFAULTS,
        unpublished: () => !theme() && !state.global && state.options.badge_pos !== 'embed',
        init(w) {
            W = w; state = w.state; h = w.h; esc = w.esc;
            state.shared = {color: null, dark: false, anonym: false};
            // A widget saved by an older version opens in the current model; nothing is saved until the user does.
            if (state.options && M.isLegacy(state.options)) {
                state.options = M.convert(state.options, CFG);
                state.preset = Object.assign({}, state.options);
            }
            kit = grw_badge_kit(W, () => state.data && state.data.badge, CFG);
            if (theme()) state.global = false;
            else kit.init();
        },
        presets: renderPresets,
        editor: renderEditor,
        resultSide,
        reset: resetTheme
    });
}

// public-main.js (grw_init) and badge.js are loaded after this file, so wait for the DOM.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', grw_themes_page);
else grw_themes_page();
