<?php

namespace WP_Rplg_Google_Reviews\Includes;

class View {

    const G_AVA_SIZE = 's120';

    public function render($feed_id, $businesses, $reviews, $options, $is_admin = false) {
        ob_start();

        $max_width = $options->max_width;
        if (is_numeric($max_width)) {
            $max_width = $max_width . 'px';
        }
        $max_height = $options->max_height;
        if (is_numeric($max_height)) {
            $max_height = $max_height . 'px';
        }

        $style = '';
        if (isset($max_width) && strlen($max_width) > 0) {
            $style .= 'width:' . $max_width . '!important;';
        }
        if (isset($max_height) && strlen($max_height) > 0) {
            $style .= 'height:' . $max_height . '!important;overflow-y:auto!important;';
        }
        if ($options->centered) {
            $style .= 'margin:0 auto!important;';
        }
        if (isset($options->style_vars) && strlen($options->style_vars) > 0) {
            $style .= $options->style_vars;
        }

        ?>
        <div class="wp-gr wpac<?php if ($options->dark_theme) { ?> wp-dark<?php } ?>"<?php if ($style) { ?> style="<?php echo $style;?>"<?php } ?> data-id="<?php echo $feed_id; ?>" data-layout="<?php echo $options->view_mode; ?>" data-exec="false" data-options='<?php echo $this->options($options); ?>'>
        <?php
        switch ($options->view_mode) {
            case 'slider':
                $this->render_slider($businesses, $reviews, $options, $is_admin);
                break;
            case 'grid':
                $this->render_grid($businesses, $reviews, $options, $is_admin);
                break;
            case 'list':
                $this->render_list($businesses, $reviews, $options, $is_admin);
                break;
            case 'rating':
                $this->render_rating($businesses, $reviews, $options);
                break;
            case 'badge':
                $this->render_badge($businesses, $reviews, $options);
                break;
            default:
                $this->render_list($businesses, $reviews, $options, $is_admin);
        }
        ?>
        </div>
        <?php
        return preg_replace('/[\n\r]|(>)\s+(<)/', '$1$2', ob_get_clean());
    }

    private function options($options) {
        return json_encode(
            array(
                'text_size' => $options->text_size,
                'trans'     => array(
                    'read more' => __('read more', 'widget-google-reviews')
                )
            )
        );
    }

    private function render_slider($businesses, $reviews, $options, $is_admin = false) {
        ?>
        <div class="grw-row grw-row-m" data-options='<?php
            echo json_encode(
                array(
                    'speed'       => $options->slider_speed ? $options->slider_speed : 3,
                    'autoplay'    => $options->slider_autoplay,
                    'mousestop'   => $options->slider_mousestop,
                    'breakpoints' => $options->slider_breakpoints
                )
            ); ?>'>
            <?php if (count($businesses) > 0) { ?>
            <div class="grw-header">
                <div class="grw-header-inner">
                    <div class="wp-google-place<?php if ($options->header_center) { ?> wp-place-center<?php } ?>">
                    <?php $this->grw_place(
                        $businesses[0]->rating,
                        $businesses[0],
                        $businesses[0]->photo,
                        $reviews,
                        $options,
                        true,
                        true
                    ); ?>
                    </div>
                </div>
            </div>
            <?php }
            $count = count($reviews);
            if ($count > 0) { ?>
            <div class="grw-content">
                <div class="grw-content-inner">
                    <?php if (!$options->slider_hide_prevnext) { ?>
                    <div class="grw-btns grw-prev" tabindex="0">
                        <svg viewBox="0 0 24 24" role="none"><path d="M14.6,18.4L8.3,12l6.4-6.4l0.7,0.7L9.7,12l5.6,5.6L14.6,18.4z"></path></svg>
                    </div>
                    <?php } ?>
                    <div class="grw-reviews" data-count="<?php echo $count; ?>" data-offset="<?php echo $count; ?>">
                        <?php foreach ($reviews as $review) { $this->grw_slider_review($review, false, $options, $is_admin); } ?>
                    </div>
                    <?php if (!$options->slider_hide_prevnext) { ?>
                    <div class="grw-btns grw-next" tabindex="0">
                        <svg viewBox="0 0 24 24" role="none"><path d="M9.4,18.4l-0.7-0.7l5.6-5.6L8.6,6.4l0.7-0.7l6.4,6.4L9.4,18.4z"></path></svg>
                    </div>
                    <?php } ?>
                    <?php if (!$options->slider_hide_dots) { ?><div class="rpi-dots-wrap"><div class="rpi-dots"></div></div><?php } ?>
                </div>

            </div>
            <?php } ?>
        </div>
        <?php $this->js_loader('grw_init', '\'slider\'');
    }

    private function render_grid($businesses, $reviews, $options, $is_admin = false) {
        if (count($businesses) > 0) { ?>
        <div class="grw-header<?php if ($options->header_center) { ?> wp-place-center<?php } ?>">
            <div class="grw-header-inner">
                <div class="wp-google-place">
                <?php $this->grw_place(
                    $businesses[0]->rating,
                    $businesses[0],
                    $businesses[0]->photo,
                    $reviews,
                    $options,
                    true,
                    true
                ); ?>
                </div>
            </div>
        </div>
        <?php } ?>
        <div class="grw-row grw-row-m" data-options='<?php
            echo json_encode(
                array(
                    'breakpoints' => $options->slider_breakpoints
                )
            ); ?>'>
            <?php if (count($reviews) > 0) { ?>
            <div class="grw-content">
                <div class="grw-content-inner">
                    <div class="grw-reviews">
                        <?php
                        $hr = false;
                        if (count($reviews) > 0) {
                            $i = 0;
                            foreach ($reviews as $review) {
                                if ($options->pagination > 0 && $options->pagination <= $i++) {
                                    $hr = true;
                                }
                                $this->grw_slider_review($review, $hr, $options, $is_admin);
                            }
                        }
                        ?>
                    </div>
                    <?php if ($options->pagination > 0 && $hr) { ?>
                    <a class="wp-google-url" href="#" onclick="return rplg_next_reviews.call(this, 'grw', <?php echo $options->pagination; ?>);">
                        <?php echo __('More reviews', 'widget-google-reviews'); ?>
                    </a>
                    <?php } ?>
                </div>
            </div>
            <?php } ?>
        </div>
        <?php $this->js_loader('grw_init', '\'grid\'');
    }

    private function render_list($businesses, $reviews, $options, $is_admin = false) {
        ?>
        <div class="wp-google-list">
            <?php foreach ($businesses as $business) { ?>
            <div class="wp-google-place<?php if ($options->header_center) { ?> wp-place-center<?php } ?>">
            <?php $this->grw_place(
                $business->rating,
                $business,
                $business->photo,
                $reviews,
                $options
            ); ?>
            </div>
            <?php }
            if (!$options->hide_reviews) { ?>
            <div class="wp-google-content-inner">
                <?php $this->grw_place_reviews($reviews, $options, $is_admin); ?>
            </div>
            <?php } ?>
        </div>
        <?php $this->js_loader('grw_init');
    }

    private function render_rating($businesses, $reviews, $options, $is_admin = false) {
        ?>
        <div class="wp-google-list">
            <?php foreach ($businesses as $business) { ?>
            <div class="wp-google-place<?php if ($options->header_center) { ?> wp-place-center<?php } ?>">
            <?php $this->grw_place(
                $business->rating,
                $business,
                $business->photo,
                $reviews,
                $options
            ); ?>
            </div>
            <?php } ?>
        </div>
        <?php $this->js_loader('grw_init');
    }

    private function render_badge($businesses, $reviews, $options) {
        ?>
        <script type="text/javascript">
        function grw_badge_init(el) {
            var btn = el.querySelector('.wp-google-badge'),
                form = el.querySelector('.wp-google-form');

            var wpac = document.createElement('div');
            wpac.className = 'wp-gr wpac';
            wpac.appendChild(form);
            document.body.appendChild(wpac);

            btn.onclick = function() {
                form.style.display='block';
            };
        }
        </script>
        <?php foreach ($businesses as $business) { ?>
        <div class="wp-google-badge<?php if ($options->view_mode == 'badge') { ?> wp-google-badge-fixed<?php } ?>">
            <div class="wp-google-border"></div>
            <div class="wp-google-badge-btn">
                <svg viewBox="0 0 512 512" height="44" width="44" role="none"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"/><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"/><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"/><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"/><path d="M20 20h472v472H20V20z"/></g></svg>
                <div class="wp-google-badge-score">
                    <div><?php echo __('Google Rating', 'widget-google-reviews'); ?></div>
                    <span class="wp-google-rating"><?php echo $business->rating; ?></span>
                    <span class="wp-google-stars"><?php $this->grw_stars($business->rating); ?></span>
                </div>
            </div>
        </div>
        <?php } ?>
        <div class="wp-google-form" style="display:none">
            <?php foreach ($businesses as $business) { ?>
            <div class="wp-google-head">
                <div class="wp-google-head-inner">
                    <?php
                    $this->grw_place(
                        $business->rating,
                        $business,
                        $business->photo,
                        $reviews,
                        $options,
                        false
                    ); ?>
                </div>
                <button class="wp-google-close" type="button" onclick="this.parentNode.parentNode.style.display='none'">×</button>
            </div>
            <?php } ?>
            <div class="wp-google-body"></div>
            <div class="wp-google-content">
                <div class="wp-google-content-inner">
                    <?php $this->grw_place_reviews($reviews, $options); ?>
                </div>
            </div>
            <?php $this->grw_powered(); ?>
        </div>
        <?php $this->js_loader('grw_badge_init');
    }

    function grw_place($rating, $place, $place_img, $reviews, $options, $show_powered = true, $show_writereview = false) {
        if (!$options->header_hide_photo) {
            $img_alt = $options->header_hide_name ? $place->name : ''; ?>
        <div class="wp-google-left">
            <img src="<?php echo $place_img; ?>" alt="<?php echo $img_alt; ?>" width="50" height="50">
        </div>
        <?php } ?>
        <div class="wp-google-right">
            <?php if (!$options->header_hide_name) { ?>
            <div class="wp-google-name">
                <?php $place_name_content = '<span>' . $place->name . '</span>';
                echo $this->grw_anchor($place->url, '', $place_name_content, $options, 'Google place profile'); ?>
            </div><?php
            }
            $this->grw_place_rating($rating, $place->review_count, $options->hide_based_on);
            if ($show_powered) {
                $this->grw_powered();
            }
            if (!$options->hide_writereview) { ?>
            <div class="wp-google-wr">
                <?php echo $this->grw_anchor(
                    'https://search.google.com/local/writereview?placeid=' . $place->id,
                    '',
                    __('review us on', 'widget-google-reviews') . '<svg viewBox="0 0 512 512" height="18" width="18" role="none"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"/><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"/><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"/><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"/><path d="M20 20h472v472H20V20z"/></g></svg>',
                    $options,
                    'Write a review',
                    'return rplg_leave_review_window.call(this)'
                ); ?>
            </div>
            <?php } ?>
        </div>
        <?php
    }

    function grw_place_rating($rating, $review_count, $hide_based_on) {
        ?>
        <div>
            <span class="wp-google-rating"><?php echo $rating; ?></span>
            <span class="wp-google-stars"><?php $this->grw_stars($rating); ?></span>
        </div>
        <?php if (!$hide_based_on && isset($review_count)) { ?>
        <div class="wp-google-based"><?php echo vsprintf(__('Based on %s reviews', 'widget-google-reviews'), $this->grw_array($review_count)); ?></div>
        <?php }
    }

    function grw_powered() {
        ?><div class="wp-google-powered">powered by <span><span style="color:#6186ec!important">G</span><span style="color:#cd523f!important">o</span><span style="color:#eabe43!important">o</span><span style="color:#6186ec!important">g</span><span style="color:#63a45d!important">l</span><span style="color:#cd523f!important">e</span></span></div><?php
    }

    function grw_place_reviews($reviews, $options, $is_admin = false) {
        ?>
        <div class="wp-google-reviews">
        <?php
        $place_id = null;
        $place_url = null;

        $hr = false;
        if (count($reviews) > 0) {
            $i = 0;
            foreach ($reviews as $review) {
                if (!$place_id) {
                    $place_id = $review->biz_id;
                    $place_url = $review->biz_url;
                }
                if ($options->pagination > 0 && $options->pagination <= $i++) {
                    $hr = true;
                }
                $this->grw_place_review($review, $hr, $options, $is_admin);
            }
        }
        ?>
        </div>
        <?php if ($options->pagination > 0 && $hr) { ?>
        <a class="wp-google-url" href="#" onclick="return rplg_next_reviews.call(this, 'wp-google', <?php echo $options->pagination; ?>);">
            <?php echo __('More reviews', 'widget-google-reviews'); ?>
        </a>
        <?php
        } else {
            $reviews_link = $options->google_def_rev_link ? $place_url : 'https://search.google.com/local/reviews?placeid=' . $place_id;
            $this->grw_anchor($reviews_link, 'wp-google-url', __('See All Reviews', 'widget-google-reviews'), $options, 'All reviews');
        }
    }

    function grw_place_review($review, $hr, $options, $is_admin = false) {
        ?>
        <div class="wp-google-review<?php if ($hr) { echo ' wp-google-hide'; } if ($is_admin && $review->hide != '') { echo ' wp-review-hidden'; } ?>">
            <?php if (!$options->hide_avatar) { ?>
            <div class="wp-google-left">
                <?php
                $default_avatar = GRW_ASSETS_URL . 'img/guest.png';
                if (strlen($review->author_avatar) > 0) {
                    $author_avatar = $review->author_avatar;
                } else {
                    $author_avatar = $default_avatar;
                }
                if (isset($options->reviewer_avatar_size)) {
                    $author_avatar = str_replace(self::G_AVA_SIZE, 's' . $options->reviewer_avatar_size, $author_avatar);
                    $default_avatar = str_replace(self::G_AVA_SIZE, 's' . $options->reviewer_avatar_size, $default_avatar);
                }
                $this->grw_image($author_avatar, '', $options->lazy_load_img, $default_avatar);
                ?>
            </div>
            <?php } ?>
            <div class="wp-google-right">
                <?php
                if (strlen($review->author_url) > 0) {
                    $this->grw_anchor($review->author_url, 'wp-google-name', $review->author_name, $options, 'Google user profile');
                } else {
                    if (strlen($review->author_name) > 0) {
                        $author_name = $review->author_name;
                    } else {
                        $author_name = __('Google User', 'widget-google-reviews');
                    }
                    ?><div class="wp-google-name"><?php echo $author_name; ?></div><?php
                }
                ?>
                <div class="wp-google-time" data-time="<?php echo $review->time; ?>"><?php echo gmdate("H:i d M y", $review->time); ?></div>
                <div class="wp-google-feedback">
                    <span class="wp-google-stars"><?php echo $this->grw_stars($review->rating); ?></span>
                    <span class="wp-google-text"><?php echo $review->text; ?></span>
                </div>
                <?php if ($is_admin) {
                    echo '<a href="#" class="wp-review-hide" data-id=' . $review->id . '>' . ($review->hide == '' ? 'Hide' : 'Show') . ' review</a>';
                } ?>
            </div>
        </div>
        <?php
    }

    function grw_slider_review($review, $hr, $options, $is_admin = false) {
        $addcls = $options->hide_backgnd ? "" : " grw-backgnd";
        $addcls .= $options->show_round ? " grw-round" : "";
        $addcls .= $options->show_shadow ? " grw-shadow" : "";
        ?>
        <div class="grw-review<?php if ($hr) { echo ' grw-hide'; } ?><?php if ($is_admin && $review->hide != '') { echo ' wp-review-hidden'; } ?>">
            <div class="grw-review-inner<?php echo $addcls; ?>">
                <div class="wp-google-left">
                    <?php
                    // Google reviewer avatar
                    $default_avatar = GRW_ASSETS_URL . 'img/guest.png';
                    if (strlen($review->author_avatar) > 0) {
                        $author_avatar = $review->author_avatar;
                    } else {
                        $author_avatar = $default_avatar;
                    }
                    if (isset($options->reviewer_avatar_size)) {
                        $author_avatar = str_replace(self::G_AVA_SIZE, 's' . $options->reviewer_avatar_size, $author_avatar);
                        $default_avatar = str_replace(self::G_AVA_SIZE, 's' . $options->reviewer_avatar_size, $default_avatar);
                    }
                    $this->grw_image($author_avatar, '', $options->lazy_load_img, $default_avatar);

                    // Google reviewer name
                    if (strlen($review->author_url) > 0) {
                        $this->grw_anchor($review->author_url, 'wp-google-name', $review->author_name, $options, 'Google user profile');
                    } else {
                        if (strlen($review->author_name) > 0) {
                            $author_name = $review->author_name;
                        } else {
                            $author_name = __('Google User', 'widget-google-reviews');
                        }
                        ?><div class="wp-google-name"><?php echo $author_name; ?></div><?php
                    }
                    ?>
                    <div class="wp-google-time" data-time="<?php echo $review->time; ?>"><?php echo gmdate("H:i d M y", $review->time); ?></div>
                </div>
                <div class="wp-google-stars"><?php echo $this->grw_stars($review->rating); ?></div>
                <div class="wp-google-wrap">
                    <div class="wp-google-feedback grw-scroll" <?php if (strlen($options->slider_text_height) > 0) {?> style="height:<?php echo $options->slider_text_height; ?>!important"<?php } ?>>
                        <?php if (strlen($review->text) > 0) { ?>
                        <span class="wp-google-text"><?php echo $review->text; ?></span>
                        <?php } ?>
                    </div><?php
                    if (isset($options->media) && $options->media && isset($review->images) && strlen($review->images) > 0) {
                    ?><div class="wp-google-img"><?php
                        $images = explode(';', $review->images);
                        foreach ($images as $img) {
                            ?><img class="rpi-thumb" src="<?php echo preg_replace('/(=.*)s\d{2,3}/', '$1s50', $img); ?>" onclick="rpi.Utils.popup(this.src.replace('=s50', '=s500'), 620, 500)" alt="" loading="lazy"><?php
                        }
                    ?></div><?php
                    }
                ?></div><?php
                if (isset($options->reply) && $options->reply && isset($review->reply) && strlen($review->reply) > 0) {
                ?><div class="wp-google-reply grw-scroll">
                    <div>
                        <span class="grw-b"><?php echo __('Response from the owner', 'widget-google-reviews'); ?></span>
                        <span class="wp-google-time" data-time="<?php echo $review->reply_time; ?>">
                            <?php echo gmdate("H:i d M y", $review->reply_time); ?>
                        </span>
                    </div>
                    <?php echo $review->reply; ?>
                </div><?php
                }
                if ($is_admin) {
                    echo '<a href="#" class="wp-review-hide" data-id=' . $review->id . '>' . ($review->hide == '' ? 'hide' : 'show') . ' review</a>';
                }
                ?><svg viewBox="0 0 512 512" height="18" width="18" role="none"><g fill="none" fill-rule="evenodd"><path d="M482.56 261.36c0-16.73-1.5-32.83-4.29-48.27H256v91.29h127.01c-5.47 29.5-22.1 54.49-47.09 71.23v59.21h76.27c44.63-41.09 70.37-101.59 70.37-173.46z" fill="#4285f4"/><path d="M256 492c63.72 0 117.14-21.13 156.19-57.18l-76.27-59.21c-21.13 14.16-48.17 22.53-79.92 22.53-61.47 0-113.49-41.51-132.05-97.3H45.1v61.15c38.83 77.13 118.64 130.01 210.9 130.01z" fill="#34a853"/><path d="M123.95 300.84c-4.72-14.16-7.4-29.29-7.4-44.84s2.68-30.68 7.4-44.84V150.01H45.1C29.12 181.87 20 217.92 20 256c0 38.08 9.12 74.13 25.1 105.99l78.85-61.15z" fill="#fbbc05"/><path d="M256 113.86c34.65 0 65.76 11.91 90.22 35.29l67.69-67.69C373.03 43.39 319.61 20 256 20c-92.25 0-172.07 52.89-210.9 130.01l78.85 61.15c18.56-55.78 70.59-97.3 132.05-97.3z" fill="#ea4335"/><path d="M20 20h472v472H20V20z"/></g></svg>
            </div>
        </div>
        <?php
    }

    function grw_stars($rating) {
        ?><span class="wp-stars"><?php
        for ($i = 0; $i < 5; $i++) {
            $score = $rating - $i;
            if ($score <= 0) {
                $this->star_o();
            } elseif ($score > 0 && $score < 1) {
                if ($score < 0.25) {
                    $this->star_o();
                } elseif ($score > 0.75) {
                    $this->star();
                } else {
                    $this->star_h();
                }
            } else {
                $this->star();
            }
        }
        ?></span><?php
    }

    function star() {
        ?><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792" role="none"><path d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#fb8e28"></path></svg></span><?php
    }

    function star_h() {
        ?><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792" role="none"><path d="M1250 957l257-250-356-52-66-10-30-60-159-322v963l59 31 318 168-60-355-12-66zm452-262l-363 354 86 500q5 33-6 51.5t-34 18.5q-17 0-40-12l-449-236-449 236q-23 12-40 12-23 0-34-18.5t-6-51.5l86-500-364-354q-32-32-23-59.5t54-34.5l502-73 225-455q20-41 49-41 28 0 49 41l225 455 502 73q45 7 54 34.5t-24 59.5z" fill="#fb8e28"></path></svg></span><?php
    }

    function star_o() {
        ?><span class="wp-star"><svg width="17" height="17" viewBox="0 0 1792 1792" role="none"><path d="M1201 1004l306-297-422-62-189-382-189 382-422 62 306 297-73 421 378-199 377 199zm527-357q0 22-26 48l-363 354 86 500q1 7 1 20 0 50-41 50-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z" fill="#ccc"></path></svg></span><?php
    }

    function grw_anchor($url, $class, $text, $options, $aria_label = '', $onclick = '') {
        echo '<a href="' . $url . '"' . ($class ? ' class="' . $class . '"' : '') . ($options->open_link ? ' target="_blank"' : '') . ' rel="' . ($options->nofollow_link ? 'nofollow ' : '') . 'noopener"' . (empty($aria_label) ? '' : ' aria-label="' . $aria_label . '"') . (empty($onclick) ? '' : ' onclick="' . $onclick . '"') . '>' . $text . '</a>';
    }

    function grw_image($src, $alt, $lazy, $def_ava = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', $atts = '') {
        ?><img src="<?php echo $src; ?>"<?php if ($lazy) { ?> loading="lazy"<?php } ?> class="grw-review-avatar" alt="<?php echo $alt; ?>" width="50" height="50" onerror="if(this.src!='<?php echo $def_ava; ?>')this.src='<?php echo $def_ava; ?>';" <?php echo $atts; ?>><?php
    }

    function js_loader($func, $data = '') {
        ?><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" onload="(function(el, data) {var f = function() { window.<?php echo $func; ?> ? <?php echo $func; ?>(el, data) : setTimeout(f, 400) }; f() })(this<?php if (strlen($data) > 0) { ?>, <?php echo str_replace('"', '\'', $data); } ?>);" width="1" height="1" style="display:none"><?php
    }

    function grw_array($params=null) {
        if (!is_array($params)) {
            $params = func_get_args();
            $params = array_slice($params, 0);
        }
        return $params;
    }
}
