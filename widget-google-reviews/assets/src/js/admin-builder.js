const GRW_AUTOSAVE_KEYUP_TIMEOUT = 1500;
var GRW_AUTOSAVE_TIMEOUT = null;

const GRW_LANGS = [
    ['ar', 'Arabic'],
    ['bg', 'Bulgarian'],
    ['bn', 'Bengali'],
    ['ca', 'Catalan'],
    ['cs', 'Czech'],
    ['da', 'Danish'],
    ['de', 'German'],
    ['el', 'Greek'],
    ['en', 'English'],
    ['es', 'Spanish'],
    ['eu', 'Basque'],
    ['eu', 'Basque'],
    ['fa', 'Farsi'],
    ['fi', 'Finnish'],
    ['fil', 'Filipino'],
    ['fr', 'French'],
    ['gl', 'Galician'],
    ['gu', 'Gujarati'],
    ['hi', 'Hindi'],
    ['hr', 'Croatian'],
    ['hu', 'Hungarian'],
    ['id', 'Indonesian'],
    ['it', 'Italian'],
    ['iw', 'Hebrew'],
    ['ja', 'Japanese'],
    ['kn', 'Kannada'],
    ['ko', 'Korean'],
    ['lt', 'Lithuanian'],
    ['lv', 'Latvian'],
    ['ml', 'Malayalam'],
    ['mr', 'Marathi'],
    ['nl', 'Dutch'],
    ['no', 'Norwegian'],
    ['pl', 'Polish'],
    ['pt', 'Portuguese'],
    ['pt-BR', 'Portuguese (Brazil)'],
    ['pt-PT', 'Portuguese (Portugal)'],
    ['ro', 'Romanian'],
    ['ru', 'Russian'],
    ['sk', 'Slovak'],
    ['sl', 'Slovenian'],
    ['sr', 'Serbian'],
    ['sv', 'Swedish'],
    ['ta', 'Tamil'],
    ['te', 'Telugu'],
    ['th', 'Thai'],
    ['tl', 'Tagalog'],
    ['tr', 'Turkish'],
    ['uk', 'Ukrainian'],
    ['vi', 'Vietnamese'],
    ['zh', 'Chinese (Simplified)'],
    ['zh-Hant', 'Chinese (Traditional)']
];

var GRW_HTML_CONTENT = '' +

    '<div class="grw-builder-platforms grw-builder-inside">' +

        '<div class="grw-builder-connect grw-connect-google">Google Connection</div>' +
        '<div id="grw-connect-wizard" title="Google reviews connection" style="display:none;">' +
            '<iframe id="gpidc" src="https://app.richplugins.com/gpidc?authcode={{authcode}}" style="width:100%;height:400px"></iframe>' +
            '<small class="grw-connect-error"></small>' +
        '</div>' +
        '<div class="grw-connections"></div>' +
    '</div>' +

    '<div class="grw-connect-options">' +

        '<div class="grw-builder-inside">' +

            '<div class="grw-builder-option">' +
                'Layout' +
                '<select id="view_mode" name="view_mode">' +
                    '<option value="slider" selected="selected">Slider</option>' +
                    '<option value="grid">Grid</option>' +
                    '<option value="list">List</option>' +
                    '<option value="rating">Rating</option>' +
                '</select>' +
            '</div>' +

        '</div>' +

        /* Common Options */
        '<div class="grw-builder-top grw-toggle">Common Options</div>' +
        '<div class="grw-builder-inside" style="display:none">' +
            '<div class="grw-builder-option">' +
                'Pagination' +
                '<input type="text" name="pagination" value="">' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Maximum characters before \'read more\' link' +
                '<input type="text" name="text_size" value="">' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="header_center" value="">' +
                    'Show rating by center' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="header_hide_photo" value="">' +
                    'Hide business photo' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="header_hide_name" value="">' +
                    'Hide business name' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="hide_based_on" value="">' +
                    'Hide \'Based on ... reviews\'' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="hide_writereview" value="">' +
                    'Hide \'review us on G\' button' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="short_last_name" value="">' +
                    'Short last name (GDPR)' +
                '</label>' +
                '<span class="grw-quest grw-quest-top grw-toggle" title="Click to help">?</span>' +
                '<div class="grw-quest-help" style="display:none;">Show only first name and first letter of last name</div>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="min_letter" value="">' +
                    'Hide reviews without text' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="header_hide_social" value="">' +
                    'Hide rating header, leave only reviews' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="hide_reviews" value="">' +
                    'Hide reviews, leave only rating header' +
                '</label>' +
            '</div>' +
        '</div>' +

        /* Slider Options */
        '<div class="grw-builder-top grw-toggle">Slider Options</div>' +
        '<div class="grw-builder-inside" style="display:none">' +
            '<div class="grw-builder-option">' +
                'Speed in second' +
                '<input type="text" name="slider_speed" value="" placeholder="Default: 3">' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Text height' +
                '<input type="text" name="slider_text_height" value="" placeholder="Default: 100px">' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="slider_autoplay" value="" checked>' +
                    'Auto-play' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="slider_mousestop" value="" checked>' +
                    'Stop auto play on mouse over' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="slider_hide_prevnext" value="">' +
                    'Hide prev & next buttons' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="slider_hide_dots" value="">' +
                    'Hide dots' +
                '</label>' +
            '</div>' +
        '</div>' +

        /* Breakpoints */
        '<div class="grw-builder-top grw-toggle">Column Options</div>' +
        '<div class="grw-builder-inside" style="display:none">' +
            '<div class="grw-builder-option">' +
                '<input type="hidden" name="slider_breakpoints">' +
                '<label>' +
                    'How many columns to show (for Slider & Grid)' +
                '</label>' +
                '<div class="grw-slider-br">' +
                    '<label>' +
                        '<select>' +
                            '<option value="off">Disable</option>' +
                            '<option value="3000">Large Desktop & TV</option>' +
                            '<option value="1200">Desktop</option>' +
                            '<option value="1024">Laptop</option>' +
                            '<option value="768">Table</option>' +
                            '<option value="480">Mobile</option>' +
                            '<option value="">Custom</option>' +
                        '</select>' +
                    '</label>' +
                    '<label>' +
                        '<input type="range" name="" value="3" min="1" max="12" step="1" oninput="this.nextSibling.innerHTML=this.value"/><span></span>' +
                    '</label>' +
                    '<span class="grw-quest" title="Click to add new breakpoints">+</span>' +
                '</div>' +
            '</div>' +
        '</div>' +

        /* Style Options */
        '<div class="grw-builder-top grw-toggle">Style Options</div>' +
        '<div class="grw-builder-inside" style="display:none">' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--star-color" value="#fb8e28" data-val="#fb8e28" data-defval="#fb8e28"/>' +
                '<input type="text" value="#fb8e28"/>' +
                'Stars color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--head-name-color" value="#333333" data-val="#333333" data-defval="#333333"/>' +
                '<input type="text" value="#333333"/>' +
                'Business name color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--head-based-color" value="#555555" data-val="#555555" data-defval="#555555"/>' +
                '<input type="text" value="#555555"/>' +
                'Based on color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--powered-color" value="#777777" data-val="#777777" data-defval="#777777"/>' +
                '<input type="text" value="#777777"/>' +
                'Powered color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--btn-color" value="#1f67e7" data-val="#1f67e7" data-defval="#1f67e7"/>' +
                '<input type="text" value="#1f67e7"/>' +
                'Button color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--rev-color" value="#fafafa" data-val="#fafafa" data-defval="#fafafa"/>' +
                '<input type="text" value="#fafafa"/>' +
                'Reviews color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="color" name="--text-color" value="#222222" data-val="#222222" data-defval="#222222"/>' +
                '<input type="text" value="#222222"/>' +
                'Reviews text color' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<a href="javascript:void(0)" onclick="stylereset(this.parentNode.parentNode);grw_serialize_connections()">' +
                    'Reset to default style' +
                '</a>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="dark_theme">' +
                    'Dark background' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="hide_backgnd" value="">' +
                    'Hide reviews background' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="show_round" value="">' +
                    'Round reviews borders' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="show_shadow" value="">' +
                    'Show reviews shadow' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="centered" value="">' +
                    'Place by center (only if max-width is set)' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Container max-width' +
                '<input type="text" name="max_width" value="" placeholder="for instance: 300px">' +
                '<small>Be careful: this will make reviews unresponsive</small>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Container max-height' +
                '<input type="text" name="max_height" value="" placeholder="for instance: 500px">' +
            '</div>' +
            '<input id="style_vars" name="style_vars" type="hidden"/>' +
        '</div>' +

        /* Advance Options */
        '<div class="grw-builder-top grw-toggle">Advance Options</div>' +
        '<div class="grw-builder-inside" style="display:none">' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="lazy_load_img" checked>' +
                    'Lazy load images' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="google_def_rev_link">' +
                    'Use default Google reviews link' +
                '</label>' +
                '<span class="grw-quest grw-quest-top grw-toggle" title="Click to help">?</span>' +
                '<div class="grw-quest-help" style="display:none;">If the direct link to all reviews <b>https://search.google.com/local/reviews?placeid=&lt;PLACE_ID&gt;</b> does not work with your Google place (leads to 404), please use this option to use the default reviews link to Google map.</div>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="open_link" checked>' +
                    'Open links in new Window' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="nofollow_link" checked>' +
                    'Use no follow links' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Reviewer avatar size' +
                '<select name="reviewer_avatar_size">' +
                    '<option value="56" selected="selected">Small: 56px</option>' +
                    '<option value="128">Medium: 128px</option>' +
                    '<option value="256">Large: 256px</option>' +
                '</select>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Cache data' +
                '<select name="cache">' +
                    '<option value="1">1 Hour</option>' +
                    '<option value="3">3 Hours</option>' +
                    '<option value="6">6 Hours</option>' +
                    '<option value="12" selected="selected">12 Hours</option>' +
                    '<option value="24">1 Day</option>' +
                    '<option value="48">2 Days</option>' +
                    '<option value="168">1 Week</option>' +
                    '<option value="">Disable (NOT recommended)</option>' +
                '</select>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                'Reviews limit' +
                '<input type="text" name="reviews_limit" value="">' +
            '</div>' +
        '</div>' +

    '</div>';

function grw_stylechange2(target) {
    let rp = document.getElementsByClassName('wp-gr')[0];

    if (target.type == 'range' || target.type == 'color') {
        let val = target.value + (target.getAttribute('data-postfix') || '');
        target.setAttribute('data-val', val);
        rp.style.setProperty(target.name, val);

        // if color input put color to the next text input
        if (target.type == 'color') {
            target.nextSibling.value = val;
        }
    } else if (target.type == 'checkbox' || target.type == 'radio') {
        let vars = target.getAttribute('data-vars');
        if (vars) {
            let arr = vars.split(';');
            for (let i = 0; i < arr.length; i++) {
                let pair = arr[i].split(':');
                if (pair.length > 1) {
                    if (target.checked) {
                        let val = pair[1].trim();
                        rp.style.setProperty(pair[0].trim(), pair[1].trim());
                    } else {
                        rp.style.removeProperty(pair[0].trim());
                    }
                }
            }
        }
        if (target.checked) {
            rp.style.setProperty(target.name, target.getAttribute('data-on'));
        } else if (target.getAttribute('data-off')) {
            rp.style.setProperty(target.name, target.getAttribute('data-off'));
        } else {
            rp.style.removeProperty(target.name);
        }
    }

    let style = rp.getAttribute('style'),
        cssvars = style.match(/(--[a-z]+(-[a-z]+)*:\s*[#0-9a-z]+\s*;)+/g);

    if (cssvars && cssvars.length) {
        window.style_vars.value = cssvars.join('');
    }
}

function stylereset(parentEl, style_var) {
    let rp = document.getElementsByClassName('wp-gr')[0];
    if (rp) {
        let inputs = (parentEl ? parentEl : document).querySelectorAll('input[name^="--"]');

        for (let i = 0; i < inputs.length; i++) {
            let defval = inputs[i].getAttribute('data-defval'),
                pf = inputs[i].getAttribute('data-postfix') || '',
                val = inputs[i].value + pf;

            inputs[i].value = defval;
            inputs[i].setAttribute('data-val', defval + pf);

            // if color input put color to the next text input
            if (inputs[i].type == 'color') {
                inputs[i].nextSibling.value = defval + pf;
            } else if (inputs[i].type == 'checkbox' || inputs[i].type == 'radio') {
                let vars = inputs[i].getAttribute('data-vars');
                if (vars) {
                    let arr = vars.split(';');
                    for (let i = 0; i < arr.length; i++) {
                        let pair = arr[i].split(':');
                        rp.style.removeProperty(pair[0].trim());
                    }
                }
                inputs[i].checked = inputs[i].getAttribute('data-checked') == '1';
            }
            rp.style.removeProperty(inputs[i].name);
        }
        window.style_vars.value = rp.getAttribute('style');
    }
}

function grw_builder_init($, data) {

    var el = document.querySelector(data.el);
    if (!el) return;

    el.innerHTML = GRW_HTML_CONTENT.replace('{{authcode}}', data.authcode);

    var $connect_wizard_el = $('#grw-connect-wizard');

    if (data.conns && data.conns.connections && data.conns.connections.length) {
        grw_deserialize_connections($, el, data);
    } else {
        $('.grw-connect-google').hide();
        $connect_wizard_el.dialog({
            modal: false,
            width: '50%',
            maxWidth: '600px',
            closeOnEscape: false,
            open: function() { $(".ui-dialog-titlebar-close").hide() }
        });
    }

    // GPIDC
    window.onmessage = function(e) {
        if (e.origin !== 'https://app.richplugins.com') return;
        if (e.data) {
            let data = e.data;
            switch (data.action) {
                case 'get_place':
                    $.post(ajaxurl, {
                        pid       : data.pid,
                        token     : data.token,
                        action    : 'grw_get_place',
                        grw_nonce : jQuery('#grw_nonce').val()
                    }, function(res) {
                        if (res.status == 'success') {
                            res.result.place_id = data.pid;
                            window.gpidc.contentWindow.postMessage({data: res, action: 'set_place'}, '*');
                        } else {
                            grw_connect_error($, res.result.error_message);
                        }
                    });
                    break;
                case 'connect':
                    grw_connect_ajax($, el, data, data.authcode, 1);
                    break;
            }
        }
    };

    // Init slider breakpoints
    grw_sbs_init();

    $('.grw-connect-options input[type="text"],.grw-connect-options textarea').keyup(function() {
        clearTimeout(GRW_AUTOSAVE_TIMEOUT);
        GRW_AUTOSAVE_TIMEOUT = setTimeout(grw_serialize_connections, GRW_AUTOSAVE_KEYUP_TIMEOUT);
    });
    $('.grw-connect-options input[type="checkbox"],.grw-connect-options select').change(function() {
        grw_serialize_connections();
    });
    $('.grw-connect-options input[name^="--"]').on('input', function() {
        grw_stylechange2(this);
        clearTimeout(GRW_AUTOSAVE_TIMEOUT);
        GRW_AUTOSAVE_TIMEOUT = setTimeout(grw_serialize_connections, GRW_AUTOSAVE_KEYUP_TIMEOUT);
    });
    $('.grw-connect-options input[type="color"][name^="--"] + input[type="text"]').keyup(function() {
        if (this.value.indexOf('#') == 0 && this.value.length == 7) {
            this.previousElementSibling.value = this.value;
            this.previousElementSibling.dispatchEvent(new Event('input'));
        }
    });

    $('.grw-toggle', el).unbind('click').click(function () {
        $(this).toggleClass('toggled');
        $(this).next().slideToggle();
    });

    $('.grw-builder-connect.grw-connect-google').click(function () {
        $connect_wizard_el.dialog({modal: true, width: '50%', maxWidth: '600px'});
    });

    if ($('.grw-connections').sortable) {
        $('.grw-connections').sortable({
            stop: function(event, ui) {
                grw_serialize_connections();
            }
        });
        $('.grw-connections').disableSelection();
    }

    $('.wp-review-hide').click(function() {
        grw_review_hide($(this));
        return false;
    });

    $('#grw_save').click(function() {
        grw_serialize_connections();
        return false;
    });

    window.addEventListener('beforeunload', function(e) {
        if (!GRW_AUTOSAVE_TIMEOUT) return undefined;

        var msg = 'It looks like you have been editing something. If you leave before saving, your changes will be lost.';
        (e || window.event).returnValue = msg;
        return msg;
    });
}

function grw_feed_save_ajax() {
    if (!window.grw_title.value) {
        window.grw_title.focus();
        return false;
    }

    window.grw_save.innerText = 'Auto save, wait';
    window.grw_save.disabled = true;

    jQuery.post(ajaxurl, {

        post_id   : window.grw_post_id.value,
        title     : window.grw_title.value,
        content   : document.getElementById('grw-builder-connection').value,
        action    : 'grw_feed_save_ajax',
        grw_nonce : jQuery('#grw_nonce').val()

    }, function(res) {

        rpi.Utils.clear();

        var wpgr = document.querySelectorAll('.wp-gr');
        for (var i = 0; i < wpgr.length; i++) {
            wpgr[i].parentNode.removeChild(wpgr[i]);
        }

        window.grw_collection_preview.innerHTML = res;

        jQuery('.wp-review-hide').unbind('click').click(function() {
            grw_review_hide(jQuery(this));
            return false;
        });

        if (!window.grw_post_id.value) {
            var post_id = document.querySelector('.wp-gr').getAttribute('data-id');
            window.grw_post_id.value = post_id;
            window.location.href = GRW_VARS.builderUrl + '&grw_feed_id=' + post_id + '&grw_feed_new=1';
        } else {
            var $rateus = jQuery('#grw-rate_us');
            if ($rateus.length && !$rateus.hasClass('grw-flash-visible') && !window['grw_rateus']) {
                $rateus.addClass('grw-flash-visible');
            }
        }

        window.grw_save.innerText = 'Save & Update';
        window.grw_save.disabled = false;
        GRW_AUTOSAVE_TIMEOUT = null;
    });
}

function grw_review_hide($this) {

    jQuery.post(ajaxurl, {

        id          : $this.attr('data-id'),
        feed_id     : jQuery('input[name="grw_feed[post_id]"]').val(),
        grw_wpnonce : jQuery('#grw_nonce').val(),
        action      : 'grw_hide_review'

    }, function(res) {
        var parent = $this.parent().parent();
        if (res.hide) {
            $this.text('show review');
            parent.addClass('wp-review-hidden');
        } else {
            $this.text('hide review');
            parent.removeClass('wp-review-hidden');
        }
    }, 'json');
}

function grw_connect_ajax($, el, params, authcode, attempt) {

    var platform = 'google',
        connect_btn = el.querySelector('.grw-connect-btn');

    window.grw_save.innerText = 'Auto save, wait';
    window.grw_save.disabled = true;

    $.post(ajaxurl, {

        id          : decodeURIComponent(params.id),
        lang        : params.lang,
        local_img   : params.local_img || false,
        token       : params.token,
        feed_id     : $('input[name="grw_feed[post_id]"]').val(),
        authcode    : authcode,
        grw_wpnonce : $('#grw_nonce').val(),
        action      : 'grw_connect_google',
        v           : new Date().getTime()

    }, function(res) {

        console.log('grw_connect_debug:', res);

        var error_el = document.querySelector('.grw-connect-error');

        if (res.status == 'success') {

            error_el.innerHTML = '';

            try { $('#grw-connect-wizard').dialog('close'); } catch (e) {}

            var connection_params = {
                id        : res.result.id,
                lang      : params.lang,
                name      : res.result.name,
                photo     : res.result.photo,
                refresh   : true,
                local_img : params.local_img,
                platform  : platform,
                props     : {
                    default_photo : res.result.photo
                }
            };

            grw_connection_add($, el, connection_params, authcode);
            grw_serialize_connections();

        } else {
            grw_connect_error($, res.result.error_message, function() {
                if (attempt > 1) return;
                grw_popup('https://app.richplugins.com/gpaw/botcheck?authcode=' + authcode, 640, 480, function() {
                    window.gpidc.contentWindow.postMessage({params: params, action: 'connect'}, '*');
                });
            });
        }

    }, 'json');
}

function grw_connect_error($, error_message, cb) {

    let error_el = document.querySelector('.grw-connect-error');
    error_el.innerHTML = '';

    switch (error_message) {

        case 'usage_limit':
            $('#dialog').dialog({width: '50%', maxWidth: '600px'});
            break;

        case 'bot_check':
            cb && cb();
            break;

        default:
            if (error_message.indexOf('The provided Place ID is no longer valid') >= 0) {
                error_el.innerHTML = 'It seems Google place which you are trying to connect ' +
                    'does not have a physical address (it\'s virtual or service area), ' +
                    'unfortunately, Google Places API does not support such locations, it\'s a limitation of Google, not the plugin.<br><br>' +
                    'However, you can try to connect your Google reviews in our new cloud service ' +
                    '<a href="https://trust.reviews" target="_blank">Trust.Reviews</a> ' +
                    'and show it on your WordPress site through universal <b>HTML/JavaScript</b> code.';
            } else {
                error_el.innerHTML = '<b>Error</b>: ' + error_message;
            }
    }
}

function grw_connection_add($, el, conn, authcode, checked, append) {

    var connected_id = grw_connection_id(conn),
        connected_el = $('#' + connected_id);

    if (!connected_el.length) {
        connected_el = $('<div class="grw-connection"></div>')[0];
        connected_el.id = connected_id;
        if (conn.lang != undefined) {
            connected_el.setAttribute('data-lang', conn.lang);
        }
        connected_el.setAttribute('data-platform', conn.platform);
        connected_el.innerHTML = grw_connection_render(conn, checked);

        var connections_el = $('.grw-connections')[0];
        if (append) {
            connections_el.appendChild(connected_el);
        } else {
            connections_el.prepend(connected_el);
        }

        jQuery('.grw-toggle', connected_el).unbind('click').click(function () {
            jQuery(this).toggleClass('toggled');
            jQuery(this).next().slideToggle();
        });

        var file_frame;
        jQuery('.grw-connect-photo-change', connected_el).on('click', function(e) {
            e.preventDefault();
            grw_upload_photo(connected_el, file_frame, function() {
                grw_serialize_connections();
            });
            return false;
        });

        jQuery('.grw-connect-photo-default', connected_el).on('click', function(e) {
            grw_change_photo(connected_el, conn.props.default_photo);
            grw_serialize_connections();
            return false;
        });

        $('input[type="text"]', connected_el).keyup(function() {
            clearTimeout(GRW_AUTOSAVE_TIMEOUT);
            GRW_AUTOSAVE_TIMEOUT = setTimeout(grw_serialize_connections, GRW_AUTOSAVE_KEYUP_TIMEOUT);
        });

        $('input[type="checkbox"]', connected_el).click(function() {
            grw_serialize_connections();
        });

        $('select.grw-connect-lang', connected_el).change(function() {
            conn.lang = this.value;
            connected_el.id = grw_connection_id(conn);
            connected_el.setAttribute('data-lang', this.value);
            window.gpidc.contentWindow.postMessage({params: conn, action: 'connect'}, '*');
            return false;
        });

        $('input[name="local_img"]', connected_el).unbind('click').click(function() {
            conn.local_img = this.checked;
            window.gpidc.contentWindow.postMessage({params: conn, action: 'connect'}, '*');
        });

        $('.grw-connect-reconnect', connected_el).click(function() {
            window.gpidc.contentWindow.postMessage({params: conn, action: 'connect'}, '*');
            return false;
        });

        $('.grw-connect-delete', connected_el).click(function() {
            if (confirm('Are you sure to delete this business?')) {
                $(connected_el).remove();
                grw_serialize_connections();
            }
            return false;
        });
    }
}

function grw_connection_id(conn) {
    var id = 'grw-' + conn.platform + '-' + conn.id.replace(/\//g, '');
    if (conn.lang != null) {
        id += conn.lang;
    }
    return id;
}

function grw_connection_render(conn, checked) {
    var name = conn.name;
    if (conn.lang) {
        name += ' (' + conn.lang + ')';
    }

    conn.photo = conn.photo || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    var option = document.createElement('option');
    if (conn.platform == 'google' && conn.props && conn.props.place_id) {
        option.value = conn.props.place_id;
    } else {
        option.value = conn.id;
    }
    option.text = grw_capitalize(conn.platform) + ': ' + conn.name;

    return '' +
        '<div class="grw-toggle grw-builder-connect grw-connect-business">' +
            '<input type="checkbox" class="grw-connect-select" onclick="event.stopPropagation();" ' + (checked?'checked':'') + ' /> ' +
            name + (conn.address ? ' (' + conn.address + ')' : '') +
        '</div>' +
        '<div style="display:none">' +
            (function(props) {
                var result = '';
                for (prop in props) {
                    if (prop != 'platform' && Object.prototype.hasOwnProperty.call(props, prop)) {
                        result += '<input type="hidden" name="' + prop + '" value="' + props[prop] + '" class="grw-connect-prop" readonly />';
                    }
                }
                return result;
            })(conn.props) +
            '<input type="hidden" name="id" value="' + conn.id + '" readonly />' +
            (conn.address ? '<input type="hidden" name="address" value="' + conn.address + '" readonly />' : '') +
            (conn.access_token ? '<input type="hidden" name="access_token" value="' + conn.access_token + '" readonly />' : '') +
            '<div class="grw-builder-option">' +
                '<img src="' + conn.photo + '" alt="' + conn.name + '" class="grw-connect-photo">' +
                '<a href="#" class="grw-connect-photo-change">Change</a>' +
                '<a href="#" class="grw-connect-photo-default">Default</a>' +
                '<input type="hidden" name="photo" class="grw-connect-photo-hidden" value="' + conn.photo + '" tabindex="2"/>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<input type="text" name="name" value="' + conn.name + '" />' +
            '</div>' +
            (conn.website != undefined ?
            '<div class="grw-builder-option">' +
                '<input type="text" name="website" value="' + conn.website + '" />' +
            '</div>'
            : '' ) +
            (conn.lang != undefined ?
            '<div class="grw-builder-option">' +
                //'<input type="text" name="lang" value="' + conn.lang + '" placeholder="Default language (English)" />' +
                grw_lang('Show all connected languages', conn.lang) +
            '</div>'
            : '' ) +
            (conn.review_count != undefined ?
            '<div class="grw-builder-option">' +
                '<input type="text" name="review_count" value="' + conn.review_count + '" placeholder="Total number of reviews" />' +
                '<span class="grw-quest grw-toggle" title="Click to help">?</span>' +
                '<div class="grw-quest-help">Google return only 5 most helpful reviews and does not return information about total number of reviews and you can type here it manually.</div>' +
            '</div>'
            : '' ) +
            (conn.refresh != undefined ?
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="refresh" ' + (conn.refresh ? 'checked' : '') + '>' +
                    'Update reviews daily' +
                '</label>' +
                '<span class="grw-quest grw-quest-top grw-toggle" title="Click to help">?</span>' +
                '<div class="grw-quest-help">' +
                    (conn.platform == 'google' ? 'The plugin uses the Google Places API to get your reviews. <b>The API only returns the 5 most helpful reviews (it\'s a limitation of Google, not the plugin)</b>. This option calls the Places API once in 24 hours (to keep the plugin\'s free and avoid a Google Billing) to check for a new reviews and if there are, adds to the plugin. Thus slowly building up a database of reviews.<br><br>Also if you see the new reviews on Google map, but after some time it\'s not added to the plugin, it means that Google does not include these reviews to the API and the plugin can\'t get this.<br><br>If you need to show <b>all reviews</b>, please use <a href="https://richplugins.com/business-reviews-bundle-wordpress-plugin?promo=GRGROW23" target="_blank">Business plugin</a> which uses a Google My Business API without API key and billing.' : '') +
                    (conn.platform == 'yelp' ? 'The plugin uses the Yelp API to get your reviews. <b>The API only returns the 3 most helpful reviews without sorting possibility.</b> When Yelp changes the 3 most helpful the plugin will automatically add the new one to your database. Thus slowly building up a database of reviews.' : '') +
                '</div>' +
            '</div>'
            : '' ) +
            '<div class="grw-builder-option">' +
                '<label>' +
                    '<input type="checkbox" name="local_img" ' + (conn.local_img ? 'checked' : '') + '>' +
                    'Save images locally (GDPR)' +
                '</label>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<button class="grw-connect-reconnect">Reconnect</button>' +
            '</div>' +
            '<div class="grw-builder-option">' +
                '<button class="grw-connect-delete">Delete connection</button>' +
            '</div>' +
        '</div>';
}

function grw_serialize_connections() {

    var connections = [],
        connections_el = document.querySelectorAll('.grw-connection');

    for (var i in connections_el) {
        if (Object.prototype.hasOwnProperty.call(connections_el, i)) {

            var select_el = connections_el[i].querySelector('.grw-connect-select');
            if (select_el && !grw_is_hidden(select_el) && !select_el.checked) {
                continue;
            }

            var connection = {},
                lang       = connections_el[i].getAttribute('data-lang'),
                platform   = connections_el[i].getAttribute('data-platform'),
                inputs     = connections_el[i].querySelectorAll('input');

            //connections[platform] = connections[platform] || [];

            if (lang != undefined) {
                connection.lang = lang;
            }

            for (var j in inputs) {
                if (Object.prototype.hasOwnProperty.call(inputs, j)) {
                    var input = inputs[j],
                        name = input.getAttribute('name');

                    if (!name) continue;

                    if (input.className == 'grw-connect-prop') {
                        connection.props = connection.props || {};
                        connection.props[name] = input.value;
                    } else {
                        connection[name] = (input.type == 'checkbox' ? input.checked : input.value);
                    }
                }
            }
            connection.platform = platform;
            connections.push(connection);
        }
    }

    var options = {},
        options_el = document.querySelector('.grw-connect-options').querySelectorAll('input[name],select,textarea');

    for (var o in options_el) {
        if (Object.prototype.hasOwnProperty.call(options_el, o)) {
            var input = options_el[o],
                name  = input.getAttribute('name');

            if (input.type == 'checkbox') {
                options[name] = input.checked;
            } else if (input.value != undefined) {
                options[name] = (
                                    input.type == 'textarea'     ||
                                    name       == 'word_filter'  ||
                                    name       == 'word_exclude' ?
                                    encodeURIComponent(input.value) : input.value
                                );
            }
        }
    }

    document.getElementById('grw-builder-connection').value = JSON.stringify({connections: connections, options: options});

    if (connections.length) {
        var first = connections[0],
            title = window.grw_title.value;

        if (!title) {
            window.grw_title.value = first.name;
        }
        grw_feed_save_ajax();
    } else {
        /*var connect_google_el = document.querySelector('.grw-connect-google-inside'),
            google_pid_el = document.querySelector('.grw-connect-id');

        connect_google_el.style = '';
        google_pid_el.focus();*/
    }
}

function grw_deserialize_connections($, el, data) {
    var connections = data.conns,
        options = connections.options;

    if (Array.isArray(connections.connections)) {
        connections = connections.connections;
    } else {
        var temp_conns = [];
        if (Array.isArray(connections.google)) {
            for (var c = 0; c < connections.google.length; c++) {
                connections.google[c].platform = 'google';
            }
            temp_conns = temp_conns.concat(connections.google);
        }
        if (Array.isArray(connections.facebook)) {
            for (var c = 0; c < connections.facebook.length; c++) {
                connections.facebook[c].platform = 'facebook';
            }
            temp_conns = temp_conns.concat(connections.facebook);
        }
        if (Array.isArray(connections.yelp)) {
            for (var c = 0; c < connections.yelp.length; c++) {
                connections.yelp[c].platform = 'yelp';
            }
            temp_conns = temp_conns.concat(connections.yelp);
        }
        connections = temp_conns;
    }

    let $bp = el.querySelector('.grw-builder-platforms');
    for (var i = 0; i < connections.length; i++) {
        grw_connection_add($, $bp, connections[i], data.authcode, true, true);
    }

    for (var opt in options) {
        if (Object.prototype.hasOwnProperty.call(options, opt) && opt) {
            var control = el.querySelector('input[name="' + opt + '"],select[name="' + opt + '"],textarea[name="' + opt + '"]');
            if (control) {
                var name = control.getAttribute('name');
                if (typeof(options[opt]) === 'boolean') {
                    control.checked = options[opt];
                } else {
                    control.value = (
                                        control.type == 'textarea'     ||
                                        name         == 'word_filter'  ||
                                        name         == 'word_exclude' ?
                                        decodeURIComponent(options[opt]) : options[opt]
                                    );
                    if (opt.indexOf('_photo') > -1 && control.value) {
                        control.parentNode.querySelector('img').src = control.value;
                    }
                    if (opt == 'style_vars') {
                        rplg_sv_parse(el, control.value);
                    }
                    if (opt == 'slider_breakpoints') {
                        grw_sbs_parse(control.value);
                    }
                }
            }
        }
    }
}

function rplg_sv_parse(el, val) {
    if (val) {
        let sv = val.split(';');
        for (let i = 0; i < sv.length; i++) {
            if (sv[i]) {
                let svp = sv[i].split(':'),
                    svcs = el.querySelectorAll('input[name="' + svp[0].trim() + '"]');
               for (let j = 0; j < svcs.length; j++) {
                   let svc = svcs[j];
                    if (svc.type == 'checkbox') {
                        let off = svc.getAttribute('data-off'),
                            on = svc.getAttribute('data-on');
                        svc.checked = svp[1].trim() != off ? (svp[1].trim() == on) : false;
                    } else {
                        let da = svc.getAttribute('data-postfix');
                        svc.setAttribute('data-val', svp[1].trim());
                        svc.value = svp[1].trim().replace(da, '');

                        // if color input put color to the next text input
                        if (svc.type == 'color') {
                            svc.nextSibling.value = svp[1].trim();
                        }
                    }
                }
            }
        }
    } else {
        stylereset();
    }
}

function grw_upload_photo(el, file_frame, cb) {
    if (file_frame) {
        file_frame.open();
        return;
    }

    file_frame = wp.media.frames.file_frame = wp.media({
        title: jQuery(this).data('uploader_title'),
        button: {text: jQuery(this).data('uploader_button_text')},
        multiple: false
    });

    file_frame.on('select', function() {
        var attachment = file_frame.state().get('selection').first().toJSON();
        grw_change_photo(el, attachment.url);
        cb && cb(attachment.url);
    });
    file_frame.open();
}

function grw_change_photo(el, photo_url) {
    var place_photo_hidden = jQuery('.grw-connect-photo-hidden', el),
        place_photo_img = jQuery('.grw-connect-photo', el);

    place_photo_hidden.val(photo_url);
    place_photo_img.attr('src', photo_url);
    place_photo_img.show();

    grw_serialize_connections();
}

function grw_popup(url, width, height, cb) {
    var top = top || (screen.height/2)-(height/2),
        left = left || (screen.width/2)-(width/2),
        win = window.open(url, '', 'location=1,status=1,resizable=yes,width='+width+',height='+height+',top='+top+',left='+left);
    function check() {
        if (!win || win.closed != false) {
            cb();
        } else {
            setTimeout(check, 100);
        }
    }
    setTimeout(check, 100);
}

function grw_randstr(len) {
   var result = '',
       chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
       charsLen = chars.length;
   for ( var i = 0; i < len; i++ ) {
      result += chars.charAt(Math.floor(Math.random() * charsLen));
   }
   return result;
}

function grw_is_hidden(el) {
    return el.offsetParent === null;
}

function grw_capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function grw_lang(defname, lang) {
    var html = '';
    for (var i = 0; i < GRW_LANGS.length; i++) {
        html += '<option value="' + GRW_LANGS[i][0] + '"' + (lang == GRW_LANGS[i][0] ? ' selected="selected"' : '') + '>' + GRW_LANGS[i][1] + '</option>';
    }
    return '<select class="grw-connect-lang" name="lang">' +
               '<option value=""' + (lang ? '' : ' selected="selected"') + '>' + defname + '</option>' +
               html +
           '</select>';
}

/******************************** Breakpoints copy & paste ********************************/
function grw_sbs_init() {
    var select = document.querySelector('.grw-slider-br select'),
        range = document.querySelector('.grw-slider-br input[type="range"]'),
        span = document.querySelector('.grw-slider-br .grw-quest');

    select.addEventListener('change', grw_sbs_keyup);
    range.addEventListener('input', grw_sbs_keyup);

    span.onclick = function() {
        grw_sbs_clone(document.querySelector('.grw-slider-br:last-child'));
        grw_sbs_keyup();
    };
}

function grw_sbs_parse(sbs) {
    var brs,
        select = document.querySelector('.grw-slider-br select'),
        range = document.querySelector('.grw-slider-br input[type="range"]'),
        span = document.querySelector('.grw-slider-br input[type="range"] + span');

    if (sbs && (brs = sbs.split(',')).length) {
        var br_first = brs.shift(),
            br_vals = br_first.split(':');
        select.value = br_vals[0].replace('px', '').trim();
        range.value = parseInt(br_vals[1]);
        span.innerHTML = br_vals[1];

        while (brs.length) {
            grw_sbs_clone(document.querySelector('.grw-slider-br:last-child'), brs.shift().split(':'));
        }
    }
}

function grw_sbs_clone(br, vals) {
    let clone = br.cloneNode(true),
        prevSelect = br.querySelector('select'),
        quest = clone.querySelector('.grw-quest'),
        select = clone.querySelector('select'),
        input = clone.querySelector('input[type="text"]')
        range = clone.querySelector('input[type="range"]'),
        span = clone.querySelector('input[type="range"] + span');

    clearTimeout(window.grw_sbt);

    if (select.options.length > prevSelect.selectedIndex + 1) {
        select.selectedIndex = prevSelect.selectedIndex + 1;
    }
    if (select.selectedIndex == 0) {
        select.selectedIndex = 1;
    }

    quest.innerHTML = '-';
    br.parentNode.appendChild(clone);

    if (vals) {
        select.value = vals[0];
        if (!select.value) {
            select.value = '';
            if (!input) {
                input = document.createElement('input');
                input.type = 'text';
                select.after(input);
            }
            input.value = vals[0];
            input.addEventListener('keyup', grw_sbs_keyup);
        } else if (input) {
            input.parentNode.removeChild(input);
        }
        range.value = vals[1];
        span.innerHTML = vals[1];
    }

    select.addEventListener('change', grw_sbs_keyup);
    range.addEventListener('input', grw_sbs_keyup);

    quest.onclick = function() {
        clone.parentNode.removeChild(clone);
        grw_sbs_keyup();
    };
}

function grw_sbs_keyup() {
    clearTimeout(window.grw_sbt);
    let vals = [], brs = document.querySelectorAll('.grw-slider-br');
    for (let i = 0; i < brs.length; i++) {
        let select = brs[i].querySelector('select'),
            input = brs[i].querySelector('input[type="text"]'),
            range = brs[i].querySelector('input[type="range"]');
            //inputs = brs[i].querySelectorAll('input,select');

        if (select.value == 'off') {
            rpi.Utils.rm(input);
            continue;
        } else if ((select.value || (input && input.value)) && range.value) {
            let reslt;
            if (select.value) {
                reslt = select.value;
                rpi.Utils.rm(input);
            } else {
                reslt = input.value;
            }
            vals.push([reslt, range.value].join(':'));
        } else if (!input) {
            let custom = document.createElement('input');
            custom.type = 'text';
            custom.addEventListener('keyup', grw_sbs_keyup);
            select.after(custom);
            custom.focus();
        }
    }
    const bp = vals.join(',');
    rpi.Instances[0].setBreakpoints(bp);
    grw_sbs_set(bp);
}

function grw_sbs_set(val) {
    let input = document.querySelector('input[name="slider_breakpoints"]');
    if (input.value != val) {
        input.value = val;
        window.grw_sbt = setTimeout(grw_serialize_connections, 3000);
    }
}