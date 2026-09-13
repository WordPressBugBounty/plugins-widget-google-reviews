// Drawn by the site's rpi.Badge (badge.js), so the preview is the production render.
function grw_badge_page() {
    const root = document.getElementById('grw-badge');
    if (!root || !window.rpi || !rpi.Badge) return;

    const V = JSON.parse(root.dataset.vars);
    const body = root.querySelector('.grw-badge-body');
    const steps = [...root.querySelectorAll('.grw-badge-steps li')];
    const CONNECT_URL = V.connect || 'https://app.richplugins.com/public/connect';
    const CONNECT_ORIGIN = new URL(CONNECT_URL).origin;

    const DEFAULTS = {badge_pos: 'right', badge_tone: 'light', badge_icon: 'medal', badge_click: 'sidebar'};
    const TOP_RATED_NOTE = 'Top rated appears from a 4.5 rating and 10 reviews';
    const PRESETS = [
        {name: 'Classic',        opts: {}},
        {name: 'Square corners', opts: {style_vars: '--badge-radius:3px;', badge_dot: true}},
        {name: 'Pill',           opts: {style_vars: '--badge-radius:999px;'}},
        {name: 'Top rated',      opts: {badge_dot: true, badge_toprated: true}},
        {name: 'Glass',          opts: {badge_tone: 'glass', badge_dot: true}},
        {name: 'Stars first',    opts: {badge_order: 'stars'}},
        {name: 'Compact',        opts: {badge_compact: true, badge_dot: true, badge_width: 'auto'}},
        {name: 'Compact, square corners', opts: {badge_compact: true, badge_width: 'auto', style_vars: '--badge-radius:3px;'}},
        {name: 'One star',       opts: {badge_onestar: true, badge_compact: true, badge_width: 250}},
        {name: 'One star first', opts: {badge_onestar: true, badge_order: 'stars', badge_compact: true, badge_dot: true, badge_width: 250}},
        {name: 'One star first, top rated', opts: {badge_onestar: true, badge_order: 'stars', badge_compact: true, badge_dot: true, badge_toprated: true, badge_width: 'auto'}},
        {name: 'Bar',            opts: {badge_bar: true, badge_pos: 'top', badge_dot: true, badge_toprated: true}},
        {name: 'Bar, plain',     opts: {badge_bar: true, badge_pos: 'top'}},
        {name: 'Bar, one star',  opts: {badge_bar: true, badge_pos: 'top', badge_onestar: true}},
        {name: 'Bar, one star, top rated', opts: {badge_bar: true, badge_pos: 'top', badge_onestar: true, badge_dot: true, badge_toprated: true}}
    ];

    const state = {
        step: V.feedId ? Math.min(3, Math.max(1, parseInt(new URLSearchParams(location.search).get('step'), 10) || 2)) : 1,
        tiles: V.places.filter(p => V.feedId && V.selected.includes(p.id)).map(p => Object.assign({connected: true}, p, V.langs && V.langs[p.id] ? {lang: V.langs[p.id]} : {})),
        selected: V.feedId ? V.selected.filter(id => V.places.some(p => p.id === id)) : [],
        options: V.feedId ? Object.assign({}, DEFAULTS, V.options) : null,
        preset: V.feedId ? Object.assign({}, DEFAULTS, V.options) : null,
        data: null,
        feedId: V.feedId,
        title: V.title,
        global: V.feedId ? !!V.global : false,
        done: V.feedId ? 3 : 1,
        presetName: null,
        cards: {},
        device: 'desktop',
        credits: -1
    };

    const toast = (msg, type, action) => GRW_TOAST.show({msg, type: type || 'success', action});
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
    const h = (tag, atts, html) => {
        const e = document.createElement(tag);
        for (const k in atts || {}) {
            if (k === 'class') e.className = atts[k];
            else if (k === 'on') for (const ev in atts[k]) e.addEventListener(ev, atts[k][ev]);
            else if (atts[k] != null && atts[k] !== false) e.setAttribute(k, atts[k]);
        }
        if (html != null) e.innerHTML = html;
        return e;
    };
    const post = (action, fields, cb) => {
        const fd = new FormData();
        fd.append('action', action);
        fd.append('grw_nonce', V.nonce);
        fd.append('grw_wpnonce', V.nonce);
        for (const k in fields) {
            if (Array.isArray(fields[k])) fields[k].forEach(v => fd.append(k + '[]', v));
            else fd.append(k, fields[k]);
        }
        fetch(ajaxurl, {method: 'POST', credentials: 'same-origin', body: fd})
            .then(r => r.json()).then(cb)
            .catch(() => cb({status: 'failed', result: {error_message: 'Request failed, please try again.'}}));
    };
    const errorOf = grw_get_error;

    /* ------------------------------------------------------------ steps */

    if (state.options) {
        const fit = PRESETS.filter(p => Object.keys(p.opts).every(k => state.options[k] === p.opts[k]));
        fit.sort((x, y) => Object.keys(y.opts).length - Object.keys(x.opts).length);
        state.presetName = fit.length ? fit[0].name : null;
    }

    function go(step) {
        state.step = step;
        state.done = Math.max(state.done, step);
        if (state.feedId) {
            const url = new URL(location.href);
            url.searchParams.set('step', step);
            history.replaceState(null, '', url);
        }
        steps.forEach(li => {
            li.classList.toggle('grw-badge-step-on', reached(+li.dataset.step));
            li.classList.toggle('grw-badge-step-cur', +li.dataset.step === step);
        });
        body.innerHTML = '';
        if (step === 1) renderStart();
        if (step === 2) loadData(renderEditor);
        if (step === 3) renderPublish();
        window.scrollTo(0, 0);
    }
    // While the first save is in flight the page already sits on step 3 without an id.
    const reached = step => step === 3 ? (!!state.feedId || state.step === 3) : step <= state.done;
    steps.forEach(li => li.addEventListener('click', () => {
        const to = +li.dataset.step;
        if (!reached(to) || to === state.step) return;
        go(to);
    }));

    const langs = () => { const m = {}; state.tiles.filter(t => t.connected).forEach(t => { m[t.id] = t.lang || ''; }); return JSON.stringify(m); };
    const payload = global => ({post_id: state.feedId || '', title: state.title || '', global: global ? '1' : '0', pids: state.selected, langs: langs(), options: JSON.stringify(state.options || DEFAULTS)});

    // The id goes into the URL, so a reload or a second save edits this badge instead of creating another.
    function publish() {
        if (!state.selected.length) return toast('The badge is on sample data. Find your place on step 1 to publish it.', 'error');
        state.saving = true;
        go(3);
        post('grw_badge_save', payload(state.global), res => {
            state.saving = false;
            if (res.status !== 'success') { go(2); return toast(errorOf(res) || 'Could not save.', 'error'); }
            state.feedId = res.result.id;
            const url = new URL(location.href);
            url.searchParams.delete('new');
            url.searchParams.set('grw_feed_id', state.feedId);
            url.searchParams.set('step', 3);
            history.replaceState(null, '', url);
            if (state.step === 3) { body.innerHTML = ''; renderPublish(); }
        });
    }

    /* ------------------------------------------------------------ step 1: search + presets */

    function renderStart() {
        const wrap = h('div', {class: 'grw-badge-section'});

        const card = h('div', {class: 'grw-badge-card-block'});
        const search = h('div', {class: 'grw-badge-search'});
        const add = h('button', {type: 'button', class: 'button grw-badge-tiles-add'}, 'Add existing place');
        const tiles = h('div', {class: 'grw-badge-tiles'});
        card.append(search, ...(V.places.length ? [add] : []), tiles);
        wrap.append(h('h2', null, 'Connect reviews'), card);

        const grid = h('div', {class: 'grw-badge-presets'});
        const head = h('div', {class: 'grw-badge-head-inline'});
        head.append(h('h2', null, 'Select layout'));
        wrap.append(head, grid);
        body.append(wrap);

        let presets = null;
        const drawGrid = () => loadData(() => {
            if (presets) presets.refresh();
            else { grid.innerHTML = ''; presets = renderPresets(grid, head); }
        }, grid);
        const drawTiles = () => {
            tiles.innerHTML = '';
            state.tiles.forEach(t => tiles.append(tile(t, () => { state.tiles = state.tiles.filter(x => x !== t); drawTiles(); drawGrid(); }, lang => relang(t, lang))));
            // The row keeps its height when empty, so the grid below never jumps.
            if (!state.tiles.length) tiles.append(h('div', {class: 'grw-badge-tile-empty'}, 'No place yet. Find your business above and it appears here with its rating.'));
        };
        add.onclick = () => picker(picked => { picked.forEach(p => addTile(Object.assign({connected: true}, p))); drawTiles(); drawGrid(); });
        drawTiles();
        drawGrid();

        const relang = (t, lang) => {
            t.lang = lang;
            t.connected = false;
            drawTiles();
            const done = (err, result) => {
                if (err) { t.connected = true; drawTiles(); return toast(err, 'error'); }
                addTile({id: t.id, name: result.name, photo: result.photo, rating: result.rating, total: result.user_ratings_total, address: t.address, lang, connected: true});
                if (result.credits > -1) state.credits = result.credits;
                drawTiles();
                drawGrid();
            };
            if (V.hasKey) connect({id: t.id, lang}, done);
            else frameConnect({id: t.id, lang, local_img: true}, done);
        };

        const onPick = place => {
            if (state.tiles.some(t => t.id === place.id && t.connected)) return;
            addTile(place);
            drawTiles();
            const done = (err, result) => {
                if (err) { state.tiles = state.tiles.filter(t => t.id !== place.id); drawTiles(); return toast(err, 'error'); }
                addTile({id: place.id, name: result.name, photo: result.photo, rating: result.rating, total: result.user_ratings_total, address: place.address, lang: place.lang, connected: true});
                if (result.credits > -1) state.credits = result.credits;
                toast('<b>' + esc(result.name || place.name) + '</b> connected.' + (state.credits > -1 ? '<br>' + state.credits + ' attempts remaining (without your API key).' : ''));
                drawTiles();
                drawGrid();
            };
            if (V.hasKey) connect({id: place.id, lang: place.lang}, done);
            else frameConnect({id: place.id, lang: place.lang, local_img: true}, done);
        };
        if (V.hasKey) localSearch(search, onPick);
        else frameSearch(search, onPick, () => { drawTiles(); drawGrid(); });
    }

    function tile(t, onRemove, onLang) {
        const stars = t.rating ? '<span class="rpi-stars" style="--rating:' + Number(t.rating) + '">' + Number(t.rating).toFixed(1) + '</span>' : '';
        const total = t.total ? '(' + Number(t.total).toLocaleString() + ')' : (t.connected ? '' : 'Connecting…');
        const langList = (rpi.Langs && rpi.Langs.google) || [];
        // Closed it reads as the code, open it lists full names: a code label with a transparent select laid over it.
        const langOpts = langList.map(l => '<option value="' + esc(l.v) + '"' + (l.v === t.lang ? ' selected' : '') + '>' + esc(l.t) + '</option>').join('');
        const langName = (langList.find(l => l.v === t.lang) || {}).t || '';
        const el = h('div', {class: 'grw-badge-tile' + (t.connected ? '' : ' grw-badge-tile-pending')},
            '<img class="grw-badge-tile-photo" alt="" width="32" height="32" src="' + esc(t.photo || V.blank) + '" onerror="this.src=\'' + esc(V.blank) + '\'">' +
            '<div class="grw-badge-tile-facts">' +
                '<div class="grw-badge-tile-line" title="' + esc(t.address) + '"><b>' + esc(t.name) + '</b>' +
                    (langOpts ? '<span class="grw-badge-tile-dot">·</span><span class="grw-badge-tile-lang" title="' + esc(langName ? 'Review language: ' + langName : 'Review language') + '">' +
                        '<span class="grw-badge-tile-lang-code">' + esc(String(t.lang || '').toUpperCase()) + '</span>' +
                        '<select' + (t.connected ? '' : ' disabled') + '>' + langOpts + '</select></span>' : '') +
                '</div>' +
                '<div class="grw-badge-tile-score">' + stars + '<span>' + esc(total) + '</span></div>' +
            '</div>' +
            '<button type="button" class="grw-badge-tile-x" aria-label="Remove ' + esc(t.name) + '"></button>');
        el.querySelector('.grw-badge-tile-x').onclick = onRemove;
        const sel = el.querySelector('.grw-badge-tile-lang select');
        if (sel) sel.onchange = () => onLang(sel.value);
        return el;
    }

    function picker(onAdd) {
        const places = V.places;
        const added = new Set(state.tiles.map(t => t.id));
        const modal = h('div', {class: 'grw-badge-modal'});
        const box = h('div', {class: 'grw-badge-modal-box', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Add existing place'});
        const head = h('div', {class: 'grw-badge-modal-head'}, '<h2>Add existing place</h2>');
        const x = h('button', {type: 'button', class: 'grw-badge-modal-x', 'aria-label': 'Close'}, '<span class="dashicons dashicons-no-alt"></span>');
        const search = h('div', {class: 'grw-badge-modal-body'});
        const input = h('input', {type: 'search', class: 'grw-badge-input', placeholder: 'Search by name or address', autocomplete: 'off'});
        const list = h('div', {class: 'grw-badge-modal-list'});
        const empty = h('div', {class: 'grw-badge-modal-empty', hidden: true}, 'No place matches.');
        const foot = h('div', {class: 'grw-badge-modal-foot'});
        const btn = h('button', {type: 'button', class: 'button button-primary', disabled: true}, 'Add place');
        const rows = places.map(p => h('label', {class: 'grw-badge-row grw-badge-pick'},
            '<input type="checkbox"' + (added.has(p.id) ? ' checked disabled' : '') + '>' +
            '<img class="grw-badge-tile-photo" alt="" width="32" height="32" src="' + esc(p.photo || V.blank) + '" onerror="this.src=\'' + esc(V.blank) + '\'">' +
            '<span><b>' + esc(p.name) + '</b><small>' + esc(p.address) + '</small></span>'));
        const picked = () => places.filter((p, i) => rows[i].firstElementChild.checked && !rows[i].firstElementChild.disabled);
        const close = () => { modal.remove(); document.body.classList.remove('grw-badge-modal-open'); };
        list.onchange = () => {
            const n = picked().length;
            btn.disabled = !n;
            btn.textContent = n > 1 ? 'Add ' + n + ' places' : 'Add place';
        };
        input.oninput = () => {
            const q = input.value.trim().toLowerCase();
            rows.forEach((r, i) => { r.hidden = !!q && (places[i].name + ' ' + places[i].address).toLowerCase().indexOf(q) < 0; });
            empty.hidden = rows.some(r => !r.hidden);
        };
        btn.onclick = () => { const add = picked(); close(); onAdd(add); };
        x.onclick = close;
        modal.onclick = e => { if (e.target === modal) close(); };
        modal.onkeydown = e => { if (e.key === 'Escape') close(); };
        head.append(x);
        search.append(input);
        list.append(...rows, empty);
        foot.append(btn);
        box.append(head, search, list, foot);
        modal.append(box);
        document.body.append(modal);
        document.body.classList.add('grw-badge-modal-open');
        input.focus();
    }

    function addTile(place) {
        const t = state.tiles.find(x => x.id === place.id);
        const next = {
            id: place.id,
            name: place.name || '',
            address: place.address || '',
            photo: place.photo || '',
            rating: place.rating ? Number(place.rating).toFixed(1) : '',
            total: place.total || place.count || place.user_ratings_total || 0,
            lang: place.lang || V.lang,
            connected: !!place.connected
        };
        if (t) Object.assign(t, next, {connected: t.connected || next.connected}); else state.tiles.push(next);
        state.data = null;
    }

    function connect(params, cb) {
        post('grw_connect_google', {id: params.id, url: params.url || '', lang: params.lang || '', local_img: 'true', token: params.token || '', feed_id: '', v: Date.now()}, res => {
            if (res.status === 'success') cb(null, res.result);
            else cb(errorOf(res) || 'Connection failed, please try again.');
        });
    }

    /* Without an API key the search runs on app.richplugins.com (reCAPTCHA lives there), framed
       inline. Messages: place (a suggestion was picked), connect (a signed connect request),
       resize (content height). The parent asks for a signature with {action:'connect', params}. */
    let frame = null, frameCb = null, frameTimer = null, frameOn = null;
    function frameSearch(host, onPick, redraw) {
        frame = h('iframe', {class: 'grw-badge-frame', src: CONNECT_URL + '?inline=1&authcode=' + encodeURIComponent(V.authcode) + '&lang=' + encodeURIComponent(V.lang), title: 'Find your business'});
        host.append(frame);
        frame.addEventListener('load', () => frame.focus());
        // Step 1 is rebuilt on every visit: one listener for the page, dispatching to the current handlers.
        frameOn = {pick: onPick, redraw};
        if (frameSearch.listening) return;
        frameSearch.listening = true;
        window.addEventListener('message', function onMsg(e) {
            if (e.origin !== CONNECT_ORIGIN || !e.data || !frame || !frame.isConnected || e.source !== frame.contentWindow) return;
            const d = e.data;
            if (d.action === 'resize' && d.height) frame.style.height = Math.min(600, Math.max(40, d.height)) + 'px';
            if (d.action === 'place' && d.place) frameOn.pick(d.place);
            if (d.action === 'connect') {
                // Either the answer to our signature request or, on the non-inline page, its own Connect button.
                const cb = frameCb;
                frameCb = null;
                clearTimeout(frameTimer);
                connect(d, (err, result) => {
                    // The reply may land after step 1 was left and the iframe is gone.
                    if (frame && frame.contentWindow) frame.contentWindow.postMessage({action: 'connect_done'}, '*');
                    if (cb) return cb(err, result);
                    if (err) return toast(err, 'error');
                    addTile({id: d.id, name: result.name, photo: result.photo, rating: result.rating, total: result.user_ratings_total, lang: d.lang, connected: true});
                    if (result.credits > -1) state.credits = result.credits;
                    toast('<b>' + esc(result.name) + '</b> connected.');
                    frameOn.redraw();
                });
            }
        });
    }
    function frameConnect(params, cb) {
        frameCb = cb;
        clearTimeout(frameTimer);
        frameTimer = setTimeout(() => { frameCb = null; cb('No response from the connection service, please try again later.'); }, 60000);
        frame.contentWindow.postMessage({action: 'connect', params}, '*');
    }

    function localSearch(host, onPick) {
        const input = h('input', {type: 'text', class: 'grw-badge-input', placeholder: 'Start typing your business name and address', autocomplete: 'off'});
        const list = h('div', {class: 'grw-badge-list', hidden: true});
        host.append(input, list);
        input.focus();
        let timer = 0, last = '';
        input.addEventListener('input', () => {
            clearTimeout(timer);
            const v = input.value.trim();
            list.hidden = true;
            if (v.length < 3) return;
            if (/^ChIJ\S+$/.test(v)) return pick(v);
            timer = setTimeout(() => {
                if (v === last) return;
                last = v;
                post('grw_place_autocomplete', {input: v}, res => {
                    list.innerHTML = '';
                    const preds = (res && res.predictions) || [];
                    if (!preds.length) return;
                    preds.slice(0, 8).forEach(p => {
                        const f = p.structured_formatting || {};
                        const row = h('a', {href: '#', class: 'grw-badge-row'}, '<b>' + esc(f.main_text || p.description) + '</b><small>' + esc(f.secondary_text || '') + '</small>');
                        row.onclick = ev => { ev.preventDefault(); pick(p.place_id, f.secondary_text || '', f.main_text || ''); };
                        list.append(row);
                    });
                    list.hidden = false;
                });
            }, 700);
        });
        function pick(pid, address, name) {
            list.hidden = true;
            input.value = '';
            post('grw_get_place', {pid, lang: V.lang}, res => {
                if (res.status !== 'success') return toast(errorOf(res) || 'Could not read the place.', 'error');
                const r = res.result;
                onPick({id: pid, name: r.name || name, photo: r.photo, rating: r.rating, total: r.user_ratings_total, address: address || r.address || '', lang: r.country && rpi.Langs ? rpi.Langs.langForCountry(r.country) || V.lang : V.lang});
            });
        }
    }

    /* ------------------------------------------------------------ data */

    const pids = () => state.tiles.filter(t => t.connected).map(t => t.id);

    function loadData(cb, host) {
        state.selected = pids();
        const sent = state.selected.join(',') + '|' + langs();
        if (state.data && state.dataPids === sent) return cb();
        const loading = h('p', {class: 'grw-badge-loading'}, 'Loading…');
        (host || body).append(loading);
        post('grw_badge_data', {pids: state.selected, langs: langs(), post_id: state.feedId || ''}, res => {
            loading.remove();
            // A reply for a set of places that is no longer the one on screen is dropped.
            if (sent !== pids().join(',') + '|' + langs()) return;
            if (res.status !== 'success') return toast(errorOf(res) || 'Could not load the preview.', 'error');
            state.data = res.result;
            state.dataPids = sent;
            cb();
        });
    }

    // Each host gets its own root id: badge.js keys its close state by it.
    let seq = 0;
    function draw(host, opts, fixed, click) {
        host.querySelectorAll('.rpi-badge').forEach(b => { if (b.rpiLiveStop) b.rpiLiveStop(); });
        host.innerHTML = '';
        const id = 'grwb' + (++seq);
        Object.keys(sessionStorage).filter(k => k.indexOf('rpi_badge_grwb') === 0).forEach(k => sessionStorage.removeItem(k));
        const r = h('div', {class: 'wp-gr rpi grw-badge-root' + (fixed ? '' : ' grw-badge-static'), 'data-id': id});
        if (opts.style_vars) r.style.cssText = opts.style_vars;
        host.append(r);
        rpi.Badge(r, Object.assign({}, DEFAULTS, opts, {badge_style: 'live', data: state.data, onclick: click || function() {}}));
        return r;
    }

    /* ------------------------------------------------------------ step 2: presets */

    function renderPresets(host, head) {
        const wrap = h('div', {class: 'grw-badge-design'});
        const note = h('p', {class: 'description'}, '<span class="dashicons dashicons-info-outline grw-badge-note-ico"></span><b>Sample data.</b> Find your place above to see the badges with your real rating and reviews.');
        const noteText = () => { note.hidden = !state.data.sample; };
        noteText();
        (head || wrap).append(note);
        const grid = h('div', {class: 'grw-badge-grid'});
        if (!document.getElementById('grw-badge-colors')) {
            document.body.append(h('datalist', {id: 'grw-badge-colors'}, ['#fbbc04', '#fb8e28', '#f4b400', '#ea4335', '#34a853', '#1a73e8', '#673ab7', '#e91e63', '#00acc1', '#202124', '#5f6368', '#ffffff'].map(c => '<option value="' + c + '"></option>').join('')));
        }
        wrap.append(grid);
        host.append(wrap);
        // Below the label's threshold (badge.js: 4.5 and 10 reviews) the card still previews it, only its button locks.
        const eligible = () => rpi.Badge.Live.topRated(rpi.Badge.Live.biz({data: state.data}), {badge_toprated: true});
        const cards = [];
        PRESETS.forEach(preset => {
            const card = h('div', {class: 'grw-badge-card'});
            const head = h('div', {class: 'grw-badge-card-head'}, '<span>' + esc(preset.name) + '</span>');
            const tools = h('div', {class: 'grw-badge-card-tools'});
            const dark = h('label', {class: 'grw-badge-switch', title: 'Dark tone'});
            const cb = h('input', {type: 'checkbox'});
            dark.append(cb, h('i'), document.createTextNode('Dark'));
            const color = h('input', {type: 'color', class: 'grw-badge-color', title: 'Star colour', value: '#fbbc04', list: 'grw-badge-colors'});
            const tone = () => cb.checked ? (preset.opts.badge_tone === 'glass' ? 'glass-dark' : 'dark') : (preset.opts.badge_tone || 'light');
            const starColor = () => color.value.toLowerCase() === '#fbbc04' ? '' : color.value;
            const opts = () => {
                const o = Object.assign({}, preset.opts, {badge_tone: tone()});
                if (starColor()) o.style_vars = (o.style_vars || '') + '--badge-star-color:' + starColor() + ';';
                return o;
            };
            const chosen = () => state.presetName === preset.name && !!state.options;
            const memo = state.cards[preset.name] || (state.cards[preset.name] = {dark: false, color: '#fbbc04'});
            if (chosen()) {
                memo.dark = /dark/.test(state.options.badge_tone || '');
                memo.color = styleVar('--badge-star-color') || '#fbbc04';
            }
            cb.checked = memo.dark;
            color.value = memo.color;
            const changed = () => {
                memo.dark = cb.checked;
                memo.color = color.value;
                if (chosen()) {
                    [state.options, state.preset].forEach(o => { o.badge_tone = tone(); setStyleVar('--badge-star-color', starColor(), o); });
                }
                show();
            };
            color.oninput = changed;
            const stage = h('div', {class: 'grw-badge-stage' + (preset.opts.badge_bar ? ' grw-badge-stage-bar' : '') + (preset.opts.badge_tone === 'glass' ? ' grw-badge-stage-glass' : '')});
            const show = () => draw(stage, Object.assign({preview_toprated: true}, opts()), false);
            cb.onchange = changed;
            const btn = h('button', {type: 'button', class: 'button button-primary'}, chosen() ? 'Selected' : 'Select');
            card.classList.toggle('grw-badge-card-sel', chosen());
            const lock = h('p', {class: 'grw-badge-card-lock', hidden: true}, '<span class="dashicons dashicons-info-outline grw-badge-note-ico"></span>' + TOP_RATED_NOTE);
            const gate = () => {
                const off = !!preset.opts.badge_toprated && !eligible();
                btn.disabled = off;
                btn.title = off ? TOP_RATED_NOTE : '';
                lock.hidden = !off;
            };
            gate();
            cards.push(() => { show(); gate(); });
            btn.onclick = () => {
                if (!chosen()) { state.options = Object.assign({}, DEFAULTS, opts()); state.preset = Object.assign({}, state.options); state.presetName = preset.name; }
                go(2);
            };
            tools.append(color, dark, btn);
            head.append(tools);
            card.append(head, stage, lock);
            grid.append(card);
            show();
        });
        return {refresh() { noteText(); cards.forEach(f => f()); }};
    }

    /* ------------------------------------------------------------ step 2: editor */

    let embedStage = null;
    function drawLive() {
        if (!embedStage) return;
        const embed = state.options.badge_pos === 'embed';
        embedStage.classList.toggle('grw-badge-stage-float', !embed);
        embedStage.classList.toggle('grw-badge-stage-edge', embed && !!state.options.badge_bar);
        embedStage.classList.toggle('grw-badge-stage-glass', /^glass/.test(state.options.badge_tone || ''));
        // The lightbox moves the popup out of the root on the first open, so it is captured once here.
        const popup = state.data.popup || '';
        let popupEl = null;
        const root = draw(embedStage, state.options, !embed, popup ? () => grw_popup_open(root, popupEl) : null);
        root.insertAdjacentHTML('beforeend', popup);
        popupEl = root.querySelector('.grw-popup');
    }

    function styleVar(name) {
        const m = new RegExp('(?:^|;)\\s*' + name + '\\s*:\\s*([^;]+)').exec(state.options.style_vars || '');
        return m ? m[1].trim() : '';
    }
    function setStyleVar(name, value, target) {
        target = target || state.options;
        const vars = (target.style_vars || '').split(';').map(s => s.trim()).filter(s => s && s.indexOf(name + ':') !== 0);
        if (value !== '') vars.push(name + ':' + value);
        target.style_vars = vars.length ? vars.join(';') + ';' : '';
    }

    function renderEditor() {
        const o = state.options;
        const wrap = h('div', {class: 'grw-badge-editor grw-badge-section'});

        const cols = h('div', {class: 'grw-badge-cols'});
        const main = h('div', {class: 'grw-badge-main-col'});
        const side = h('aside', {class: 'grw-pl-side'});
        cols.append(main, side);
        wrap.append(cols);

        const ICONS = {
            desktop: '<path fill-rule="evenodd" d="M3.5 6.25a2.75 2.75 0 0 1 2.75-2.75h7.5a2.75 2.75 0 0 1 2.75 2.75v4.5a2.75 2.75 0 0 1-2.75 2.75h-1.25v1.5h.75a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h.75v-1.5h-1.25a2.75 2.75 0 0 1-2.75-2.75v-4.5Zm5.5 7.25h2v1.5h-2v-1.5Zm-2.75-8.5c-.69 0-1.25.56-1.25 1.25v3.25h10v-3.25c0-.69-.56-1.25-1.25-1.25h-7.5Zm8.725 6c-.116.57-.62 1-1.225 1h-7.5a1.25 1.25 0 0 1-1.225-1h9.95Z"/>',
            tablet: '<path d="M8.5 13a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"/><path fill-rule="evenodd" d="M6.75 3a2.75 2.75 0 0 0-2.75 2.75v8.5a2.75 2.75 0 0 0 2.75 2.75h6.5a2.75 2.75 0 0 0 2.75-2.75v-8.5a2.75 2.75 0 0 0-2.75-2.75h-6.5Zm-1.25 2.75c0-.69.56-1.25 1.25-1.25h6.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z"/>',
            mobile: '<path d="M7.75 13.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z"/><path fill-rule="evenodd" d="M4.75 5.75a2.75 2.75 0 0 1 2.75-2.75h5a2.75 2.75 0 0 1 2.75 2.75v8.5a2.75 2.75 0 0 1-2.75 2.75h-5a2.75 2.75 0 0 1-2.75-2.75v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-.531a1 1 0 0 1-.969.75h-2a1 1 0 0 1-.969-.75h-.531Z"/>'
        };
        const devices = h('div', {class: 'grw-badge-devices', role: 'group', 'aria-label': 'Preview width'});
        Object.keys(ICONS).forEach(d => {
            const b = h('button', {type: 'button', class: d === state.device ? 'grw-on' : '', 'aria-label': d.charAt(0).toUpperCase() + d.slice(1) + ' preview'}, '<svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">' + ICONS[d] + '</svg>');
            b.onclick = () => { state.device = d; [...devices.children].forEach(x => x.classList.toggle('grw-on', x === b)); embedStage.dataset.device = d; drawLive(); };
            devices.append(b);
        });
        const stageHead = h('div', {class: 'grw-badge-stage-head'});
        stageHead.append(h('h2', null, 'Badge preview'), devices);
        cols.prepend(stageHead);
        embedStage = h('div', {class: 'grw-badge-stage grw-badge-embed-stage', 'data-device': state.device});
        main.append(embedStage);

        /* ---- Polaris-like controls ---- */
        const POS_PILL = [['right', '↘ Bottom right'], ['left', '↙ Bottom left'], ['top-right', '↗ Top right'], ['top-left', '↖ Top left'], ['embed', '▭ Embed']];
        const POS_BAR = [['top', '▔ Top'], ['bottom', '▁ Bottom'], ['embed', '▬ Embed']];
        const card = (title, open) => {
            const c = h('section', {class: 'grw-pl-card' + (open ? '' : ' grw-pl-closed')});
            const head = h('button', {type: 'button', class: 'grw-pl-head', 'aria-expanded': open ? 'true' : 'false'}, '<span>' + esc(title) + '</span><i></i>');
            const bodyEl = h('div', {class: 'grw-pl-body'});
            head.onclick = () => { const closed = c.classList.toggle('grw-pl-closed'); head.setAttribute('aria-expanded', closed ? 'false' : 'true'); };
            c.append(head, bodyEl);
            side.append(c);
            return bodyEl;
        };
        const row = (label, control, hint) => {
            const r = h('div', {class: 'grw-pl-row'});
            r.append(h('span', {class: 'grw-pl-label'}, esc(label)), control);
            const out = [r];
            if (hint) out.push(h('div', {class: 'grw-pl-hint'}, esc(hint)));
            return out;
        };
        const toggle = (key, label, opts) => {
            opts = opts || {};
            const l = h('label', {class: 'grw-pl-toggle'});
            const c = h('input', {type: 'checkbox'});
            c.checked = opts.get ? opts.get() : !!o[key];
            c.disabled = !!opts.disabled;
            c.onchange = () => { if (opts.set) opts.set(c.checked); else o[key] = c.checked; drawLive(); };
            l.append(c, h('i'), h('span', null, esc(label)));
            if (opts.title) l.title = opts.title;
            return l;
        };
        const select = (key, items, onchange) => {
            const s = h('select', {class: 'grw-pl-select'}, items.map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + '</option>').join(''));
            s.value = o[key] || '';
            s.onchange = () => { o[key] = s.value; (onchange || drawLive)(); };
            return s;
        };
        const seg = (key, items) => {
            const g = h('div', {class: 'grw-pl-seg'});
            items.forEach(([v, t]) => {
                const b = h('button', {type: 'button', class: (o[key] || '') === v ? 'grw-pl-on' : ''}, esc(t));
                b.onclick = () => { o[key] = v; [...g.children].forEach(x => x.classList.toggle('grw-pl-on', x === b)); drawLive(); };
                g.append(b);
            });
            return g;
        };
        const slider = (label, min, max, step, value, unit, onchange) => {
            const box = h('div', {class: 'grw-pl-opt'});
            const top = h('div', {class: 'grw-pl-row'});
            const out = h('span', {class: 'grw-pl-value'}, value + unit);
            top.append(h('span', {class: 'grw-pl-label'}, esc(label)), out);
            const r = h('input', {type: 'range', class: 'grw-pl-slider', min, max, step});
            r.value = value;
            const fill = () => r.style.setProperty('--fill', ((r.value - min) / (max - min) * 100) + '%');
            fill();
            r.oninput = () => { out.textContent = r.value + unit; fill(); onchange(r.value); };
            box.append(top, r);
            return box;
        };

        /* ---- 1. Position ---- */
        let b1 = card('Position', true);
        const posRows = h('div', {class: 'grw-pl-pos'});
        const posButtons = [];
        const posRow = (title, items, bar) => {
            const g = h('div', {class: 'grw-pl-seg grw-pl-seg-grid'});
            items.forEach(([v, t]) => {
                const b = h('button', {type: 'button'}, esc(t));
                b.onclick = () => { o.badge_pos = v; o.badge_bar = bar; posButtons.forEach(x => x.el.classList.toggle('grw-pl-on', x.bar === bar && x.v === v)); drawLive(); };
                posButtons.push({el: b, v, bar});
                g.append(b);
            });
            posRows.append(h('div', {class: 'grw-pl-sub'}, title), g);
        };
        posRow('Badge', POS_PILL, false);
        posRow('Bar', POS_BAR, true);
        // A bar in a corner is drawn at that edge, so its button lights up the edge it collapses to.
        const curBar = !!o.badge_bar, curPos = o.badge_pos || 'right';
        const curV = curBar && curPos !== 'embed' ? (/^top/.test(curPos) ? 'top' : 'bottom') : curPos;
        posButtons.forEach(x => x.el.classList.toggle('grw-pl-on', x.bar === curBar && x.v === curV));
        b1.append(posRows);
        b1.append(toggle('hide_float_badge', 'Hide on mobile'));

        /* ---- 2. Look ---- */
        let b2 = card('Look', true);
        b2.append(...row('Tone', seg('badge_tone', [['light', 'Light'], ['dark', 'Dark'], ['glass', 'Glass'], ['glass-dark', 'Glass dark']])));
        const color = h('input', {type: 'color', class: 'grw-badge-color', list: 'grw-badge-colors', title: 'Star colour'});
        color.value = styleVar('--badge-star-color') || '#fbbc04';
        color.oninput = () => { setStyleVar('--badge-star-color', color.value.toLowerCase() === '#fbbc04' ? '' : color.value); drawLive(); };
        b2.append(...row('Star colour', color));
        b2.append(slider('Corners', 0, 30, 1, parseInt(styleVar('--badge-radius'), 10) || 14, 'px', v => { setStyleVar('--badge-radius', v == 14 ? '' : v + 'px'); drawLive(); }));
        b2.append(slider('Opacity', 40, 100, 5, Math.round((parseFloat(styleVar('--badge-opacity')) || 1) * 100), '%', v => { setStyleVar('--badge-opacity', v == 100 ? '' : String(v / 100)); drawLive(); }));

        /* ---- 3. Size ---- */
        let b3 = card('Size', false);
        b3.append(slider('Text size', 11, 20, 0.5, o.badge_size || 13, 'px', v => { o.badge_size = v == 13 ? '' : v; drawLive(); }));
        const widthSlider = slider('Width', 200, 480, 5, o.badge_width && o.badge_width !== 'auto' ? o.badge_width : 320, 'px', v => { o.badge_width = v == 320 ? '' : v; drawLive(); });
        widthSlider.hidden = o.badge_width === 'auto';
        b3.append(toggle('badge_width', 'Fit the first line', {get: () => o.badge_width === 'auto', set: v => { o.badge_width = v ? 'auto' : ''; widthSlider.hidden = v; }}));
        b3.append(widthSlider);

        /* ---- 4. Content ---- */
        let b4 = card('Content', false);
        b4.append(toggle('badge_compact', 'Logo on the rating line'));
        b4.append(toggle('badge_onestar', 'One star instead of five'));
        b4.append(toggle('badge_order', 'Stars before the rating', {get: () => o.badge_order === 'stars', set: v => { o.badge_order = v ? 'stars' : ''; }}));
        b4.append(toggle('badge_dot', 'Count after a dot, not in brackets'));
        b4.append(toggle('badge_author_hide', 'Hide review authors'));
        const eligible = rpi.Badge.Live.topRated(rpi.Badge.Live.biz({data: state.data}), {badge_toprated: true});
        if (!eligible) o.badge_toprated = false;
        b4.append(toggle('badge_toprated', 'Top rated label', {disabled: !eligible, title: eligible ? '' : TOP_RATED_NOTE}));
        if (!eligible) b4.append(h('div', {class: 'grw-pl-hint'}, TOP_RATED_NOTE + '.'));
        b4.append(...row('Label icon', select('badge_icon', [['', 'None'], ['medal', 'Medal'], ['check', 'Check'], ['award', 'Award'], ['rosette', 'Rosette']])));

        /* ---- 5. Behaviour ---- */
        let b5 = card('Behaviour', false);
        b5.append(slider('Phrase change', 3, 15, 1, o.badge_interval || 6, 's', v => { o.badge_interval = v == 6 ? '' : v; drawLive(); }));
        b5.append(toggle('badge_close', 'Close button'));

        const next = h('button', {type: 'button', class: 'button button-primary button-hero grw-pl-next'}, 'Continue to publish');
        next.onclick = publish;
        const links = h('p', {class: 'grw-pl-links'}, '<a href="#" class="grw-badge-back">Another preset</a> · <a href="#" class="grw-badge-reset">Reset changes</a>');
        links.querySelector('.grw-badge-reset').onclick = e => { e.preventDefault(); state.options = Object.assign({}, state.preset || DEFAULTS); body.innerHTML = ''; renderEditor(); };
        // Only navigates: steps 2 and 3 stay reachable from the indicator with these options.
        links.querySelector('.grw-badge-back').onclick = e => { e.preventDefault(); go(1); };
        side.append(next, links);

        body.append(wrap);
        drawLive();
    }

    /* ------------------------------------------------------------ step 3: publish */

    function renderPublish() {
        const wrap = h('div', {class: 'grw-badge-publish grw-badge-section'});
        wrap.append(h('h2', null, 'Publish'));
        if (!state.feedId && !state.saving) {
            wrap.append(h('div', {class: 'notice notice-warning inline'}, '<p>The badge is on sample data. <a href="#" class="grw-badge-to1">Find your place</a> to publish it.</p>'));
            wrap.querySelector('.grw-badge-to1').onclick = e => { e.preventDefault(); go(1); };
            body.append(wrap);
            return;
        }

        const embed = (state.options || {}).badge_pos === 'embed';
        const row = h('div', {class: 'grw-badge-install grw-badge-card-block'});
        if (!embed) {
            const label = on => on ? 'Displayed on the site' : 'Display on the site';
            const btn = h('button', {type: 'button', class: 'button button-primary button-hero'}, label(state.global));
            btn.disabled = state.global || state.saving;
            const remove = h('a', {href: '#', class: 'grw-badge-uninstall'}, 'Remove from the site');
            remove.hidden = !state.global;
            const set = on => {
                btn.disabled = true;
                post('grw_badge_save', payload(on), res => {
                    btn.disabled = state.global;
                    if (res.status !== 'success') return toast(errorOf(res) || 'Could not save.', 'error');
                    state.global = on;
                    btn.textContent = label(on);
                    btn.disabled = on;
                    remove.hidden = !on;
                    if (on) toast('The badge is now displayed on the site.' + (res.result.replaced ? ' It replaced badge #' + res.result.replaced + '.' : ''), 'success', {label: 'View site', onClick: () => window.open(V.home)});
                    else toast('The badge is no longer displayed on the site.');
                });
            };
            btn.onclick = () => set(true);
            remove.onclick = e => { e.preventDefault(); set(false); };
            row.append(btn, remove);
        }
        const sc = state.feedId ? '[grw id=' + state.feedId + ']' : 'saving…';
        const text = h('p', {class: 'grw-badge-install-or'}, (embed ? 'Place the badge in the page content with the shortcode ' : 'Need it on one page only? Put it there with the shortcode ')
            + '<input type="text" class="grw-badge-sc" readonly value="' + esc(sc) + '"> or the Google Reviews block.');
        text.querySelector('.grw-badge-sc').onclick = function() { this.select(); document.execCommand('copy'); toast('Shortcode copied.'); };
        row.append(text);
        wrap.append(row);
        body.append(wrap);
    }

    go(state.step);
}

// badge.js (rpi.Badge) is loaded after this file in both bundles, so wait for the DOM.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', grw_badge_page);
else grw_badge_page();
