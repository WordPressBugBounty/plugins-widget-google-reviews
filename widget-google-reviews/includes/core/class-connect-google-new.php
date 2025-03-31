<?php

namespace WP_Rplg_Google_Reviews\Includes\Core;

class Connect_Google_New {

    const FIELDS = ['id', 'displayName', 'photos', 'googleMapsUri', 'websiteUri', 'formattedAddress', 'rating', 'userRatingCount', 'reviews'];
    const ISOTIME_9D_REGEXP = '/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.(\d{9})Z/';

    private $helper;

    public function __construct(Connect_Helper $helper) {
        $this->helper = $helper;
    }

    public function call_google($id, $google_api_key, $lang, $local_img) {
        $url = $this->api_url($id, $google_api_key, self::FIELDS, $lang);
        $res = wp_remote_get($url);
        $body = wp_remote_retrieve_body($res);
        $body_json = json_decode($body);

        if (!$body_json) {
            $result = $body_json;
            $status = 'failed';
        } elseif (isset($body_json->error)) {
            $result = array('error_message' => $body_json->error->message);
            $status = 'failed';
        } elseif (!isset($body_json->rating)) {
            $result = array('error_message' => 'The place you are trying to connect to does not have a rating yet.');
            $status = 'failed';
        } else {
            $photo = $this->business_avatar($body_json, $google_api_key);
            $body_json->business_photo = $photo;

            $this->save_reviews($body_json, $local_img);

            $result = array(
                'id'      => $body_json->id,
                'name'    => $body_json->displayName->text,
                'photo'   => strlen($body_json->business_photo) ? $body_json->business_photo : GRW_GOOGLE_BIZ,
                'reviews' => $body_json->reviews
            );
            $status = 'success';
        }
        return compact('status', 'result');
    }

    public function refresh_reviews($id, $google_api_key, $lang = '', $local_img = 'false') {
        $url = $this->api_url($id, $google_api_key, self::FIELDS, $lang);

        $res = wp_remote_get($url);
        $body = wp_remote_retrieve_body($res);
        $body_json = json_decode($body);

        if ($body_json && isset($body_json->rating)) {
            $photo = $this->business_avatar($body_json, $google_api_key);
            $body_json->business_photo = $photo;

            $this->save_reviews($body_json, $local_img);
        }
    }

    function save_reviews($place, $local_img) {
        global $wpdb;

        $google_place_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM " . $wpdb->prefix . Database::BUSINESS_TABLE .
                " WHERE place_id = %s", $place->id
            )
        );

        // Insert or update Google place
        if ($google_place_id) {

            // Update Google place
            $update_params = array(
                'name'    => $place->displayName->text,
                'rating'  => $place->rating,
                'updated' => round(microtime(true) * 1000),
            );

            $review_count = isset($place->userRatingCount) ? $place->userRatingCount : 0;

            if ($review_count > 0) {
                $update_params['review_count'] = $review_count;
            }
            if (isset($place->business_photo) && strlen($place->business_photo) > 0) {
                $update_params['photo'] = $place->business_photo;
            }
            $wpdb->update($wpdb->prefix . Database::BUSINESS_TABLE, $update_params, array('ID' => $google_place_id));

            // Insert Google place rating stats
            $stats = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT rating, review_count FROM " . $wpdb->prefix . Database::STATS_TABLE .
                    " WHERE google_place_id = %d ORDER BY id DESC LIMIT 1", $google_place_id
                )
            );
            if (count($stats) > 0) {
                if ($stats[0]->rating != $place->rating || ($review_count > 0 && $stats[0]->review_count != $review_count)) {
                    $wpdb->insert($wpdb->prefix . Database::STATS_TABLE, array(
                        'google_place_id' => $google_place_id,
                        'time'            => time(),
                        'rating'          => $place->rating,
                        'review_count'    => $review_count
                    ));
                }
            } else {
                $wpdb->insert($wpdb->prefix . Database::STATS_TABLE, array(
                    'google_place_id' => $google_place_id,
                    'time'            => time(),
                    'rating'          => $place->rating,
                    'review_count'    => $review_count
                ));
            }

        } else {

            // Insert Google place
            $place_rating = isset($place->rating) ? $place->rating : null;
            $review_count = isset($place->userRatingCount) ?
                                $place->userRatingCount : (isset($place->reviews) ? count($place->reviews) : null);

            $wpdb->insert($wpdb->prefix . Database::BUSINESS_TABLE, array(
                'place_id'     => $place->id,
                'name'         => $place->displayName->text,
                'photo'        => $place->business_photo,
                'icon'         => null,
                'address'      => $place->formattedAddress,
                'rating'       => $place_rating,
                'url'          => isset($place->googleMapsUri) ? $place->googleMapsUri : null,
                'website'      => isset($place->websiteUri) ? $place->websiteUri : null,
                'review_count' => $review_count,
                'updated'      => round(microtime(true) * 1000)
            ));
            $google_place_id = $wpdb->insert_id;

            if ($place_rating > 0) {
                $wpdb->insert($wpdb->prefix . Database::STATS_TABLE, array(
                    'google_place_id' => $google_place_id,
                    'time'            => time(),
                    'rating'          => $place_rating,
                    'review_count'    => $review_count
                ));
            }
        }

        // Insert or update Google reviews
        if ($place->reviews) {

            $reviews = $place->reviews;

            foreach ($reviews as $review) {
                $google_review_id = 0;

                $author_url = isset($review->authorAttribution) && strlen($review->authorAttribution->uri) > 0
                              ? $review->authorAttribution->uri : null;

                $author_name = isset($review->authorAttribution) && strlen($review->authorAttribution->displayName) > 0
                               ? $review->authorAttribution->displayName : null;


                $publishTime = $review->publishTime;

                // Special case for long (with 9 digits after T, for instance 2018-12-16T22:06:12.830950891Z) dates, unsupported in PHP < 8
                $matches = array();
                preg_match(self::ISOTIME_9D_REGEXP, $publishTime, $matches, PREG_OFFSET_CAPTURE);
                if (count($matches) > 1) {
                    $publishTime = str_replace($matches[1][0], substr($matches[1][0], 0, 6), $publishTime);
                }
                $review_time = date('U', strtotime($publishTime));

                if ($author_url) {
                    $where = " WHERE author_url = %s";
                    $where_params = array($review->authorAttribution->uri);
                } else {
                    $where = " WHERE time = %s";
                    $where_params = array($review_time);
                    if ($author_name) {
                        $where = $where . " AND author_name = %s";
                        array_push($where_params, $author_name);
                    }
                }

                $review_lang = null;
                if (isset($review->text) && isset($review->text->languageCode)) {
                    $review_lang = ($review->text->languageCode == 'en-US' ? 'en' : $review->text->languageCode);
                    if (strlen($review_lang) > 0) {
                        $where = $where . " AND language = %s";
                        array_push($where_params, $review_lang);
                    }
                }

                if ($google_place_id) {
                    $where = $where . " AND google_place_id = %d";
                    array_push($where_params, $google_place_id);
                }

                $google_review_id = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT id FROM " . $wpdb->prefix . Database::REVIEW_TABLE . $where, $where_params
                    )
                );

                $author_img = null;
                if (isset($review->authorAttribution) && isset($review->authorAttribution->photoUri)) {
                    if ($local_img === true || $local_img == 'true') {
                        $img_name = $place->id . '_' . md5($review->authorAttribution->photoUri);
                        $author_img = $this->helper->upload_image($review->authorAttribution->photoUri, $img_name);
                    } else {
                        $author_img = $review->authorAttribution->photoUri;
                    }
                }

                $review_text = isset($review->text) ? $review->text->text : null;

                if ($google_review_id) {
                    $update_params = array(
                        'rating' => $review->rating,
                        'text'   => $review_text
                    );
                    if ($author_img) {
                        $update_params['profile_photo_url'] = $author_img;
                    }
                    $wpdb->update($wpdb->prefix . Database::REVIEW_TABLE, $update_params, array('id' => $google_review_id));
                } else {
                    $wpdb->insert($wpdb->prefix . Database::REVIEW_TABLE, array(
                        'google_place_id'   => $google_place_id,
                        'rating'            => $review->rating,
                        'text'              => $review_text,
                        'time'              => $review_time,
                        'language'          => $review_lang,
                        'author_name'       => $author_name,
                        'author_url'        => $author_url,
                        'profile_photo_url' => $author_img
                    ));
                }
            }
        }
    }

    function api_url($placeid, $google_api_key, $fields = [], $reviews_lang = '') {
        $url = GRW_GOOGLE_PLACE_API_NEW . $placeid . '?fields=' . implode(',', $fields) . '&key=' . $google_api_key;
        if (strlen($reviews_lang) > 0) {
            $url = $url . '&languageCode=' . $reviews_lang;
        }
        return $url;
    }

    function business_avatar($body_json, $google_api_key) {
        if (isset($body_json->photos)) {
            $url = add_query_arg(
                array(
                    'maxWidthPx'  => '300',
                    'maxHeightPx' => '300',
                    'key' => $google_api_key
                ),
                'https://places.googleapis.com/v1/' . $body_json->photos[0]->name . '/media'
            );
            return $this->helper->upload_image($url, $body_json->id);
        }
        return null;
    }

    function place($id, $google_api_key) {
        $url = $this->api_url($id, $google_api_key, ['id', 'displayName', 'photos', 'googleMapsUri', 'websiteUri', 'rating', 'userRatingCount']);
        $res = wp_remote_get($url);
        $body = wp_remote_retrieve_body($res);
        $body_json = json_decode($body);

        if (!$body_json) {
            $result = $body_json;
            $status = 'failed';
        } elseif (isset($body_json->error)) {
            $result = array('error_message' => $body_json->error->message);
            $status = 'failed';
        } elseif (!isset($body_json->rating)) {
            $result = array('error_message' => 'The place you are trying to connect to does not have a rating yet.');
            $status = 'failed';
        } else {
            $photo = $this->business_avatar($body_json, $google_api_key);
            $body_json->business_photo = $photo;
            $body_json->name = $body_json->displayName->text;
            $body_json->url = $body_json->googleMapsUri;
            $body_json->website = isset($body_json->websiteUri) ? $body_json->websiteUri : null;
            $body_json->user_ratings_total = $body_json->userRatingCount;
            $result = $body_json;
            $status = 'success';
        }
        return compact('status', 'result');
    }
}