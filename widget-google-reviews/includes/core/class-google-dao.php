<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

class Google_Dao {

    private $helper;

    public function __construct(Connect_Helper $helper) {
        $this->helper = $helper;
    }

    public function save($place, $local_img) {
        global $wpdb;

        $log = array(round(microtime(true) * 1000));
        update_option('grw_last_error', '');

        $db_place_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM " . $wpdb->prefix . Database::BUSINESS_TABLE . " WHERE place_id = %s", $place->place_id
            )
        );

        // Insert or update Google place
        if ($db_place_id) {
            $this->update_place($place, $db_place_id, $log);
        } else {
            $db_place_id = $this->insert_place($place, $log);
        }
        $this->log_last_error($wpdb);

        // Insert or update Google reviews
        if (isset($place->reviews)) {

            $reviews = $place->reviews;

            foreach ($reviews as $review) {
                $db_review_id = 0;
                if (isset($review->author_url) && strlen($review->author_url) > 0) {
                    $where = " WHERE author_url = %s";
                    $where_params = array($review->author_url);
                } else {
                    $where = " WHERE time = %s";
                    $where_params = array($review->time);
                    if (isset($review->author_name) && strlen($review->author_name) > 0) {
                        $where = $where . " AND author_name = %s";
                        array_push($where_params, $review->author_name);
                    }
                }

                $review_lang = null;
                if (isset($review->language)) {
                    $review_lang = ($review->language == 'en-US' ? 'en' : $review->language);
                    if (strlen($review_lang) > 0) {
                        $where = $where . " AND language = %s";
                        array_push($where_params, $review_lang);
                    }
                }

                if ($db_place_id) {
                    $where = $where . " AND google_place_id = %d";
                    array_push($where_params, $db_place_id);
                }

                $sql = "SELECT id FROM " . $wpdb->prefix . Database::REVIEW_TABLE . $where;
                $db_review_id = $wpdb->get_var($wpdb->prepare($sql, $where_params));

                $author_img = null;
                if (isset($review->profile_photo_url)) {
                    if ($local_img === true || $local_img == 'true') {
                        $img_name = $place->place_id . '_' . md5($review->profile_photo_url);
                        $author_img = $this->helper->upload_image($review->profile_photo_url, $img_name);
                    } else {
                        $author_img = $review->profile_photo_url;
                    }
                }

                $images = null;
                if (isset($review->images) && count($review->images) > 0) {
                    $images = implode(';', $review->images);
                }

                $reply = null;
                $reply_time = null;
                if (isset($review->reply) && strlen($review->reply) > 0) {
                    $reply = $review->reply;
                    $reply_time = $review->reply_time;
                }

                if ($db_review_id) {
                    $this->update_review($review, $review_lang, $author_img, $images, $reply, $reply_time, $db_review_id, $log);
                } else {
                    $this->insert_review($review, $review_lang, $author_img, $images, $reply, $reply_time, $db_place_id, $log);
                }
                $this->log_last_error($wpdb);
            }
        }

        update_option('grw_save_log', implode('_', $log));
    }

    public function insert_place($place, &$log = []) {
        global $wpdb;

        // Insert Google place
        $pid = $place->place_id;
        $name = $place->name;
        $rating = isset($place->rating) ? $place->rating : null;
        $review_count = isset($place->user_ratings_total) ? $place->user_ratings_total : (isset($place->reviews) ? count($place->reviews) : null);

        $wpdb->insert($wpdb->prefix . Database::BUSINESS_TABLE, array(
            'place_id'     => $pid,
            'rating'       => $rating,
            'review_count' => $review_count,
            'name'         => $name,
            'photo'        => isset($place->business_photo) ? $place->business_photo : null,
            'url'          => isset($place->url) ? $place->url     : null,
            'website'      => isset($place->website) ? $place->website : null,
            'icon'         => isset($place->icon) ? $place->icon : null,
            'address'      => isset($place->formatted_address) ? $place->formatted_address : null,
            'updated'      => round(microtime(true) * 1000)
        ));
        $db_place_id = $wpdb->insert_id;

        array_push($log, 'ip[' . $pid . ',' . $name . ',' . $rating . ',' . $review_count . ']');

        if ($rating > 0) {
            $this->insert_stats($rating, $review_count, $db_place_id);
        }

        return $db_place_id;
    }

    public function update_place($place, $db_place_id, &$log = []) {
        global $wpdb;

        $name = $place->name;
        $rating = $place->rating;

        // Update Google place name and rating
        $update_params = array(
            'name'    => $name,
            'rating'  => $rating,
            'updated' => round(microtime(true) * 1000),
        );

        // Update total reviews
        $review_count = isset($place->user_ratings_total) ? $place->user_ratings_total : 0;
        if ($review_count > 0) {
            $update_params['review_count'] = $review_count;
        }

        // Update business photo
        if (isset($place->business_photo) && strlen($place->business_photo) > 0) {
            $update_params['photo'] = $place->business_photo;
        }

        $wpdb->update($wpdb->prefix . Database::BUSINESS_TABLE, $update_params, array('ID' => $db_place_id));

        array_push($log, 'up[' . $db_place_id . ',' . $name . ',' . $rating . ',' . $review_count . ']');

        $this->update_stats($place->rating, $review_count, $db_place_id);
    }

    public function update_stats($rating, $review_count, $db_place_id) {
        global $wpdb;

        // Insert Google place rating stats
        $stats = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT rating, review_count FROM " . $wpdb->prefix . Database::STATS_TABLE .
                " WHERE google_place_id = %d ORDER BY id DESC LIMIT 1", $db_place_id
            )
        );
        if (count($stats) > 0) {
            if ($stats[0]->rating != $rating || ($review_count > 0 && $stats[0]->review_count != $review_count)) {
                $this->insert_stats($rating, $review_count, $db_place_id);
            }
        } else {
            $this->insert_stats($rating, $review_count, $db_place_id);
        }
    }

    public function insert_stats($rating, $review_count, $db_place_id) {
        global $wpdb;

        $wpdb->insert($wpdb->prefix . Database::STATS_TABLE, array(
            'google_place_id' => $db_place_id,
            'time'            => time(),
            'rating'          => $rating,
            'review_count'    => $review_count
        ));
        $this->log_last_error($wpdb);
    }

    public function update_review($review, $review_lang, $author_img, $images, $reply, $reply_time, $db_review_id, &$log = []) {
        global $wpdb;

        $update_params = array(
            'rating' => $review->rating,
            'text'   => $review->text
        );
        if ($author_img) {
            $update_params['profile_photo_url'] = $author_img;
        }
        if ($images) {
            $update_params['images'] = $images;
        }
        if ($reply) {
            $update_params['reply'] = $reply;
            $update_params['reply_time'] = $reply_time;
        }
        $wpdb->update($wpdb->prefix . Database::REVIEW_TABLE, $update_params, array('id' => $db_review_id));

        array_push(
            $log,
            'ur[' .
                $db_review_id . ',' .
                $review->author_name . ',' .
                $review->rating . ',' .
                (isset($review->text) ? strlen($review->text) : '') . ',' .
                $review_lang .
            ']'
        );
    }

    public function insert_review($review, $review_lang, $author_img, $images, $reply, $reply_time, $db_place_id, &$log = []) {
        global $wpdb;

        $wpdb->insert($wpdb->prefix . Database::REVIEW_TABLE, array(
            'google_place_id'   => $db_place_id,
            'rating'            => $review->rating,
            'text'              => $review->text,
            'time'              => $review->time,
            'language'          => $review_lang,
            'author_name'       => $review->author_name,
            'author_url'        => isset($review->author_url) ? $review->author_url : null,
            'profile_photo_url' => $author_img,
            'images'            => $images,
            'reply'             => $reply,
            'reply_time'        => $reply_time
        ));

        array_push(
            $log,
            'ir[' .
                $review->author_name . ',' .
                $review->rating . ',' .
                (isset($review->text) ? strlen($review->text) : '') . ',' .
                $review_lang .
            ']'
        );
    }

    private function log_last_error($wpdb) {
        if (isset($wpdb->last_error) && strlen($wpdb->last_error) > 0) {
            $last_error = $wpdb->last_error;
            $opt = get_option('grw_last_error');
            if (empty($opt)) {
                $now = floor(microtime(true) * 1000);
                $opt = $now . ': ';
            }
            update_option('grw_last_error', $opt . $last_error . '; ');
        }
    }
}