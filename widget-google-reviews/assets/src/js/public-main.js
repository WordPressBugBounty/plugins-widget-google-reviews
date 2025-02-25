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

document.addEventListener('DOMContentLoaded', function() {
    const els = document.querySelectorAll('.wp-gr[data-exec="false"]');
    for (let i = 0; i < els.length; i++) {
        (function(elem) {
            grw_init(elem, elem.getAttribute('data-layout'));
        })(els[i]);
    }
});