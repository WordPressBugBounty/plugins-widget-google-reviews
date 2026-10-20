// The three-step Create Widget page: places on step 1, an editor on step 2, the same editor in publish mode on step 3.
// The page brings its presets, its editor and its result column through cfg.
function grw_steps(root, cfg) {
    const V = JSON.parse(root.dataset.vars);
    const body = root.querySelector('.grw-badge-body');
    const steps = [...root.querySelectorAll('.grw-badge-steps li')];
    const CONNECT_URL = V.connect || 'https://app.richplugins.com/public/connect';
    const CONNECT_ORIGIN = new URL(CONNECT_URL).origin;
    // A field of cfg may be a function: in the gallery it depends on what was picked.
    const val = k => typeof cfg[k] === 'function' ? cfg[k]() : cfg[k];
    // On a touch screen a focused field keeps the keyboard open over the list or the presets.
    const touch = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
    // The plugin's option defaults (Core::get_default_options): what a control shows for a key the widget does not set.
    const D = V.defaults || {};
    const STAR = '#fbbc04';
    // The auto save is the user's working habit, kept in this browser.
    const pref = {get: () => { try { return localStorage.getItem('grw_autosave') === '1'; } catch (e) { return false; } },
                  set: v => { try { localStorage.setItem('grw_autosave', v ? '1' : '0'); } catch (e) {} }};

    const state = {
        step: V.feedId ? Math.min(3, Math.max(1, parseInt(new URLSearchParams(location.search).get('step'), 10) || 2)) : 1,
        // In the widget's own order: the first place is the one its header shows.
        tiles: V.selected.map(s => { const p = V.places.find(x => x.id === s.id); return p && Object.assign({connected: true}, p, {lang: s.lang}); }).filter(Boolean),
        selected: V.selected.filter(s => V.places.some(p => p.id === s.id)).map(s => s.id),
        options: V.feedId ? Object.assign({}, val('defaults'), V.options) : null,
        preset: V.feedId ? Object.assign({}, val('defaults'), V.options) : null,
        data: null,
        feedId: V.feedId,
        title: V.title,
        // The page holding the widget ({title, live, view, edit}), a published one first; every save answers it anew.
        page: V.page || null,
        done: V.feedId ? 3 : 1,
        presetName: null,
        cards: {},
        device: 'desktop',
        credits: -1,
        autosave: pref.get()
    };

    const toast = (msg, type, action) => GRW_TOAST.show({msg, type: type || 'success', action});
    const esc = grw_esc;
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
        // The failure handler sits beside cb, not after it: an error thrown inside cb must not call cb again as a failed request.
        fetch(ajaxurl, {method: 'POST', credentials: 'same-origin', body: fd})
            .then(r => r.json())
            .then(cb, () => cb({status: 'failed', result: {error_message: 'Request failed, please try again.'}}));
    };
    const errorOf = grw_get_error;
    // One button of a group pressed, the others released.
    const press = (group, on) => [...group.children].forEach(x => { x.classList.toggle('grw-pl-on', x === on); x.setAttribute('aria-pressed', String(x === on)); });
    // The note that the preview runs on sample data, with the link to step 1; tail says what the real data would show.
    const sampleNote = tail => h('p', {class: 'description'}, '<span class="dashicons dashicons-info-outline grw-badge-note-ico"></span><b>Sample data.</b> <a href="#" class="grw-badge-find">Find your place</a> ' + tail);

    const W = {V, D, STAR, state, h, esc, post, toast, errorOf, press, sampleNote, go, publish, loadData, pids, langs, controls, styleVar, setStyleVar, paint, preview, sync: () => {}};

    /* ------------------------------------------------------------ steps */

    // Counts the visits to steps: a reply asked for by an earlier visit draws nothing in a later one.
    let visit = 0;
    let redrawStart = () => {};
    let redrawTiles = () => {};
    let foldSearch = () => {};
    // Search suggestions lie over the page: a click, a focus or a wheel elsewhere folds them.
    ['pointerdown', 'focusin', 'wheel'].forEach(t => document.addEventListener(t, e => {
        if (!(e.target.closest && e.target.closest('.grw-badge-search'))) foldSearch();
    }, {passive: true}));
    // Google has no page for the sample place.
    document.addEventListener('click', e => {
        if (e.target.closest && e.target.closest('a[href*="placeid=sample"]')) e.preventDefault();
    });

    // The widget's id goes into every entry once it has one, so a reload or Back lands on this widget, not on a new one.
    const urlFor = step => {
        const url = new URL(location.href);
        url.searchParams.set('step', step);
        if (state.feedId) { url.searchParams.delete('new'); url.searchParams.set('grw_feed_id', state.feedId); }
        return url;
    };
    // Every step is a history entry, so Back and Forward move between steps; quiet: the entry is there already (Back itself, the first draw).
    let placed = false;
    // Steps 2 and 3 are one section, the editor, so the widget on its stage is never detached by walking the steps (a detached slider
    // loses its scroll position and its autoplay): step 3 is the editor's publish mode — the result column in place of the settings, the
    // title over the stage. On step 1 it stays parked out of sight. It is built anew only when it is back from step 1 with the widget,
    // its places or its options not as it left them (a design picked), or after the first save of a new widget (its id).
    const editorKey = () => [state.feedId, cfg.dataKey ? cfg.dataKey() : '', snapshot()].join('|');
    function editorMode(step) {
        const ed = state.editor;
        ed.wrap.classList.remove('grw-badge-parked');
        ed.cols.classList.toggle('grw-themes-result', step === 3);
        if (step === 2) {
            if (ed.result) { ed.result.remove(); ed.result = null; ed.main.after(ed.side); }
            ed.h2.textContent = val('previewTitle');
            // A save may have changed what the controls show (a badge saved "In the page" is off the site).
            W.sync();
        } else {
            // The ways to add it go before the stage, so the keyboard reaches them first; the grid still shows them on the right.
            const ready = state.feedId && !state.saving;
            const side = h('aside', {class: 'grw-pl-side'});
            if (ready) cfg.resultSide(side);
            (ed.result || ed.side).remove();
            ed.main.before(side);
            ed.result = side;
            ed.h2.textContent = ready ? 'Your ' + val('noun') + ' is ready' : 'Saving…';
        }
    }
    function showEditor(step) {
        if (state.editor && state.editor.key === editorKey()) return editorMode(step);
        state.editor = null;
        body.innerHTML = '';
        loadData(() => { renderEditor(); editorMode(step); });
    }
    // The editor built anew for the options as they are now (a design picked or reset on step 2): a change of the user's.
    W.rebuild = () => { state.editor = null; showEditor(2); commit(); };
    function go(step, quiet) {
        visit++;
        const from = state.step;
        if (step !== 1) state.toSearch = false;
        state.step = step;
        state.done = Math.max(state.done, step);
        history[quiet || !placed ? 'replaceState' : 'pushState']({step}, '', urlFor(step));
        placed = true;
        steps.forEach(li => {
            const n = +li.dataset.step, open = reached(n) && n !== step;
            li.classList.toggle('grw-badge-step-on', reached(n));
            li.classList.toggle('grw-badge-step-cur', n === step);
            if (n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
            if (open) { li.tabIndex = 0; li.setAttribute('role', 'button'); } else { li.removeAttribute('tabindex'); li.removeAttribute('role'); }
        });
        window.scrollTo(0, 0);
        const ed = state.editor;
        [...body.children].forEach(c => { if (c !== (ed && ed.wrap)) c.remove(); });
        if (step !== 1) return ed && from !== 1 ? editorMode(step) : showEditor(step);
        if (ed) { ed.key = editorKey(); ed.wrap.classList.add('grw-badge-parked'); }
        renderStart();
    }
    // While the first save is in flight the page already sits on step 3 without an id.
    const reached = step => step === 3 ? (!!state.feedId || state.step === 3) : step <= state.done;
    steps.forEach(li => {
        li.addEventListener('click', () => {
            const to = +li.dataset.step;
            if (!reached(to) || to === state.step) return;
            // The Publish step is for the widget as saved: with changes not saved yet the toast offers the save instead.
            if (to === 3 && state.feedId && !state.saving) {
                const why = blocked();
                if (why) return warn(why);
                if (unsaved()) return toast('The ' + val('noun') + ' is not saved yet.', 'error', {label: 'Save', onClick: () => saveChanges()});
            }
            go(to);
        });
        li.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
        });
    });
    window.addEventListener('popstate', e => {
        const to = e.state && e.state.step || parseInt(new URLSearchParams(location.search).get('step'), 10) || 1;
        if (to !== state.step && reached(to)) go(to, true);
        else history.replaceState({step: state.step}, '', urlFor(state.step));
    });

    // go(1) needs no focus call: step 1 focuses its search as it draws it.
    const find = () => {
        if (state.step !== 1) { state.toSearch = true; return go(1); }
        const search = body.querySelector('.grw-badge-search');
        search.scrollIntoView({block: 'center'});
        (search.querySelector('iframe, input') || search).focus();
    };
    body.addEventListener('click', e => {
        if (!e.target.closest('.grw-badge-find')) return;
        e.preventDefault();
        find();
    });

    // A tile is a (place, language) pair, '' being every language; langs() lists the languages beside pids, one per connected tile.
    function key(t) { return t.id + '|' + (t.lang || ''); }
    // Added by + and still without a language.
    const choosing = t => !t.connected && !t.lang;
    function langs() { return JSON.stringify(state.tiles.filter(t => t.connected).map(t => t.lang || '')); }
    const payload = extra => Object.assign({post_id: state.feedId || '', title: state.title || '', pids: pids(), langs: langs(), options: JSON.stringify(state.options || val('defaults'))}, extra || {});
    // What a save sends, without the id and title it gets back: state.saved holds it for the widget as last saved.
    const snapshot = () => JSON.stringify([pids(), langs(), state.options || val('defaults')]);
    W.savedOptions = () => state.saved ? JSON.parse(state.saved)[2] : null;

    // Why a publish cannot go now, or '' when it can. A place still connecting is left out of what a save would send.
    const blocked = () => {
        if (!state.selected.length) return 'The ' + val('noun') + ' is on sample data.';
        const t = state.tiles.find(x => !x.connected);
        if (!t) return '';
        return choosing(t) ? 'Choose a language for <b>' + esc(t.name) + '</b> or remove it, then publish.' : 'Wait until <b>' + esc(t.name) + '</b> is connected, then publish.';
    };

    // Why a save or a publish cannot go, as a toast; on sample data it offers the search of step 1.
    const warn = why => toast(why, 'error', state.selected.length ? undefined : {label: 'Find your place', onClick: find});

    /* Edit mode: changes are the user's until "Save changes", Ctrl+S or the auto save; the browser asks before the page is left with them. */
    const unsaved = () => !!state.feedId && state.saved !== undefined && snapshot() !== state.saved;
    const dirty = () => unsaved() && !state.saving;
    // After a change or a save the button follows the unsaved state.
    let foot = () => {};
    W.changed = () => foot();
    // The auto save follows a commit: a control's change event (a slider released, a colour picked, a field left), a click in the
    // editor or its popup, a design picked — at once, or after the save in flight. The input events of a drag only redraw.
    let pending = false;
    const commit = () => {
        foot();
        if (!state.autosave || !unsaved() || blocked()) return;
        if (state.saving) pending = true; else saveChanges(true);
    };
    W.commit = commit;
    // After every handler of the event: a kit's handler on the document (a hide button's) comes after this one.
    let queued = 0;
    const later = () => { if (!queued) queued = setTimeout(() => { queued = 0; commit(); }); };
    ['change', 'click'].forEach(ev => document.addEventListener(ev, e => { if (e.target.closest && e.target.closest('.grw-badge-editor, .rpi-lightbox-wrap, .grw-rv-menu')) later(); }));
    let leaving = false;
    window.addEventListener('beforeunload', e => { if (dirty() && !leaving) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', e => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey || String(e.key).toLowerCase() !== 's') return;
        e.preventDefault();
        // A field commits on change: what is typed in it goes with the save.
        const f = document.activeElement;
        if (f && root.contains(f) && (f.tagName === 'TEXTAREA' || f.tagName === 'INPUT' && /^(text|number)$/.test(f.type))) f.dispatchEvent(new Event('change'));
        if (!state.feedId) { if (state.step === 2) publish(); }
        else if (unsaved()) saveChanges();
        else toast('Nothing to save: the ' + val('noun') + ' is as saved.');
    });
    // quiet: the auto save, which says nothing on success unless the widget is still off the site.
    function saveChanges(quiet) {
        const why = blocked();
        if (why) return warn(why);
        if (state.saving) return;
        state.saving = true;
        foot();
        W.save(null, res => {
            state.saving = false;
            if (res.status !== 'success') return toast(errorOf(res) || 'Could not save.', 'error');
            if (state.step === 3) editorMode(3);
            // The answer may have changed what the controls show (a badge saved "In the page" is off the site).
            if (state.step === 2) W.sync();
            // A floating badge saved but not on the site: its switch is on the Publish step.
            const off = cfg.unpublished && cfg.unpublished();
            if (quiet === true && !off) return;
            toast(off ? 'Saved. Not on the site yet.' : 'Saved.', 'success', off && state.step !== 3 ? {label: 'Publish', onClick: () => go(3)} : undefined);
        });
    }

    function publish() {
        const why = blocked();
        if (why) return warn(why);
        // A second click before the first save answers would post without the id and make a second widget.
        if (state.saving) return go(3);
        state.saving = true;
        if (state.stage) state.stage.classList.add('grw-busy');
        const sent = snapshot();
        // Published again from step 3 (changes made while the first save ran): the step is drawn anew, not entered anew.
        const entered = state.step !== 3;
        if (entered) go(3); else editorMode(3);
        post(val('save'), payload(), res => {
            state.saving = false;
            if (state.stage) state.stage.classList.remove('grw-busy');
            // Back to step 2 through the history when this publish entered step 3, so its entry is not left behind.
            if (res.status !== 'success') {
                if (entered && state.step === 3) history.back(); else if (state.step !== 2) go(2);
                return toast(errorOf(res) || 'Could not save.', 'error');
            }
            const meanwhile = snapshot() !== sent || state.tiles.some(t => !t.connected);
            adopt(res);
            state.saved = meanwhile ? sent : snapshot();
            W.changed();
            // Changes made while it saved and published again meanwhile: they are saved now, or back on step 2 while a place connects.
            if (state.step === 3 && meanwhile) {
                const why = blocked();
                if (!why) return publish();
                go(2);
                return warn(why);
            }
            // The new widget's id goes into a new editor; the user may be back on step 2 meanwhile.
            if (state.step !== 1) showEditor(state.step);
        });
    }

    // The id goes into the URL, so a reload or a second save edits this one instead of creating another.
    function adopt(res) {
        state.feedId = res.result.id;
        if (res.result.title) state.title = res.result.title;
        if ('page' in res.result) state.page = res.result.page;
        // A badge save answers whether the badge is on the site: an embed badge never is.
        if ('global' in res.result) state.global = !!res.result.global;
        history.replaceState({step: state.step}, '', urlFor(state.step));
    }

    // A save from step 3 (the badge's site switch, extra = {global}) may come back as a new widget as well.
    W.save = (extra, cb) => {
        const sent = snapshot();
        post(val('save'), payload(extra), res => {
            const meanwhile = snapshot() !== sent;
            if (res.status === 'success' && res.result && res.result.id) adopt(res);
            cb(res);
            if (res.status === 'success') state.saved = meanwhile ? sent : snapshot();
            foot();
            // A commit while it saved goes now; after a failure the next commit tries again.
            if (pending) { pending = false; if (res.status === 'success') commit(); }
        });
    };

    /* ------------------------------------------------------------ step 1: search + presets */

    function renderStart() {
        // A widget with a design opens at the design; the search takes focus only when the visit is for it (a new widget, "Find your place").
        state.toSearch = state.toSearch || !(state.options && state.options.view_mode);
        const wrap = h('div', {class: 'grw-badge-section'});

        const card = h('div', {class: 'grw-badge-card-block grw-badge-connect'});
        const search = h('div', {class: 'grw-badge-search'});
        const addLabel = () => 'Use a connected business (' + V.places.length + ')';
        const add = h('button', {type: 'button', class: 'button grw-badge-tiles-add'}, addLabel());
        const tiles = h('div', {class: 'grw-badge-tiles'});
        card.append(search, ...(V.places.length ? [add] : []), tiles);
        const rememberPlace = p => {
            if (V.places.some(x => x.id === p.id)) return;
            V.places.push(p);
            add.textContent = addLabel();
            if (!add.isConnected) search.after(add);
        };
        wrap.append(h('h2', null, 'Connect Google'), card);

        const grid = h('div', {class: 'grw-badge-presets'});
        const head = h('div', {class: 'grw-badge-head-inline'});
        head.append(h('h2', null, cfg.pick));
        wrap.append(head, grid);
        body.append(wrap);

        let presets = null;
        const drawGrid = () => loadData(() => {
            if (presets) presets.refresh();
            else { grid.innerHTML = ''; presets = cfg.presets(grid, head, W); }
        }, grid);
        const drawTiles = () => {
            tiles.innerHTML = '';
            state.tiles.forEach(t => tiles.append(tile(t, () => { state.tiles = state.tiles.filter(x => x !== t); drawTiles(); drawGrid(); }, lang => relang(t, lang), () => addLang(t))));
        };
        add.onclick = () => picker(picked => { picked.forEach(p => addTile(Object.assign({connected: true}, p))); drawTiles(); drawGrid(); });
        drawTiles();
        drawGrid();
        redrawStart = () => { drawTiles(); drawGrid(); };
        redrawTiles = drawTiles;

        // The place once more with its language still to choose, right after its source so the header's place stays first.
        const addLang = t => {
            if (state.tiles.some(x => x.id === t.id && choosing(x))) return;
            state.tiles.splice(state.tiles.indexOf(t) + 1, 0, {id: t.id, name: t.name, address: t.address, photo: t.photo, lang: '', connected: false});
            drawTiles();
            tiles.children[state.tiles.indexOf(t) + 1].querySelector('select').focus();
        };

        const relang = (t, lang) => {
            if (state.tiles.some(x => x !== t && !choosing(x) && key(x) === t.id + '|' + lang)) { drawTiles(); return toast('<b>' + esc(t.name) + '</b> is already here in this language.', 'error'); }
            // Every language is what the place has already: nothing to fetch.
            if (lang === '') { t.lang = ''; t.connected = true; redrawStart(); return; }
            const was = t.lang, wasOn = t.connected;
            t.lang = lang;
            t.connected = false;
            drawTiles();
            const done = (err, result) => {
                // A place removed meanwhile stays removed.
                if (!state.tiles.includes(t)) return;
                if (err) { t.lang = was; t.connected = wasOn; redrawStart(); return toast(err, 'error'); }
                addTile({id: t.id, name: result.name, photo: result.photo, rating: result.rating, total: result.user_ratings_total, address: t.address, lang, connected: true});
                if (result.credits > -1) state.credits = result.credits;
                redrawStart();
            };
            if (V.hasKey) connect({id: t.id, lang}, done);
            else frameConnect({id: t.id, lang, local_img: true}, done);
        };

        // A pick answered after step 1 was drawn again belongs on the step as it is now.
        const onPick = place => {
            const k = place.id + '|' + (place.lang || V.lang);
            if (state.tiles.some(t => key(t) === k)) return;
            addTile(place);
            redrawTiles();
            const done = (err, result) => {
                if (!err) rememberPlace({id: place.id, name: result.name || place.name, address: place.address || '', photo: result.photo || '', rating: result.rating ? Number(result.rating).toFixed(1) : '', total: result.user_ratings_total || 0, lang: place.lang});
                // A place removed while it connected stays removed.
                if (!state.tiles.some(t => key(t) === k)) return;
                if (err) { state.tiles = state.tiles.filter(t => key(t) !== k); redrawStart(); return toast(err, 'error'); }
                addTile({id: place.id, name: result.name, photo: result.photo, rating: result.rating, total: result.user_ratings_total, address: place.address, lang: place.lang, connected: true});
                if (result.credits > -1) state.credits = result.credits;
                toast('<b>' + esc(result.name || place.name) + '</b> connected.' + (state.credits > -1 ? '<br>' + state.credits + ' attempts remaining (without your API key).' : ''));
                redrawStart();
            };
            if (V.hasKey) connect({id: place.id, lang: place.lang}, done);
            else frameConnect({id: place.id, lang: place.lang, local_img: true}, done);
        };
        if (V.hasKey) localSearch(search, onPick, state.toSearch);
        else frameSearch(search, onPick, () => { drawTiles(); drawGrid(); }, state.toSearch);
    }

    // A pending tile without a language waits for the choice; one with a language is connecting.
    function tile(t, onRemove, onLang, onAdd) {
        const stars = t.rating ? '<span class="rpi-stars" style="--rating:' + Number(t.rating) + '">' + Number(t.rating).toFixed(1) + '</span>' : '';
        const total = t.total ? '(' + Number(t.total).toLocaleString() + ')' : (t.connected || !t.lang ? '' : 'Connecting…');
        const langList = (rpi.Langs && rpi.Langs.google) || [];
        // Closed it reads as the code, open it lists full names: a code label with a transparent select laid over it.
        const langOpts = (choosing(t) ? '<option value="" disabled selected>Language…</option>' : '<option value=""' + (t.lang ? '' : ' selected') + '>All languages</option>') +
            langList.map(l => '<option value="' + esc(l.v) + '"' + (l.v === t.lang ? ' selected' : '') + '>' + esc(l.t) + '</option>').join('');
        const langName = t.lang ? (langList.find(l => l.v === t.lang) || {}).t || '' : (choosing(t) ? '' : 'All languages');
        // Google still calls Hebrew "iw".
        const langCode = t.lang === 'iw' ? 'he' : String(t.lang || '');
        const el = h('div', {class: 'grw-badge-tile' + (t.connected ? '' : ' grw-badge-tile-pending')},
            '<img class="grw-badge-tile-photo" alt="" width="32" height="32" src="' + esc(t.photo || V.blank) + '" onerror="this.src=\'' + esc(V.blank) + '\'">' +
            '<div class="grw-badge-tile-facts">' +
                '<div class="grw-badge-tile-line" title="' + esc(t.address) + '"><b>' + esc(t.name) + '</b>' +
                    (langList.length ? '<span class="grw-badge-tile-dot">·</span><span class="grw-badge-tile-lang" title="' + esc(langName ? 'Review language: ' + langName : 'Review language') + '">' +
                        '<span class="grw-badge-tile-lang-code">' + esc(t.lang ? langCode.toUpperCase() : (choosing(t) ? 'Language…' : 'All')) + '</span>' +
                        '<select aria-label="Review language"' + (t.connected || !t.lang ? '' : ' disabled') + '>' + langOpts + '</select></span>' +
                        (t.connected ? '<button type="button" class="grw-badge-tile-add" title="Add this place in another language" aria-label="Add this place in another language">+</button>' : '') : '') +
                '</div>' +
                '<div class="grw-badge-tile-score">' + stars + '<span>' + esc(total) + '</span></div>' +
            '</div>' +
            '<button type="button" class="grw-badge-tile-x" aria-label="Remove ' + esc(t.name) + '"></button>');
        el.querySelector('.grw-badge-tile-x').onclick = onRemove;
        const sel = el.querySelector('.grw-badge-tile-lang select');
        if (sel) sel.onchange = () => onLang(sel.value);
        const add = el.querySelector('.grw-badge-tile-add');
        if (add) add.onclick = onAdd;
        return el;
    }

    function picker(onAdd) {
        const places = V.places;
        const added = new Set(state.tiles.map(key));
        const modal = h('div', {class: 'grw-badge-modal'});
        const box = h('div', {class: 'grw-badge-modal-box', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Use a connected business'});
        const head = h('div', {class: 'grw-badge-modal-head'}, '<h2>Use a connected business</h2>');
        const x = h('button', {type: 'button', class: 'grw-badge-modal-x', 'aria-label': 'Close'}, '<span class="dashicons dashicons-no-alt"></span>');
        const search = h('div', {class: 'grw-badge-modal-body'});
        const input = h('input', {type: 'search', class: 'grw-badge-input', placeholder: 'Search by name or address', autocomplete: 'off'});
        const list = h('div', {class: 'grw-badge-modal-list'});
        const empty = h('div', {class: 'grw-badge-modal-empty', hidden: true}, 'No place matches.');
        const foot = h('div', {class: 'grw-badge-modal-foot'});
        const btn = h('button', {type: 'button', class: 'button button-primary', disabled: true}, 'Use this business');
        const rows = places.map(p => h('label', {class: 'grw-badge-row grw-badge-pick'},
            '<input type="checkbox"' + (added.has(key(p)) ? ' checked disabled' : '') + '>' +
            '<img class="grw-badge-tile-photo" alt="" width="32" height="32" src="' + esc(p.photo || V.blank) + '" onerror="this.src=\'' + esc(V.blank) + '\'">' +
            '<span><b>' + esc(p.name) + '</b><small>' + esc(p.address) + '</small></span>'));
        const picked = () => places.filter((p, i) => rows[i].firstElementChild.checked && !rows[i].firstElementChild.disabled);
        const close = () => { modal.remove(); document.body.classList.remove('grw-badge-modal-open'); };
        list.onchange = () => {
            const n = picked().length;
            btn.disabled = !n;
            btn.textContent = n > 1 ? 'Use ' + n + ' businesses' : 'Use this business';
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
        if (touch()) { box.tabIndex = -1; box.focus(); } else input.focus();
    }

    function addTile(place) {
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
        const t = state.tiles.find(x => key(x) === key(next));
        if (t) Object.assign(t, next, {connected: t.connected || next.connected}); else state.tiles.push(next);
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
    let frame = null, frameCb = null, frameTimer = null, frameOn = null, listening = false;
    function frameSearch(host, onPick, redraw, focus) {
        // The frame being replaced can no longer sign what it was asked to.
        if (frameCb) {
            const cb = frameCb;
            frameCb = null;
            clearTimeout(frameTimer);
            cb('The connection was interrupted, please pick the place again.');
        }
        const f = frame = h('iframe', {class: 'grw-badge-frame', src: CONNECT_URL + '?inline=1&authcode=' + encodeURIComponent(V.authcode) + '&lang=' + encodeURIComponent(V.lang), title: 'Find your business'});
        host.append(frame);
        // The field alone: the frame keeps its list open inside, its 68px box would show the top of it; the next keystroke resizes the frame again.
        foldSearch = () => { if (frame.offsetHeight > host.offsetHeight) frame.style.height = '40px'; };
        if (focus) frame.addEventListener('load', () => frame.focus());
        // Its page posts its height as soon as it runs; a blocked frame stays silent, while its load event fires on the error page too.
        const silent = setTimeout(() => {
            if (f.isConnected) searchNote(host, 'The business search did not load. Allow app.richplugins.com in your blocker and reload the page.');
        }, 10000);
        // Step 1 is rebuilt on every visit: one listener for the page, dispatching to the current handlers.
        frameOn = {pick: onPick, redraw, heard: () => { clearTimeout(silent); searchNote(host, ''); }};
        if (listening) return;
        listening = true;
        window.addEventListener('message', function onMsg(e) {
            if (e.origin !== CONNECT_ORIGIN || !e.data || !frame || !frame.isConnected || e.source !== frame.contentWindow) return;
            frameOn.heard();
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
    // What keeps the search from working, on a line under it until it works.
    function searchNote(host, text) {
        const card = host.parentNode, old = card.querySelector('.grw-badge-search-note');
        if (old) old.remove();
        if (text) card.querySelector('.grw-badge-tiles').before(h('div', {class: 'notice notice-error inline grw-badge-search-note', role: 'alert'}, '<p>' + esc(text) + '</p>'));
    }

    function frameConnect(params, cb) {
        frameCb = cb;
        clearTimeout(frameTimer);
        frameTimer = setTimeout(() => { frameCb = null; cb('No response from the connection service, please try again later.'); }, 60000);
        frame.contentWindow.postMessage({action: 'connect', params}, '*');
    }

    function localSearch(host, onPick, focus) {
        const input = h('input', {type: 'text', class: 'grw-badge-input', placeholder: 'Start typing your business name and address', autocomplete: 'off'});
        const list = h('div', {class: 'grw-badge-list', hidden: true});
        host.append(input, list);
        foldSearch = () => { list.hidden = true; };
        input.addEventListener('keydown', e => { if (e.key === 'Escape') list.hidden = true; });
        if (focus && !touch()) input.focus();
        let timer = 0, last = '';
        input.addEventListener('input', () => {
            clearTimeout(timer);
            const v = input.value.trim();
            list.hidden = true;
            if (v.length < 3) return;
            if (/^ChIJ\S+$/.test(v)) return pick(v);
            timer = setTimeout(() => {
                if (v === last) { list.hidden = !list.children.length; return; }
                last = v;
                post('grw_place_autocomplete', {input: v}, res => {
                    list.innerHTML = '';
                    searchNote(host, res && (res.error_message || errorOf(res)));
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
            last = '';
            if (touch()) input.blur();
            post('grw_get_place', {pid, lang: V.lang}, res => {
                if (res.status !== 'success') return toast(errorOf(res) || 'Could not read the place.', 'error');
                const r = res.result;
                onPick({id: pid, name: r.name || name, photo: r.photo, rating: r.rating, total: r.user_ratings_total, address: address || r.address || '', lang: r.country && rpi.Langs ? rpi.Langs.langForCountry(r.country) || V.lang : V.lang});
            });
        }
    }

    /* ------------------------------------------------------------ data */

    function pids() { return state.tiles.filter(t => t.connected).map(t => t.id); }

    // cfg.dataKey adds what else the page's data depends on (the gallery: anonymized photos).
    function loadData(cb, host) {
        state.selected = pids();
        const asked = () => pids().join(',') + '|' + langs() + (cfg.dataKey ? '|' + cfg.dataKey() : '');
        const sent = asked();
        if (state.data && state.dataPids === sent) return cb();
        const loading = h('p', {class: 'grw-badge-loading'}, 'Loading…');
        (host || body).append(loading);
        const at = visit;
        post(cfg.data, Object.assign({pids: pids(), langs: langs(), post_id: state.feedId || ''}, cfg.dataFields ? cfg.dataFields() : {}), res => {
            loading.remove();
            // A reply for a set of places that is no longer the one on screen is dropped; the same visit asks again for the new set.
            if (sent !== asked()) { if (visit === at) loadData(cb, host); return; }
            if (res.status !== 'success') return toast(errorOf(res) || 'Could not load the preview.', 'error');
            state.data = res.result;
            state.dataPids = sent;
            // After a move to another step the data is kept, but the visit it was asked for is not drawn over the new one.
            if (visit === at) cb();
        });
    }

    // The widget drawn by the plugin from the options, 250 ms after the last change; cb gets its HTML and the reviews hidden in it;
    // extra adds fields to the request. A reply to an older request, or for a stage that is gone, is dropped. The stage is busy meanwhile.
    let previewSeq = 0, previewTimer = 0;
    function preview(stage, options, cb, extra) {
        W.changed();
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            const mine = ++previewSeq;
            stage.classList.add('grw-busy');
            post('grw_theme_preview', Object.assign({pids: pids(), langs: langs(), post_id: state.feedId || '', options: JSON.stringify(options)}, extra), res => {
                if (mine !== previewSeq) return;
                if (!stage.isConnected) return stage.classList.remove('grw-busy');
                if (res.status !== 'success') { stage.classList.remove('grw-busy'); return toast(errorOf(res) || 'Could not load the preview.', 'error'); }
                // The new picture comes in under the dim and fades up from it on the next frame.
                cb(res.result.html, res.result.hidden || []);
                requestAnimationFrame(() => stage.classList.remove('grw-busy'));
            });
        }, 250);
    }

    function styleVar(name, target) {
        const m = new RegExp('(?:^|;)\\s*' + name + '\\s*:\\s*([^;]+)').exec((target || state.options).style_vars || '');
        return m ? m[1].trim() : '';
    }
    function setStyleVar(name, value, target) {
        target = target || state.options;
        const vars = (target.style_vars || '').split(';').map(s => s.trim()).filter(s => s && s.indexOf(name + ':') !== 0);
        if (value !== '') vars.push(name + ':' + value);
        target.style_vars = vars.length ? vars.join(';') + ';' : '';
    }
    // Variables over the drawn widget, with no new render: style_vars text or {name: value}, an empty value removes the variable.
    // A declaration PHP rendered as !important (the CSS variables field) stays.
    function paint(host, vars) {
        const r = host.querySelector('.wp-gr');
        if (!r) return;
        const v = typeof vars === 'string' ? GRW_MODEL.pairs(vars) : vars;
        Object.keys(v).forEach(n => { if (!r.style.getPropertyPriority(n)) v[n] ? r.style.setProperty(n, v[n]) : r.style.removeProperty(n); });
    }

    /* ------------------------------------------------------------ step 2: editor */

    // Polaris-like controls over the object o; a control that writes o calls redraw(key) after it.
    function controls(side, o, redraw) {
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
            if (control.classList.contains('grw-pl-seg')) { control.setAttribute('role', 'group'); control.setAttribute('aria-label', label); }
            else if (/^(SELECT|INPUT|TEXTAREA)$/.test(control.tagName) && !control.getAttribute('aria-label')) control.setAttribute('aria-label', label);
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
            c.onchange = () => { if (opts.set) opts.set(c.checked); else o[key] = c.checked; (opts.change || redraw)(key); };
            l.append(c, h('i'), h('span', null, esc(label)));
            if (opts.title) l.title = opts.title;
            return l;
        };
        // opts: {get, set, change} or the change function alone. An item [label, items] is a group.
        const select = (key, items, opts) => {
            opts = typeof opts === 'function' ? {change: opts} : opts || {};
            const opt = ([v, t]) => Array.isArray(t) ? '<optgroup label="' + esc(v) + '">' + t.map(opt).join('') + '</optgroup>' : '<option value="' + esc(v) + '">' + esc(t) + '</option>';
            const s = h('select', {class: 'grw-pl-select'}, items.map(opt).join(''));
            s.value = opts.get ? opts.get() : o[key] || '';
            s.onchange = () => { if (opts.set) opts.set(s.value); else if (key) o[key] = s.value; (opts.change || redraw)(key); };
            return s;
        };
        const seg = (key, items, onchange) => {
            const g = h('div', {class: 'grw-pl-seg'});
            items.forEach(([v, t]) => {
                const b = h('button', {type: 'button', class: (o[key] || '') === v ? 'grw-pl-on' : '', 'aria-pressed': String((o[key] || '') === v)}, esc(t));
                b.onclick = () => { o[key] = v; press(g, b); (onchange || redraw)(key); };
                g.append(b);
            });
            return g;
        };
        const slider = (label, min, max, step, value, unit, onchange) => {
            const box = h('div', {class: 'grw-pl-opt'});
            const top = h('div', {class: 'grw-pl-row'});
            const out = h('span', {class: 'grw-pl-value'}, value + unit);
            top.append(h('span', {class: 'grw-pl-label'}, esc(label)), out);
            const r = h('input', {type: 'range', class: 'grw-pl-slider', min, max, step, 'aria-label': label});
            r.value = value;
            const fill = () => r.style.setProperty('--fill', ((r.value - min) / (max - min) * 100) + '%');
            fill();
            r.oninput = () => { out.textContent = r.value + unit; fill(); onchange(r.value); };
            box.set = v => { r.value = v; out.textContent = r.value + unit; fill(); };
            box.append(top, r);
            return box;
        };
        const color = (value, title, onchange) => {
            colors();
            const c = h('input', {type: 'color', class: 'grw-badge-color', list: 'grw-badge-colors', title});
            c.value = value;
            c.oninput = () => onchange(c.value);
            return c;
        };
        // A field written on change (Enter or leaving it): type text or number, or textarea.
        const field = (key, opts) => {
            opts = opts || {};
            const f = opts.type === 'textarea' ? h('textarea', {class: 'grw-pl-textarea', rows: opts.rows || 4}) : h('input', {type: opts.type || 'text', class: 'grw-pl-input', min: opts.min, max: opts.max, step: opts.step});
            if (opts.placeholder) f.placeholder = opts.placeholder;
            f.value = opts.get ? opts.get() : o[key] == null ? '' : o[key];
            f.onchange = () => { if (opts.set) opts.set(f.value); else o[key] = f.value; redraw(key); };
            return f;
        };

        // A settings column from a table of sections {title, open, if, ui, rows} and rows {type, key, label, hint, if, get, set, change, disabled, title, items, min, max, step, unit, hex, render}; returns sync(), which hides what does not apply and re-reads every control.
        const make = r => {
            const g = () => r.get ? r.get() : o[r.key];
            let els, read;
            if (r.type === 'toggle') {
                const t = toggle(r.key, r.label, {get: r.get, set: r.set, change: r.change, disabled: typeof r.disabled === 'function' ? r.disabled() : r.disabled, title: r.title});
                const c = t.querySelector('input');
                els = r.hint ? [t, h('div', {class: 'grw-pl-hint'}, esc(r.hint))] : [t];
                read = () => { c.checked = r.get ? r.get() : !!o[r.key]; if (typeof r.disabled === 'function') c.disabled = r.disabled(); };
            } else if (r.type === 'select') {
                const s = select(r.key, r.items, r);
                els = row(r.label, s, r.hint);
                // hidden() names the values not offered now; locked() the values greyed out, each with its reason.
                read = () => {
                    if (r.hidden) { const hid = r.hidden(); [...s.options].forEach(op => { op.hidden = hid.indexOf(op.value) >= 0; }); }
                    if (r.locked) { const lock = r.locked(); [...s.options].forEach(op => { op.disabled = !!lock[op.value]; op.title = lock[op.value] || ''; }); }
                    s.value = r.get ? r.get() : o[r.key] || '';
                };
            } else if (r.type === 'seg') {
                const s = seg(r.key, r.items, r.change);
                els = row(r.label, s, r.hint);
                read = () => press(s, [...s.children][r.items.findIndex(([v]) => v === (r.get ? r.get() : o[r.key] || ''))]);
            } else if (r.type === 'slider') {
                const s = slider(r.label, r.min, r.max, r.step, g(), r.unit, r.set);
                els = [s];
                read = () => s.set(g());
            } else if (r.type === 'color') {
                const hex = r.hex ? h('code', {class: 'grw-themes-hex'}, esc(g())) : null;
                const c = color(g(), r.label, v => { r.set(v); if (hex) hex.textContent = v; });
                let control = c;
                if (hex) { control = h('span', {class: 'grw-themes-pick'}); control.append(hex, c); c.setAttribute('aria-label', r.label); }
                els = row(r.label, control, r.hint);
                read = () => { c.value = g(); if (hex) hex.textContent = g(); };
            } else if (r.type === 'custom') {
                els = [].concat(r.render());
                read = r.read;
            } else {
                const f = field(r.key, r);
                if (r.type === 'textarea') {
                    const box = h('div', {class: 'grw-pl-opt'});
                    box.append(h('span', {class: 'grw-pl-label'}, esc(r.label)), f);
                    f.setAttribute('aria-label', r.label);
                    els = r.hint ? [box, h('div', {class: 'grw-pl-hint'}, esc(r.hint))] : [box];
                } else els = row(r.label, f, r.hint);
                // A field commits on change: what is being typed is not replaced by the model.
                read = () => { if (document.activeElement !== f) f.value = r.get ? r.get() : o[r.key] == null ? '' : o[r.key]; };
            }
            return {els, read};
        };
        const table = spec => {
            const parts = [];
            spec.filter(Boolean).forEach(sec => {
                const ui = sec.ui || kit, bodyEl = ui.card(sec.title, sec.open);
                sec.rows.filter(Boolean).forEach(r => {
                    const made = (r.ui || ui).make(r);
                    bodyEl.append(...made.els);
                    parts.push({if: r.if, els: made.els, read: made.read});
                });
                parts.push({if: sec.if, els: [bodyEl.parentNode]});
            });
            const sync = () => parts.forEach(p => {
                if (p.if) { const on = p.if(); p.els.forEach(el => { el.hidden = !on; }); }
                if (p.read) p.read();
            });
            sync();
            return sync;
        };
        const kit = {card, row, toggle, select, seg, slider, color, field, make, table};
        return kit;
    }

    function colors() {
        if (document.getElementById('grw-badge-colors')) return;
        document.body.append(h('datalist', {id: 'grw-badge-colors'}, [STAR, '#fb8e28', '#f4b400', '#ea4335', '#34a853', '#1a73e8', '#673ab7', '#e91e63', '#00acc1', '#202124', '#5f6368', '#ffffff'].map(c => '<option value="' + c + '"></option>').join('')));
    }
    W.colors = colors;

    const ICONS = {
        desktop: '<path fill-rule="evenodd" d="M3.5 6.25a2.75 2.75 0 0 1 2.75-2.75h7.5a2.75 2.75 0 0 1 2.75 2.75v4.5a2.75 2.75 0 0 1-2.75 2.75h-1.25v1.5h.75a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h.75v-1.5h-1.25a2.75 2.75 0 0 1-2.75-2.75v-4.5Zm5.5 7.25h2v1.5h-2v-1.5Zm-2.75-8.5c-.69 0-1.25.56-1.25 1.25v3.25h10v-3.25c0-.69-.56-1.25-1.25-1.25h-7.5Zm8.725 6c-.116.57-.62 1-1.225 1h-7.5a1.25 1.25 0 0 1-1.225-1h9.95Z"/>',
        tablet: '<path d="M8.5 13a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"/><path fill-rule="evenodd" d="M6.75 3a2.75 2.75 0 0 0-2.75 2.75v8.5a2.75 2.75 0 0 0 2.75 2.75h6.5a2.75 2.75 0 0 0 2.75-2.75v-8.5a2.75 2.75 0 0 0-2.75-2.75h-6.5Zm-1.25 2.75c0-.69.56-1.25 1.25-1.25h6.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z"/>',
        mobile: '<path d="M7.75 13.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z"/><path fill-rule="evenodd" d="M4.75 5.75a2.75 2.75 0 0 1 2.75-2.75h5a2.75 2.75 0 0 1 2.75 2.75v8.5a2.75 2.75 0 0 1-2.75 2.75h-5a2.75 2.75 0 0 1-2.75-2.75v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-.531a1 1 0 0 1-.969.75h-2a1 1 0 0 1-.969-.75h-.531Z"/>'
    };

    // cfg.editor(ctx) fills the settings column and returns the function that draws the preview into ctx.stage.
    function renderEditor() {
        const wrap = h('div', {class: 'grw-badge-editor grw-badge-section'});
        const cols = h('div', {class: 'grw-badge-cols'});
        const main = h('div', {class: 'grw-badge-main-col'});
        const side = h('aside', {class: 'grw-pl-side'});
        cols.append(main, side);
        wrap.append(cols);

        let draw = () => {};
        const devices = h('div', {class: 'grw-badge-devices', role: 'group', 'aria-label': 'Preview width'});
        const stage = h('div', {class: 'grw-badge-stage grw-badge-embed-stage' + (cfg.stageClass ? ' ' + cfg.stageClass : ''), 'data-device': state.device});
        Object.keys(ICONS).forEach(d => {
            const b = h('button', {type: 'button', class: d === state.device ? 'grw-on' : '', 'aria-label': d.charAt(0).toUpperCase() + d.slice(1) + ' preview'}, '<svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">' + ICONS[d] + '</svg>');
            b.onclick = () => { state.device = d; [...devices.children].forEach(x => x.classList.toggle('grw-on', x === b)); stage.dataset.device = d; draw('device'); };
            devices.append(b);
        });
        const stageHead = h('div', {class: 'grw-badge-stage-head'});
        stageHead.append(h('h2', null, val('previewTitle')), devices);
        cols.prepend(stageHead);
        state.stage = stage;
        main.append(stage);

        // An editor may set W.sync to make its controls read the state again without a new render.
        W.sync = () => {};
        draw = cfg.editor({stage, side, ui: controls(side, state.options, k => { draw(k); W.changed(); })}, W);

        // A saved widget is saved where the user is, by the button or the auto save; the Publish step stays a click away on the indicator.
        // A new one goes on to it.
        const next = h('button', {type: 'button', class: 'button button-primary button-hero grw-pl-next'}, state.feedId ? 'Save changes' : 'Continue to publish');
        next.onclick = () => state.feedId ? saveChanges() : publish();
        foot = () => { next.disabled = !!state.feedId && (state.autosave || state.saving || !unsaved()); };
        const links = h('p', {class: 'grw-pl-links'}, (state.feedId ? '<label class="grw-pl-autosave"><input type="checkbox"> Auto save</label> · ' : '')
            + '<a href="#" class="grw-badge-back">Another preset</a> · <a href="#" class="grw-badge-reset">Reset to default theme</a>');
        const autoBox = links.querySelector('.grw-pl-autosave input');
        if (autoBox) {
            autoBox.checked = state.autosave;
            autoBox.onchange = () => { state.autosave = autoBox.checked; pref.set(autoBox.checked); };
        }
        // Back to the design picked on step 1; what was changed on this step goes.
        links.querySelector('.grw-badge-reset').onclick = e => {
            e.preventDefault();
            if (!confirm('Reset to the default theme? Your changes to the design are discarded.')) return;
            if (!(cfg.reset && cfg.reset())) state.options = Object.assign({}, state.preset || val('defaults'));
            W.rebuild();
        };
        // Only navigates: steps 2 and 3 stay reachable from the indicator with these options.
        links.querySelector('.grw-badge-back').onclick = e => { e.preventDefault(); go(1); };
        const footEl = h('div', {class: 'grw-pl-foot'});
        footEl.append(next, links);
        side.append(footEl);
        foot();

        body.append(wrap);
        draw();
        state.editor = {wrap, cols, main, side, h2: stageHead.firstElementChild, result: null, key: editorKey()};
    }

    if (cfg.init) cfg.init(W);
    if (state.feedId) state.saved = snapshot();
    go(state.step);
    return W;
}
