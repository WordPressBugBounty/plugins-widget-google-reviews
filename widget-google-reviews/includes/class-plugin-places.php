<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;
use WP_Rplg_Google_Reviews\Includes\Core\Google_Dao;
use WP_Rplg_Google_Reviews\Includes\Core\Place_Settings;

class Plugin_Places {

    private $dao;

    public function __construct(Google_Dao $dao) {
        $this->dao = $dao;
    }

    public function register() {
        add_action('grw_admin_page_grw-places', array($this, 'render'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_media'));
        add_action('wp_ajax_grw_delete_place', array($this, 'delete_place'));
        add_action('wp_ajax_grw_place_settings', array($this, 'save_settings'));
        add_filter('wp_insert_post_data', array($this, 'drop_missing_places'), 10, 2);
    }

    // The photo picker of the settings form
    public function enqueue_media() {
        global $plugin_page;
        if ($plugin_page === 'grw-places') {
            wp_enqueue_media();
        }
    }

    public function fetch_pairs($place) {
        $local_img = Place_Settings::local_img($place, function() use ($place) { return $this->dao->has_local_images($place->id); });
        return array(array('lang' => $this->dao->place_lang($place), 'local_img' => $local_img));
    }

    public function connection($place) {
        return array(
            'id'       => $place->place_id,
            'lang'     => $this->dao->place_lang($place),
            'name'     => $place->name,
            'platform' => 'google',
        );
    }

    public function drop_missing_places($data, $postarr) {
        if ($data['post_type'] !== Post_Types::FEED_POST_TYPE || empty($data['post_content'])) {
            return $data;
        }
        $json = json_decode(wp_unslash($data['post_content']));
        if (!is_object($json) || empty($json->connections) || !is_array($json->connections)) {
            return $data;
        }
        $kept = array_values(array_filter($json->connections, function($conn) {
            if (!is_object($conn) || empty($conn->id) || (isset($conn->platform) && $conn->platform !== 'google')) {
                return true;
            }
            return (bool) $this->dao->get_place($conn->id);
        }));
        if (count($kept) !== count($json->connections)) {
            $json->connections = $kept;
            $data['post_content'] = wp_slash(wp_json_encode($json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        }
        return $data;
    }

    public function render() {
        $places = $this->dao->get_places();
        if (empty($places)) {
            ?><div class="grw-page-title">Places</div>
            <div class="grw-places-workspace">
                <p class="description">No business connected yet.</p>
                <p><a class="button button-primary" href="<?php echo esc_url(admin_url('admin.php?page=grw-widget')); ?>"><?php echo esc_html__('Create Widget', 'widget-google-reviews'); ?></a></p>
            </div><?php
            return;
        }

        $api_key = get_option('grw_google_api_key');
        $widget_url = admin_url('admin.php?page=grw-widget');
        $widgets = Core::place_connections();
        wp_nonce_field('grw_wpnonce', 'grw_nonce');
        ?>
        <div class="grw-page-title">
            Places
        </div>

        <div class="grw-places-workspace">
            <p class="description">
                <?php if (empty($api_key)) { ?>
                Without a Google API key, updating a place counts towards the free request limit.
                <?php } else { ?>
                With your Google API key reviews refresh automatically every day. Update a place here to fetch them right now.
                <?php } ?>
            </p>

            <table id="grw-places" class="wp-list-table widefat fixed striped grw-places" data-key="<?php echo empty($api_key) ? '0' : '1'; ?>" data-authcode="<?php echo esc_attr((string) get_option('grw_auth_code')); ?>">
                <thead>
                    <tr>
                        <th scope="col" class="column-primary grw-col-place">Place</th>
                        <th scope="col" class="grw-col-rating">Rating</th>
                        <th scope="col" class="grw-col-reviews">Reviews</th>
                        <th scope="col" class="grw-col-updated">Last updated</th>
                        <th scope="col" class="grw-col-actions"><span class="screen-reader-text">Actions</span></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($places as $place) {
                    $photo = Place_Settings::photo($place);
                    $google_photo = Place_Settings::google_photo($place);
                    $updated = (int) ($place->updated / 1000);
                    $rating = $place->rating > 0 ? number_format((float) $place->rating, 1, '.', '') : '';
                    $create_url = add_query_arg('grw_place_id', rawurlencode($place->place_id), $widget_url);
                    // The form opens on what the place does today, so its first Save changes nothing by itself.
                    $refresh = Place_Settings::refresh($place, isset($widgets[$place->place_id]) ? $widgets[$place->place_id]['conns'] : array());
                    $pair = $this->fetch_pairs($place)[0];
                    $custom_photo = empty($place->custom_photo) ? '' : $place->custom_photo;
                    ?>
                    <tr data-id="<?php echo esc_attr($place->id); ?>" data-pid="<?php echo esc_attr($place->place_id); ?>" data-url="<?php echo esc_attr((string) $place->map_url); ?>" data-conns="<?php echo esc_attr(wp_json_encode(array($pair))); ?>" data-name="<?php echo esc_attr($place->name); ?>" data-reviews="<?php echo esc_attr(number_format_i18n((int) $place->db_review_count)); ?>">
                        <td class="column-primary grw-col-place" data-colname="Place">
                            <div class="grw-place">
                                <img src="<?php echo esc_url($photo); ?>" alt="" width="40" height="40" loading="lazy" onerror="if(this.src!='<?php echo esc_url(GRW_GOOGLE_BIZ); ?>')this.src='<?php echo esc_url(GRW_GOOGLE_BIZ); ?>';">
                                <div class="grw-place-text">
                                    <strong class="grw-place-name"><?php echo esc_html($place->name); ?></strong>
                                    <span class="grw-place-address"><?php echo esc_html((string) $place->address); ?></span>
                                </div>
                            </div>
                            <button type="button" class="toggle-row"><span class="screen-reader-text">Show more details</span></button>
                        </td>
                        <td class="grw-col-rating" data-colname="Rating">
                            <?php if ($rating !== '') { ?>
                            <span class="rpi-stars" style="--rating:<?php echo esc_attr($rating); ?>"><?php echo esc_html($rating); ?></span>
                            <?php } else { ?>&mdash;<?php } ?>
                        </td>
                        <td class="grw-col-reviews" data-colname="Reviews">
                            <span class="grw-place-count"><?php echo number_format_i18n((int) $place->review_count); ?></span> on Google<br>
                            <span class="description"><?php echo number_format_i18n((int) $place->db_review_count); ?> in the plugin</span>
                        </td>
                        <td class="grw-col-updated grw-place-updated" data-colname="Last updated" title="<?php echo $updated ? esc_attr(wp_date(get_option('date_format') . ' ' . get_option('time_format'), $updated)) : ''; ?>">
                            <?php echo $updated ? esc_html(human_time_diff($updated) . ' ago') : '&mdash;'; ?>
                        </td>
                        <td class="grw-col-actions" data-colname="Actions">
                            <a href="#" class="grw-place-btn grw-place-settings" title="Settings" aria-label="Settings" aria-haspopup="dialog"><span class="dashicons dashicons-admin-generic"></span></a>
                            <a href="#" class="grw-place-btn grw-place-update" title="Update reviews" aria-label="Update reviews"><span class="dashicons dashicons-update"></span></a>
                            <a href="<?php echo esc_url($create_url); ?>" class="grw-place-btn" title="Create widget" aria-label="Create widget"><span class="dashicons dashicons-welcome-add-page"></span></a>
                            <a href="#" class="grw-place-btn grw-place-delete" title="Delete place" aria-label="Delete place"><span class="dashicons dashicons-trash"></span></a>
                            <form class="grw-place-fields" hidden>
                                <div class="grw-place-photo-field">
                                    <img src="<?php echo esc_url($photo); ?>" alt="" width="64" height="64" data-google="<?php echo esc_url($google_photo); ?>">
                                    <input type="hidden" name="photo" value="<?php echo esc_attr($custom_photo); ?>">
                                    <button type="button" class="button grw-place-photo-pick">Change photo</button>
                                    <button type="button" class="button-link grw-place-photo-google"<?php echo $custom_photo === '' ? ' hidden' : ''; ?>>Use Google's photo</button>
                                </div>
                                <label class="grw-place-option"><input type="checkbox" name="refresh"<?php checked($refresh); ?>><span><b>Auto-update reviews</b><small>Fetched from Google on the schedule in Settings; needs your API key.</small></span></label>
                                <label class="grw-place-option"><input type="checkbox" name="local_img"<?php checked($pair['local_img']); ?>><span><b>Store images on this site</b><small>Reviewer photos and review pictures are copied to your media library.</small></span></label>
                            </form>
                        </td>
                    </tr>
                <?php } ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function save_settings() {
        if (!current_user_can('manage_options')) {
            $this->fail('Permission denied.');
        }
        check_admin_referer('grw_wpnonce', 'grw_nonce');

        $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
        $place = $id ? $this->dao->get_place_by_id($id) : null;
        if (!$place) {
            $this->fail('Place not found.');
        }

        $raw_photo = isset($_POST['photo']) ? trim((string) wp_unslash($_POST['photo'])) : '';
        $photo = esc_url_raw($raw_photo, array('http', 'https'));
        if ($raw_photo !== '' && ($photo === '' || strlen($photo) > 255 || !preg_match('#^https?://#i', $raw_photo))) {
            $this->fail('The photo must be an http(s) link of up to 255 characters.');
        }

        // The place's own value exists only where the admin's choice differs from what its widgets say; else it keeps following them.
        $refresh = $this->flag('refresh');
        $conns = Core::place_connections()[$place->place_id]['conns'] ?? array();
        $saved = $this->dao->save_place_settings($id, array(
            'refresh'      => $refresh === (int) Place_Settings::by_widgets($conns) ? null : $refresh,
            'local_img'    => $this->flag('local_img'),
            'custom_photo' => $photo === '' ? null : $photo,
        ));
        if (!$saved) {
            $this->fail('Could not save the settings.');
        }
        Core::clear_feed_cache();

        $place = $this->dao->get_place_by_id($id);
        wp_send_json(array('status' => 'success', 'result' => array('photo' => Place_Settings::photo($place))));
    }

    private function flag($name) {
        return isset($_POST[$name]) && filter_var(wp_unslash($_POST[$name]), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    }

    private function fail($message) {
        wp_send_json(array('status' => 'failed', 'result' => array('error_message' => $message)));
    }

    public function delete_place() {
        if (!current_user_can('manage_options')) {
            die('The account you\'re logged in to doesn\'t have permission to access this page.');
        }
        check_admin_referer('grw_wpnonce', 'grw_nonce');

        $id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
        $deleted = $id > 0 && $this->dao->get_place_by_id($id) && $this->dao->delete_place($id);

        wp_send_json(array('status' => $deleted ? 'success' : 'failed', 'result' => array('id' => $id)));
    }
}
