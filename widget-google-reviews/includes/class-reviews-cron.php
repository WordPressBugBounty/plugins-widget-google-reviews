<?php

namespace WP_Rplg_Google_Reviews\Includes;

use WP_Rplg_Google_Reviews\Includes\Core\Core;
use WP_Rplg_Google_Reviews\Includes\Core\Google_Dao;
use WP_Rplg_Google_Reviews\Includes\Core\Google_Utils;
use WP_Rplg_Google_Reviews\Includes\Core\Place_Settings;

class Reviews_Cron {

    private $google_utils;
    private $dao;

    public function __construct(Google_Utils $google_utils, Google_Dao $dao) {
        $this->google_utils = $google_utils;
        $this->dao = $dao;
    }

    public function register() {
        add_filter('cron_schedules', array($this, 'add_schedules'));
        add_action('grw_revupd_schedule', array($this, 'update_schedule'));

        $this->activate();
    }

    public function activate() {
        $revupd_cron = get_option('grw_revupd_cron');
        $next_cron_run = wp_next_scheduled('grw_revupd_schedule');

        if ($revupd_cron !== '0' && !$next_cron_run) {
            $start_at = rand(0, 60 * 60 * 12);
            $freq = get_option('grw_freq_revs_upd', 'daily');
            wp_schedule_event(time(), $freq, 'grw_revupd_schedule');
        }
    }

    public function add_schedules($schedules = array()) {
		$schedules['weekly'] = array(
			'interval' => 60 * 60 * 24 * 7,
			'display'  => 'Once Weekly'
		);
        $schedules['fortnightly'] = array(
			'interval' => 60 * 60 * 24 * 14,
			'display'  => 'Every two weeks'
		);
        $schedules['monthly'] = array(
			'interval' => 60 * 60 * 24 * 30,
			'display'  => 'Once Monthly'
		);
		return $schedules;
	}

    public function update_schedule() {

        $start_time       = floor(microtime(true) * 1000);
        $end_time         = 0;
        $place_ids        = array();
        $denied           = '';
        $last             = 0;

        $widgets = Core::place_connections();

        // The places in id order, starting after the one the last run ended on; a denied answer stops the run before that place is marked, so it goes first next time.
        foreach ($this->dao->places_from((int) get_option('grw_revupd_cron_last')) as $place) {
            $own = isset($widgets[$place->place_id]) ? $widgets[$place->place_id] : array('feeds' => array(), 'conns' => array());

            if (Place_Settings::refresh($place, $own['conns'])) {
                $langs = array();
                foreach ($own['conns'] as $conn) {
                    $langs[isset($conn->lang) ? $conn->lang : ''] = true;
                }
                $local_img = function() use ($place, $own) {
                    $flags = array();
                    foreach ($own['conns'] as $conn) {
                        if (isset($conn->local_img)) $flags[] = Place_Settings::on($conn->local_img);
                    }
                    return $flags ? in_array(true, $flags, true) : $this->dao->has_local_images($place->id);
                };

                $res = null;
                foreach ($langs ? array_keys($langs) : array($this->dao->place_lang($place)) as $lang) {
                    $res = $this->google_utils->refresh($place, $lang, $local_img);
                    if ($res === null) break 2;
                    if (!empty($res['result']['denied'])) {
                        $denied = get_option('grw_google_api_error');
                        break 2;
                    }
                }
                if ($res !== null) {
                    array_push($place_ids, $place->id);
                    foreach ($own['feeds'] as $id) {
                        delete_transient('grw_feed_' . GRW_VERSION . '_' . $id . '_reviews');
                    }
                }
            }

            $last = $place->id;

            $end_time = floor(microtime(true) * 1000) - $start_time;
            if ($end_time > 5000) {
                break;
            }
        }

        if ($last) update_option('grw_revupd_cron_last', $last);

        // Log information
        $now = floor(microtime(true) * 1000);
        if ($denied) {
            $last_error = get_option('grw_last_error', '');
            update_option('grw_last_error', ($last_error ? $last_error : $now . ': ') . 'Reviews cron stopped, Google ' . str_replace("\n", ', ', $denied) . '; ');
        }
        update_option('grw_revupd_cron_log', 'Executed at ' . $now . ' in ' . $end_time . 'ms for places: ' . implode(", ", $place_ids));
    }

    public function deactivate() {
        $next_scheduled = wp_next_scheduled('grw_revupd_schedule');
        if ($next_scheduled) {
            wp_unschedule_event($next_scheduled, 'grw_revupd_schedule');
            update_option('grw_revupd_cron_timeout', '');
        }
    }
}