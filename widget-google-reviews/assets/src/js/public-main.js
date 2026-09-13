function rplg_badge_init(el, name, root_class) {
    var btn = el.querySelector('.wp-' + name + '-badge'),
        form = el.querySelector('.wp-' + name + '-form');

    if (!btn || !form) return;

    var wpac = document.createElement('div');
    wpac.className = root_class + ' wpac';

    if (btn.className.indexOf('-fixed') > -1) {
        wpac.appendChild(btn);
    }
    wpac.appendChild(form);
    document.body.appendChild(wpac);

    btn.onclick = function() {
        form.style.display='block';
    };
}

function rplg_next_reviews(name, pagin) {
    var parent = this.parentNode,
        selector = '.' + name + '-review.' + name + '-hide';
        reviews = parent.querySelectorAll(selector);
    for (var i = 0; i < pagin && i < reviews.length; i++) {
        if (reviews[i]) {
            reviews[i].className = reviews[i].className.replace(name + '-hide', ' ');
        }
    }
    reviews = parent.querySelectorAll(selector);
    if (reviews.length < 1) {
        parent.removeChild(this);
    }
    return false;
}

function rplg_leave_review_window() {
    rpi.Utils.popup(this.getAttribute('href'), 620, 500);
    return false;
}

function grw_popup_open(rootEl, popupEl) {
    popupEl.classList.add('grw-popup-on');
    rpi.Lightbox(popupEl).show(true);
    // A wheel over the backdrop would scroll the page under the popup and leave it elsewhere on close.
    const wrap = popupEl.closest('.rpi-lightbox-wrap');
    if (!wrap.grwWheel) {
        wrap.grwWheel = true;
        wrap.addEventListener('wheel', function(e) { if (!e.target.closest('.grw-popup')) e.preventDefault(); }, {passive: false});
    }
    grw_popup_focus(rootEl, popupEl);
    return false;
}

// Scrolls to the review the badge phrase (or its author fact) came from; without one the list stays where it was left.
function grw_popup_focus(rootEl, popupEl) {
    const clean = s => s.replace(/\s+/g, ' ').trim();
    const feed = rootEl.querySelector('.rpi-badge-feed'), q = feed && feed.querySelector('q');
    // Only the rated fact (author + one star) names a review; the other facts have no home in the list.
    const b = feed && feed.querySelector('.rpi-stars') ? feed.querySelector('b') : null;
    const text = q ? clean(q.textContent).replace(/…$/, '') : '';
    const name = b ? clean(b.textContent).split(' ')[0] : '';
    const reviews = popupEl.querySelectorAll('.grw-review, .wp-google-review');
    const hit = Array.prototype.find.call(reviews, r => text ? clean(r.textContent).indexOf(text) > -1 : name && clean((r.querySelector('.wp-google-name') || r).textContent).indexOf(name) === 0);
    popupEl.querySelectorAll('mark.grw-review-mark').forEach(function(m) { m.outerHTML = m.innerHTML; });
    if (hit) {
        if (text) grw_popup_mark(hit.querySelector('.wp-google-text') || hit, text);
        const go = function() { popupEl.scrollTo({top: popupEl.scrollTop + hit.getBoundingClientRect().top - popupEl.getBoundingClientRect().top - 16, behavior: 'smooth'}); };
        // Glides from where it was closed after a beat, so the move to the review reads as a move.
        setTimeout(function() {
            go();
            // Avatars above the review arrive after the first scroll and push it down; follow them.
            popupEl.querySelectorAll('img').forEach(function(img) { if (!img.complete) img.addEventListener('load', go, {once: true}); });
            hit.classList.add('grw-review-hl');
            setTimeout(function() { hit.classList.remove('grw-review-hl'); }, 2500);
        }, 500);
    }
}

function grw_popup_mark(el, text) {
    const re = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
        const m = re.exec(n.data);
        if (!m) continue;
        const range = document.createRange();
        range.setStart(n, m.index);
        range.setEnd(n, m.index + m[0].length);
        const mark = document.createElement('mark');
        mark.className = 'grw-review-mark';
        range.surroundContents(mark);
        return;
    }
}

// The badge popup is fetched on the first click: the lightbox opens at once on a skeleton, the reviews take its place.
function grw_badge_popup(rootEl, src) {
    let popupEl = null;
    // Another lightbox opened meanwhile takes the node out of the wrap; it must be left alone then.
    const onScreen = el => {
        const wrap = el.closest('.rpi-lightbox-wrap');
        return wrap && wrap.style.display !== 'none';
    };
    return function() {
        if (!popupEl) {
            const el = popupEl = document.createElement('div');
            el.className = rootEl.className + ' grw-popup';
            el.innerHTML = '<div class="grw-popup-skel">' + '<div><i></i><div><b></b><b></b><b></b></div></div>'.repeat(5) + '</div>';
            fetch(src, {credentials: 'same-origin'})
                .then(r => r.ok ? r.text() : Promise.reject())
                .then(html => {
                    const t = document.createElement('template');
                    t.innerHTML = html;
                    const list = t.content.querySelector('.grw-popup');
                    if (!list) return Promise.reject();
                    el.innerHTML = list.innerHTML;
                    if (onScreen(el)) grw_popup_focus(rootEl, el);
                })
                .catch(() => {
                    if (onScreen(el)) rpi.Lightbox(el).hide();
                    popupEl = null;
                });
        }
        return grw_popup_open(rootEl, popupEl);
    };
}

function grw_init(el, layout) {
    const rootEl = rpi.Utils.getParent(el, 'wp-gr');

    if (rootEl.getAttribute('data-exec') == 'true') return;
    else rootEl.setAttribute('data-exec', 'true');

    const options = JSON.parse(rootEl.getAttribute('data-options'));

    const common = rpi.Common(rootEl, options, {
        time     : 'wp-google-time',
        text     : 'wp-google-text',
        readmore : 'wp-more-toggle'
    });
    common.init();

    const media = rpi.Media(rootEl, {}, {
        root : 'wp-gr',
        card : 'grw-review'
    }).init();

    if (layout == 'badge' && rpi.Badge) {
        const src = rootEl.dataset.reviews;
        rpi.Badge(rootEl, {onclick: src && rpi.Lightbox && rootEl.querySelector('.rpi-badge-clickable') ? grw_badge_popup(rootEl, src) : null});
        return;
    }

    const popupEl = rootEl.querySelector('.grw-popup');
    const open = () => grw_popup_open(rootEl, popupEl);

    if (popupEl && rpi.Lightbox) {

        const headerEls = rootEl.getElementsByClassName('grw-header-inner');
        for (let i = 0; i < headerEls.length; i++) {
            headerEls[i].setAttribute('role', 'button');
            headerEls[i].setAttribute('tabindex', '0');
            headerEls[i].onclick = function(e) {
                if (e.target.closest('a')) return;
                open();
            };
            headerEls[i].onkeydown = function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            };
        }
    }

    if (rootEl.getElementsByClassName('grw-review')[0] && (layout == 'slider' || layout == 'grid')) {
        // Init Slider or Grid
        const row = rootEl.getElementsByClassName('grw-row')[0];
        const opt = JSON.parse(row.getAttribute('data-options'));
        const column = rpi.Column(rootEl, opt, {
            cnt      : 'grw-row',
            col      : 'grw-row',
            card     : 'grw-review'
        });
        const slider = rpi.Slider(rootEl, opt, {
            cnt      : 'grw-row',
            col      : 'grw-row',
            content  : 'grw-content',
            cards    : 'grw-reviews',
            card     : 'grw-review',
            text     : 'wp-google-text',
            btnPrev  : 'grw-prev',
            btnNext  : 'grw-next',
            dotsWrap : 'rpi-dots-wrap',
            dots     : 'rpi-dots',
            dot      : 'rpi-dot'
        }, {
            column: column
        });
        slider.init();
    }
}

function grw_boot() {
    const els = document.querySelectorAll('.wp-gr[data-exec="false"]');
    for (let i = 0; i < els.length; i++) {
        (function(elem) {
            grw_init(elem, elem.getAttribute('data-layout'));
        })(els[i]);
    }
}

document.addEventListener('DOMContentLoaded', grw_boot);