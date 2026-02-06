jQuery(document).ready(function($) {

    $('.grw-admin-page a.nav-tab').on('click', function(e)  {
        var $this = $(this), activeId = $this.attr('href');
        $(activeId).show().siblings('.tab-content').hide();
        $this.addClass('nav-tab-active').siblings().removeClass('nav-tab-active');
        e.preventDefault();
    });

    /**
     * Rate us feedback
     */
    var $rateus = $('#grw-rate_us');
    if ($rateus.length) {
        var $rateus_dlg = $('#grw-rate_us-feedback'),
            $rateus_stars = $('.rpi-star', $rateus_dlg);

        grw_svg_init();
        if (window.location.href.indexOf('grw_feed_id=') > -1 && !window['grw_rateus']) {
            $rateus.addClass('grw-flash-visible');
        }
        $('.rpi-star i', $rateus).click(function() {
            var rate = $(this).index() + 1;
            if (rate > 3) {
                $.post({
                    url      : ajaxurl,
                    type     : 'POST',
                    dataType : 'json',
                    data     : {
                        rate      : rate,
                        action    : 'grw_rateus_ajax',
                        grw_nonce : $('#grw_nonce').val()
                    },
                    success  : function(res) {
                        console.log(res);
                    }
                });
                var askUrl = /*(Math.random() * 1).toFixed(0) > 0 ?
                    'https://g.page/r/CZac_S7-Dh2NEBM/review' :*/
                    'https://wordpress.org/support/plugin/widget-google-reviews/reviews/?rate=' + rate + '#new-post';
                window.open(askUrl, '_blank');
                grw_rateus_close();
            } else {
                $rateus_stars.attr('data-rating', rate);
                $rateus_dlg.dialog({modal: true, width: '50%', maxWidth: '600px'});
                $('.ui-widget-overlay').bind('click', function() {
                    $rateus_dlg.dialog('close');
                });
            }
        });

        $('i', $rateus_stars).click(function() {
            $rateus_stars.attr('data-rating', $(this).index() + 1);
        });

        $('.grw-rate_us-cancel').click(function() {
            $rateus_dlg.dialog('close');
        });

        $('.grw-rate_us-send').click(function() {
            $.post({
                url      : ajaxurl,
                type     : 'POST',
                dataType : 'json',
                data     : {
                    rate      : $rateus_stars.attr('data-rating'),
                    email     : $('input', $rateus_dlg).val(),
                    msg       : $('textarea', $rateus_dlg).val(),
                    action    : 'grw_rateus_ajax_feedback',
                    grw_nonce : $('#grw_nonce').val()
                },
                success  : function(res) {
                    $rateus_dlg.dialog({'title': 'Feedback sent'})
                    $rateus_dlg.html('<b style="color:#4cc74b">Thank you for your feedback!<br>' +
                                     'We received it and will investigate your suggestions.</b>');

                    grw_rateus_close();
                    setTimeout(function() {
                        $rateus_dlg.fadeOut(500, function() { $rateus_dlg.dialog('close'); });
                    }, 1500);
                }
            });
        });

        function grw_rateus_close() {
            setTimeout(function() {
                $rateus.addClass('grw-flash-gout');
                $rateus.removeClass('grw-flash-visible');
                $rateus.removeClass('grw-flash-gout');
                window['grw_rateus'] = 1;
            }, 1000);
        }
    }

    /**
     * Overview page
     */
    var $overviewRating = $('#grw-overview-rating');
    if ($overviewRating.length) {

        var MONTHS = 6,
            $places  = $('#grw-overview-places'),
            $months  = $('#grw-overview-months'),
            $rating  = $('#grw-overview-rating'),
            $reviews = $('#grw-overview-reviews'),
            chart    = null;

        grw_svg_init();

        $places.change(function() {
            ajax(this.value);
        });

        $months.change(function() {
            MONTHS = this.value;
            ajax($places.val());
        });

        ajax(0, function(res) {
            /*
             * Places select filled
             */
            $.each(res.places, function(i, place) {
                $places.append($('<option>', {
                    value: place.id,
                    text : place.name
                }));
            });
        });

        function ajax(pid, cb) {
            var data = {
                action    : 'grw_overview_ajax',
                grw_nonce : jQuery('#grw_nonce').val()
            };

            if (pid) {
                data.place_id = pid;
            }
            jQuery.post({
                url      : ajaxurl,
                type     : 'POST',
                dataType : 'json',
                data     : data,
                success  : function(res) {

                    var place = res.places.length > 1 ? res.places.find(x => x.id == pid) : res.places[0];

                    /*
                     * Stats minmax grouping and calculate result
                     */
                    var stats_result = null;

                    if (res.stats_minmax.length) {

                        let minmax = {},
                            mintime = 0,
                            nowtime = (new Date().getTime() / 1000).toFixed(0);

                        for (let i = 0; i < res.stats_minmax.length; i++) {

                            let mm = res.stats_minmax[i],
                                gpid = mm.google_place_id;

                            mintime = !mintime || mm.time < mintime ? mm.time : mintime;

                            if (minmax[gpid]) {

                                minmax[gpid] = {
                                    time         : parseInt(nowtime - minmax[gpid].time),
                                    rating       : parseFloat((mm.rating - minmax[gpid].rating).toFixed(1)),
                                    review_count : parseInt(mm.review_count - minmax[gpid].review_count)
                                };

                                if (stats_result) {
                                    stats_result = {
                                        time         : minmax[gpid].time,
                                        rating       : stats_result.rating + minmax[gpid].rating,
                                        review_count : stats_result.review_count + minmax[gpid].review_count
                                    }
                                } else {
                                    stats_result = minmax[gpid];
                                }

                                delete minmax[gpid];

                            } else {
                                minmax[gpid] = {
                                    time         : mintime,
                                    rating       : mm.rating,
                                    review_count : mm.review_count
                                };
                            }

                        }
                    }

                    let $stats = $('#grw-overview-stats');
                    $stats.html('Not calculated yet');

                    if (stats_result) {
                        let sr = stats_result.rating, src = stats_result.review_count;
                        $stats.html(
                            '<div class="grw-overview-h">While using the plugin</div>' +
                            '<div>' +
                                'Usage time: ' +
                                '<span class="grw-stat-val grw-stat-up">' + grw_s2dmy(stats_result.time) + '</span>' +
                            '</div>' +
                            '<div>' +
                                'Rating up: ' +
                                '<span class="grw-stat-val grw-stat-' + (sr < 0 ? 'down' : (sr > 0 ? 'up' : '')) + '">' + sr + '</span>' +
                            '</div>' +
                            '<div>' +
                                'Reviews up: ' +
                                '<span class="grw-stat-val grw-stat-' + (src < 0 ? 'down' : (src > 0 ? 'up' : '')) + '">' + src + '</span>' +
                            '</div>'
                        );
                    }

                    /*
                     * Render rating
                     */
                    $rating.html(
                        '<div class="grw-overview-h">' + place.name + '</div>' +
                        '<span class="rpi-stars" style="--rpi-star-size:26px;--rating:' + res.rating + '">' + res.rating + '</span>' +
                        '<div class="wp-google-powered">Based on ' + res.review_count + ' reviews</div>' +

                        (place.updated ?
                        '<div class="wp-google-powered">Last updated: ' +
                            '<span class="wp-google-time">' +
                                rpi.Time.getTime(parseInt(place.updated), rpi.Utils.lang(), 'ago') +
                            '</span>' +
                        '</div>' : '')
                    );

                    /*
                     * Render reviews
                     */
                    const root = document.createElement('div');
                    const list = document.createElement('div');

                    const common = rpi.Common($reviews[0], {text_size: 50}, {
                        time     : 'wp-google-time',
                        text     : 'wp-google-text',
                        readmore : 'wp-more-toggle'
                    });

                    list.className = 'wp-google-reviews';
                    $.each(res.reviews, function(i, review) {
                        list.appendChild(grw_review(review));
                    });

                    root.className = 'wp-gr wpac';
                    root.appendChild(list);

                    $reviews.html('');
                    $reviews[0].appendChild(root);

                    common.init();

                    $('.wp-review-hide', $reviews).unbind('click').click(function() {
                        grw_review_hide_global($(this));
                        return false;
                    });

                    /*
                     * Render stats
                     */

                    // 1) Grouped by Google place ID
                    var gs = {};
                    for (var s = 0; s < res.stats.length; s++) {
                        var stat = res.stats[s],
                            gpi = stat.google_place_id;

                        gs[gpi] = gs[gpi] || [];
                        gs[gpi].push({
                            time: parseInt(stat.time),
                            rating: parseFloat(stat.rating),
                            review_count: parseInt(stat.review_count)
                        });
                    }

                    // 2) Calculate how many months needs
                    var period = parseInt((res.stats[0].time - res.stats[res.stats.length - 1].time) / (60 * 60 * 24 * 30)),
                        months = period > 4 ? MONTHS : (period || 1);

                    // 2) Calculate stats by months (last six)
                    var ms = {},
                        today = new Date();

                    for (var i = 0; i < months; i++) {
                        var startDay = new Date(today.getFullYear(), today.getMonth() - i, 1),
                            endTime  = new Date(today.getFullYear(), today.getMonth() + 1 - i, 0).getTime(),
                            month    = startDay.toLocaleString('default', {month: 'short'}) + ' ' + startDay.getFullYear().toString().slice(-2);

                        ms[month] = ms[month] || {};

                        for (g in gs) {
                            var j = 0, xx = gs[g];

                            do {
                                var stat = xx[j++],
                                    time = stat.time * 1000;

                                ms[month][g] = ms[month][g] || {};
                                ms[month][g].count = parseInt(stat.review_count);

                            } while(time > endTime && j < xx.length);
                        }
                    }

                    // 3) Summary and normalize
                    var cat = [], data = [], series = []; var ttt = {};
                    for (m in ms) {
                        var count = 0;
                        for (p in ms[m]) {
                            count += ms[m][p].count;

                            // --- TEMP ---
                            var pp = res.places.find(x => x.id == p)
                            ttt[pp.name] = ttt[pp.name] || {};
                            ttt[pp.name].data = ttt[pp.name].data || [];
                            ttt[pp.name].data.unshift(ms[m][p].count);
                            // --- TEMP ---

                        }
                        cat.unshift(m);
                        data.unshift(count);
                    }

                    // --- TEMP ---
                    for (tt in ttt) {
                        series.push({name: tt, data: ttt[tt].data});
                    }
                    // --- TEMP ---

                    // 4) Render chart
                    var options = {
                        series: [{
                            name: 'Reviews',
                            data: data
                        }],
                        chart: {
                            height: 350,
                            type: 'bar',
                            //stacked: true,
                        },
                        plotOptions: {
                            bar: {
                                dataLabels: {
                                    position: 'top', // top, center, bottom
                                },
                            }
                        },
                        dataLabels: {
                            enabled: true,
                            offsetY: -20,
                            style: {
                                fontSize: '12px',
                                colors: ["#304758"]
                            }
                        },
                        tooltip: {
                            enabled: true,
                            intersect: false,
                            custom: function() { return ''; }
                        },
                        xaxis: {
                            categories: cat,
                            axisBorder: {
                                show: false
                            },
                            axisTicks: {
                                show: false
                            },
                            tooltip: {
                                enabled: true
                            }
                        },
                        yaxis: {
                            axisBorder: {
                                show: false
                            },
                            axisTicks: {
                                show: false,
                            }
                        },
                        title: {
                            text: 'Monthly reviews count',
                            align: 'center',
                            style: {
                                color: '#444'
                            }
                        }
                    };

                    if (chart) {
                        chart.updateOptions({series: [{name: 'Reviews', data: data}], xaxis: {categories: cat}});
                    } else {
                        chart = new ApexCharts(document.querySelector('#chart'), options);
                        chart.render();
                    }

                    cb && cb(res);
                }
            });
        }
    }

});

function grw_svg_init() {
    var span = document.createElement('span');
    span.style.display = 'none';
    span.innerHTML = grw_svg();
    document.body.appendChild(span);
}

function grw_svg() {
    return '' +
    '<svg>' +
        '<defs>' +
            '<g id="rp-logo-g" height="44" width="44" fill="none" fill-rule="evenodd">' +
                '<path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"></path><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"></path><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"></path><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"></path><path d="M20 20h472v472H20V20z"></path>' +
            '</g>' +
        '</defs>' +
    '</svg>';
}

function grw_review(review) {
    const slg = 'wp-google';

    const root = document.createElement('div');
    root.className = slg + '-review' + (review.hide === '' ? '' : ' wp-review-hidden');
    root.dataset.rev = String(review.provider || '');

    const right = document.createElement('div');
    right.className = slg + '-right';
    root.appendChild(right);

    const lnk = document.createElement('a');
    lnk.className = slg + '-name';
    lnk.target = '_blank';
    lnk.rel = 'nofollow noopener';
    lnk.href = grw_safeUrl(review.author_url);
    lnk.textContent = review.author_name || '';
    right.appendChild(lnk);

    const time = document.createElement('div');
    time.className = slg + '-time';
    time.dataset.time = String(review.time || '');
    right.appendChild(time);

    const feedback = document.createElement('div');
    feedback.className = slg + '-feedback';
    right.appendChild(feedback);

    const stars = document.createElement('span');
    stars.className = 'rpi-stars';
    stars.style.setProperty('--rpi-star-size', '16px');
    stars.style.setProperty('--rating', review.rating);
    feedback.appendChild(stars);

    const text = document.createElement('span');
    text.className = slg + '-text';
    text.textContent = review.text;
    text.innerHTML = text.innerHTML.replace(/\n/g, '<br>');
    feedback.appendChild(text);

    const toggle = document.createElement('a');
    toggle.href = '#';
    toggle.className = 'wp-review-hide';
    toggle.dataset.id = String(review.id || '');
    toggle.textContent = (review.hide === '' ? 'Hide' : 'Show') + ' review';
    right.appendChild(toggle);

    return root;
}

function grw_safeUrl(url) {
    if (!url) return '#';
    url = String(url).trim();
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    return '#';
}

function grw_s2dmy(s) {
    let d = (s / (60 * 60 * 24)).toFixed(0);
    if (d > 30) {
        if (d > 365) {
            return Math.round(d / 365) + ' years';
        }
        return Math.round(d / 30) + ' months';
    }
    return d + ' days';
}