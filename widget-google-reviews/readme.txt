=== Widgets for Google Reviews ===
Contributors: widgetpack
Tags: google, reviews, google reviews, google places reviews, rating
Requires at least: 3.0.1
Requires PHP: 7.2
Tested up to: 6.8
Stable tag: 6.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display up to 10 Google reviews in less than a minute. Continue collecting new reviews. No limits on connected places, widgets and shortcodes.

== Description ==

This plugin allows you to display up to 10 **Google Business reviews** and immediately show them on your WordPress website. The setup process is extremely simple and takes less than a minute.

There are no limits on how many Google business locations you can connect, and you can create as many widgets or shortcodes as needed to place reviews across your site. The plugin is easy to use and helps build trust with your visitors by displaying real Google reviews and your overall rating.

It’s already trusted by over a thousand WordPress users who use it daily to show their best customer feedback.

Want to see how it works? Watch the short demo below to see how quickly you can get started - or simply try it in the Live Preview.

[youtube https://www.youtube.com/watch?v=rMbwqCjDc80]

### ⚡ Plugin highlights

* **No limits on created widgets or shortcodes**
* **Show up to 10 Google reviews on initial setup**
* **Connect multiple Google business places**
* Display customer photos and owner replies inside reviews
* **Fully GDPR-compliant** — no external requests, all data loads from your own website
* **Automatically updates reviews** and ratings (when using your own API key)
* Option to hide reviews without text
* Responsive layouts: Slider, Grid, List, and Rating
* '**review us on Google**' button to collect new reviews
* Choose which reviews to display or hide
* Display reviews using shortcode, widget, block, or page builders (Elementor, Gutenberg, etc.)
* Upload a custom business photo
* Trim long reviews with a "read more" link
* Pagination support for List and Grid layouts
* Optimized for performance: small CSS/JS files and lazy loading
* **UI options to customize star, text, rating, and review colors**
* Additional styling with your own CSS
* Supports multiple languages
* Works with dark themes

⭐ [Live demo](https://richplugins.com/demos/)

== Screenshots ==

1. Google Reviews slider
2. Google Reviews list
3. Google Reviews widget
4. Google Reviews shortcode builder
5. Google Reviews sidebar widget

== Support ==

If you have any questions or need help using the plugin, we recommend the following steps:

1. Check the plugin's support page in your WordPress admin under "Google Reviews / Support".
2. Visit the [Support Forum](https://wordpress.org/support/plugin/widget-google-reviews/) to browse existing topics or ask a new question.

Email support in English is also available on weekdays: support@richplugins.com

== Installation ==

1. Upload the plugin files to the '/wp-content/plugins/' directory, or install the plugin through the WordPress Plugins screen directly.
2. Activate the plugin through the **Plugins** menu in the WordPress admin panel.

== Roadmap ==

= 6.1 =
* New feature: minimal rating layout (rating, stars and total reviews)
* New feature: possibility to hide (or delete) the connected place to exclude from Overview page
* Improve: adapt review connection modal for mobile devices
* Improve: predefined SVG DOM elements for better HTML size optimization
* Improve: add shortcode into each record in the widgets list

== Changelog ==

= 6.0 =
* Improve: Major refactoring of Google Connect API-related code
* Improve: Rename 'Update reviews daily' option to 'Include in auto-update'
* Improve: Added support for line breaks in review text
* Improve: Error descriptions when connecting a place
* Bugfix: Fixed center alignment of place header in Grid layout
* Some style improvements (avatars, stars, padding etc)

= 5.9.7 =
* Bugfix: fixed star rendering for ratings (for instance 4.9 now shows 5 full stars to match Google display style)
* Bugfix: fixed navigation inside the media lightbox when clicking on photos
* Bugfix: image size of reviewer avatars fixed
* Some style fixes

= 5.9.3 =
* Fixed update failed error (due function _load_textdomain was called incorrectly issue)

= 5.9.2 =
* Added lightbox modal for displaying review photos
* Removed tabindex=0 from review text element to prevent it from receiving keyboard focus
* Updated localization files
* Fixed some style issues

= 5.9.1 =
* Fixed Google reviews connection wizard dialog for mobile
* Update readme

= 5.9 =
* Added Google reviews connection wizard with autocomplete search, available for Google API key owners
* Minor style fixes

= 5.8 =
* Added photo in reviews
* Added owner replies in reviews
* Fixed database error for duplicate author_url
* Some minor styles improvements
* Updated to WordPress 6.8

= 5.7.1 =
* The option 'Use old Places API' is duplicated on the Advance tab

= 5.7 =
* Major bugfix for using new Places API from previous release
* Refresh reviews schedule supports both Places APIs (Old and New)

= 5.6 =
* New option to use the old Google Places API (for API keys created before March 1, 2025)
* Bugfix: JavaScript error in the review block
* Improved Slider layout styles

= 5.5 =
* New Google Places API integrated
* New option to control review update frequency (to support API key in free quota)
* Bugfix: load language in the init action

= 5.4 =
* Security fix: check wp nonce in rate us and overview ajax controllers

= 5.3 =
* Improve: new color options for business name, based on and powered messages
* Improve: reviews connection wizard has been adapted for table and mobile screens
* Improve: assets (js/css) updated for the recent changes
* Bugfix: undefined error if Slider layout has no reviews
* Minor style fixes
* Translation fixes

= 5.2 =
* Improve: custom number of columns for slider and grid
* Improve: changed 'powered by Google' logo from image to text
* Improve: made compatible with WAVE (Web Accessibility Evaluation)

= 5.1 =
* Improve: fixed issues reported on accessibe.com
* Bugfix: multiple widgets on same page did not work correctly
* Bugfix: color style options were not saved correctly
* Preparing for custom number slider and grid columns

= 5.0 =
* New option: short last name (show only first name and first letter of last name, GDPR)
* New option: hide reviews without text
* New option: reset to default style
* Bugfix: color style inputs editable

= 4.8.2 =
* Bugfix: slider prev and next buttons for RTL in the right directions
* Bugfix: Google reCaptcha fix in the connection popup
* Improve: added Arabic language

= 4.8.1 =
* Bugfix: very important bugfix, reduced author_url length to 127 characters coz it causes a database error for old MySQL versions
* Update to WordPress 6.7

= 4.8 =
* Improve: added WordPress preview feature
* Improve: new style option 'Reviews color'
* Improve: new style option 'Reviews text color'
* Bugfix: added nofollow attribute for 'review us on G' button

= 4.7 =
* Improve: new style option 'Button color'
* Bugfix: update JavaScript column and slider libraries

= 4.6 =
* Improve: new style option 'Stars color'
* Bugfix: Undefined Rating theme error on the reviews widget list page
* Bugfix: JavaScript error when dots are disabled and autoplay is enabled in the Slider theme

= 4.5 =
* Bugfix: incorrect initialization of the Slider theme in the previous release

= 4.4 =
* Improve: node-minify library updated for better assets (js & css) compression
* Bugfix: twice 'read more' link for List layout

= 4.3 =
* Improve: major slider rework
* Improve: different size of slider dots
* Improve: default slider speed has been reduced to 3 seconds
* New option: slider stops on mouse over
* Some bugs fixed

= 4.2 =
* Improve: added new layout Rating
* Improve: author URL is unique to avoid duplicate reviews
* Improve: added service button to remove duplicate reviews
* Improve: plugin's description
* Bugfix: document.referrer empty with protected Referrer-Policy header

= 4.1 =
* Improve: description & manuals
* Bugfix: Undefined property $error_message in class-settings-save.php(63)
* Update to WordPress 6.6

= 4.0 =
* Improve: added field for Google API key on the Support menu
* Improve: test Google API key when saving
* Improve: new screenshots for manual of finding Google Place ID
* Improve: support description update

= 3.9 =
* Improve: connect Google reviews by PID (Place ID), not only search term
* Improve: search Google place by non UTF-8 symbold (like ü)
* Improve: remove unused ajax grw_connect listener
* Improve: reduce fields for set_place query
* Improve: put new connected Google place to the top of connections list
* Improve: trying to get 10 reviews with own Google API key connection
* Improve: debug information moved to Support menu
* Bugfix: incorrect redirect after initial Google reviews connecting
* Bugfix: initial Google reviews connecting dialog not modal

= 3.8 =
* Update Google connection method
* Bugfix: used own Google API key (if saved) in the initial connect
* Clear unused code

= 3.7 =
* Initial Google connection page
* Performance improve: async CSS loading
* Update to WordPress 6.5

= 3.6.2 =
* Bugfix: js resize error if reviews is hidden for slider layout

= 3.6.1 =
* Bugfix: twice CSS file in Remove Unused CSS safelist for WP Rocket plugin

= 3.6 =
* Bugfix: fixed Remove Unused CSS safelist for WP Rocket plugin
* Improve: added Lithuanian language

= 3.5 =
* New Settings: load assets (js/css) by demand (only on pages where shortcodes/widgets are)
* Bugfix: remove double quotes in shortcode for ID attribute
* Some translation fixes

= 3.4 =
* Improve: added main CSS file to Remove Unused CSS safelist (WP Rocket plugin)
* Bugfix: incorrect width of a slider flex review container (grw-review)

= 3.3 =
* Improve: editor can moderate Google reviews
* Improve: 'review us on G' button style fixes
* Bugfix: wp_enqueue_script was called incorrectly
* Bugfix: rateus popup disappear after vote

= 3.2 =
* Security issue fix (escape shortcode attributes)
* Improve: database creation code
* Improve: error message when connecting empty Google place
* Bugfix: undefined property $rating/$reviews for empty Google place
* Bugfix: plugin updates when existing install
* Rename 'next reviews' to 'more reviews' text

= 3.1 =
* Bugfix: reviews disappear after slider return back
* Bugfix: reviews shift if slider resize

= 3.0 =
* Improve: New Grid layout
* Improve: new box shadow option
* Improve: new radius border option
* Improve: redesign Slider layout
* Improve: added default Google business photo
* Bugfix: Google place may be null in reviews connection
* Update to WordPress 6.4

= 2.9 =
* Simple Google reviews block implementation done
* Improve: added executed time in refresh schedule
* Bugfix: correct number of months on overview page
* Some translation fixes
* Style fixes

= 2.8 =
* Update to WordPress 6.3
* Improve: block connections and options sidebar
* Improve: request newest reviews in daily update schedule
* Bugfix: showing all empty reviews for empty place

= 2.7 =
* Improve: block starting
* Improve: Google Reviews connection wizard
* Improve: show reviews with empty language attribute
* Improve: default language if it's not select English

= 2.6.2 =
* Improve: possibility to get more than 5 reviews on initial connection
* Improve: hide service options on Settings page
* Bugfix: height fix for empty reviews in Slider theme
* Bugfix: Overview stats errors fixing for long periods
* Bugfix: escape encrypted API key in the debug information

= 2.6.1 =
* Bugfix: JavaScript errors on Overview page (incorrect stats time)

= 2.6 =
* Improve: slider auto-play option
* Bugfix: PHP 8.2 support
* Bugfix: encrypted Google API key saved
* Bugfix: correct calculation for overview usage stats
* Links fixed

= 2.5.1 =
* Improve: test mode for auto refresh reviews schedule
* Improve: auto enable reviews update schedule if Google API key saved
* Improve: Google connection handler redone to ajax
* Improve: overview page has usage stats
* Improve: overview page has a monthly period for stats graph
* Added promo coupon for the business version link
* Some CSS fixes

= 2.5 =
* Improve: autosave reviews feed by timeout
* Improve: contrast (Next Reviews link color)
* Bugfix: rating header photo centered
* CSS small fixes

= 2.4.2 =
* Improve: encrypted Google API key in debug information
* Improve: moved Google Places API connection service to richplugins domain
* Bugfix: PHP warning about empty icon for place
* Bugfix: wrong business_id field in the database

= 2.4.1 =
* Bugfix: language change error in the new Google connection wizard

= 2.4 =
* Improve: Google reviews connection wizard
* Bugfix: database warnings fixes

= 2.3 =
* Improve design: stars color, widget builder
* Bugfix: wrong argument in foreach loop
* Bugfix: Undefined property key in reviews connection
* Bugfix: Undefined property language in the reviews update schedule
* Update to WP 6.2

= 2.2.9 =
* Improve: new options (rating by center, hide biz photo, hide biz name)
* Improve: contrast (backgrounds and colors)
* Improve: added WP language in debug information
* Improve: SVG prev & next buttons in slider
* Translation fixes (for Slovenian, Dutch)

= 2.2.8 =
* Improve: GDPR full support
* Improve: save business and user images locally
* Improve: change language dynamically
* Improve: reconnect button
* Bugfix: clear cache in refresh reviews schedule
* Bugfix: business photo is not round
* Bugfix: floor round for time ago months

= 2.2.7 =
* Bugfix: Stop instant autoscroll of the slider
* Improve: business plugin description update

= 2.2.6 =
* Bugfix: undefined array key 'place_id'
* Bugfix: the query argument of wpdb::prepare() must have a placeholder
* Bugfix: empty feed in reviews update schedule
* Bugfix: some style fixes

= 2.2.5 =
* Improve: reviews update daily schedule
* Bugfix: slider lite correctly fit with one column layout
* Bugfix: CSS RTL rule fixes

= 2.2.4 =
* Bugfix related with the previous release

= 2.2.3 =
* Security: check admin role in widget create function
* Improve: initial Google reviews connection
* Improve: redirect to a widget builder page after plugin's activation
* Some language fixes

= 2.2.2 =
* New Overiew page
* Bugfix: slider lite resize
* Some translation fixes
* Update to WP 6.1

= 2.2.1 =
* Bugfix: Undefined property $hide_writereview
* Some translation fixes

= 2.2 =
* Feature: 'review us on G' button in the List layout
* Feature: option for hide 'review us on G' button
* Bugfix: remove scrollbar in FF browser
* Some translation fixes
* Some style fixes

= 2.1.9 =
* Update to WP 6.0
* Bugfix: null property error in the scroll event

= 2.1.8 =
* Improve: new slider button text 'review us on G'
* Improve: separate slider and common options in widget builder
* Improve: slider active dots blue color
* Bugfix: slider dots round

= 2.1.7 =
* Improve: slider hide prev & next buttons option
* Improve: slider hide dots option
* Bugfix: multiple duplicate of business photos
* Bugfix: duplicate reviews

= 2.1.6 =
* Bugfix: slider fixed with latest webkit
* Bugfix: wrong text domain for load_plugin_textdomain

= 2.1.5 =
* Improve: added updated timestamp in Google place table
* Bugfix: forced update old databases
* Bugfix: wrong text domain
* Bugfix: checking POST param (update_db_ver) in settings save
* Bugfix: nofollow & open new tab for Google place link

= 2.1.4 =
* New slider feature: speed option
* Slider responsive bug
* Translation fixes (for Dutch)

= 2.1.3 =
* New slider option: text height
* New slider option: hide border
* Added Latvian language
* Translation fixes
* Style fixes

= 2.1.2 =
* Translation fixes
* Style fixes

= 2.1.1 =
* Update to WP 5.9
* Improve: RTL support (for admin)
* Improve: some style fixes
* Small bug fixes

= 2.1.0 =
* Bugfix: broken the 'See All Reviews' link without header
* Bugfix: wrong language ISO codes for Chinese (correct zh and zh-Hant)

= 2.0.9 =
* Improve: added settings for manually db updates
* Bugfix: conflict with a business version
* Bugfix: broken the 'See All Reviews' link without header
* Bugfix: wrong language ISO codes for Chinese (correct zh and zh-Hant)

= 2.0.8 =
* Bugfix: js errors if reviews are hidden in the slider
* Bugfix: slider is not responsive on some wp themes
* Translation fixes

= 2.0.7 =
* Slider layout: bug and style fixes

= 2.0.6 =
* Great features - slider layout and 'Write a Review' button!

= 2.0.5 =
* Reassembled production assets (js, css)

= 2.0.4 =
* Bugfix: duplicate reviews for empty language
* Style fixes

= 2.0.3 =
* Ajax auto-save for widgets
* Small bug fixes

= 2.0.2 =
* Improve instantly Google reviews connection
* Separated assets to dist and src for speed up the loading
* Preparing a database for introducing rating & reviews stats
* Deleted unused JS libraries
* Dropped unused db columns
* Update support page

= 2.0.1 =
* Instantly Google reviews connecting
* Full Google reviews multi-language support
* Bug and style fixes

= 2.0 =
* Plugin keeps the widgets and shortcodes
* Reviews feed builder
* Separate menu in wp-admin
* Fully architecture redesign
* Bug fixes

= 1.9.9 =
* Bugfix: PHP 8 problem (vsprintf(): Argument #2 ($values) must be of type array)

= 1.9.8 =
* Improved usability
* Installation guide fixed
* Bugfix: __ function instead of grw_i

= 1.9.7 =
* Update to WordPress 5.8
* Update settings page and Full Installation Guide

= 1.9.6 =
* Little bugfix
* Removed external debug information

= 1.9.5 =
* Remove http in svg type

= 1.9.4 =
* Update to WordPress 5.7
* Improve: added Ukrainian language
* Bugfix: little fixes in Swedish translation

= 1.9.3 =
* Bugfix: powered by icon large width

= 1.9.2 =
* Updated welcome description
* Added hi-res powered by images
* Improve: RTL support
* Bugfix: business avatar shadow
* Bugfix: 'read more' supports UTF

= 1.9.1 =
* Small bugfix with a translations
* Update to WordPress 5.6

= 1.9 =
* Improve: Added Full Installation Guide
* Improve: Added Slovenian language
* Improve: Increased refresh reviews timeout
* Bugfix: Google default avatar quality is 128px

= 1.8.9 =
* Improve: Added Swedish language
* Bugfix: Google default avatar quality is 128px

= 1.8.8 =
* Update to WordPress 5.5
* Improve: Added Lao language
* Improve: Added Greek language
* Improve: Added Russian language

= 1.8.7 =
* Added text domain and path for localization
* Bugfix: W3C compatibility
* Bugfix: Some fixes for fr_FR locale

= 1.8.6 =
* Bugfix: create db fixes

= 1.8.5 =
* Improve: added reviews moderation
* Bugfix: some fixes with locales

= 1.8.4 =
* Bugfix: fatal error when reinstall from scratch
* Bugfix: little fixes for locales

= 1.8.3 =
* Improve: added new locale sk_SK
* Improve: added new locale de_AT
* Improve: update installation video, readme and screenshots
* Bugfix: Yoast XML plugin makes 'Class not found' error

= 1.8.2 =
* Improve: added 'Based on ... reviews' feature
* Improve: added hide reviews option

= 1.8.1 =
* Update to WordPress 5.3
* Improve: added dots for read more link
* Improve: added width, height, title for img elements (SEO)
* Improve: added rel="noopener" option
* Improve: added new locale cs_CZ

= 1.8 =
* Improve: added advance options panel
* Bugfix: 404 link to all reviews page for some places

= 1.7.9 =
* Bugfix: is_admin checks for notice

= 1.7.8 =
* Improve: shortcode support
* Improve: added new locale bg_BG
* Improve: admin notie
* Bugfix: undefined widget property in Elementor

= 1.7.7 =
* Bugfix: some style fixes

= 1.7.6 =
* Bugfix: fix French, Dutch and German translations

= 1.7.5 =
* Update to WordPress 5.2
* Bugfix: conflict with a Bootstrap css in the widget

= 1.7.4 =
* Improve: added auto schedule for refreshing Google reviews
* Improve: added new locale fi_FI
* Improve: added new locale he_IL

= 1.7.3 =
* Improve: reduce reviewer avatars size
* Improve: added option for image lazy loading

= 1.7.2 =
* Update readme and links to the business version

= 1.7.1 =
* Improve: added hook to enqueue scripts and styles

= 1.7 =
* Update to WordPress 5.1
* Bugfix: issue with an empty language

= 1.6.9 =
* Improve: 'read more' link feature
* Improve: direct link to reviews on Google map
* Improve: language support of Google reviews
* Improve: added centered option
* Improve: update widget design
* Improve: update setting page design

= 1.6.8 =
* Update plugin to WordPress 5.0
* Improve: added a default sorting by recent
* Improve: added a detailed instruction how to create a Google Places API key

= 1.6.7 =
* Bugfix: fixed the issues with working on site builders (SiteOrigin, Elementor, Beaver Builder and etc)
* Bugfix: aseerts loaded with plugin's version to uncached

= 1.6.5 =
* Bugfix: fill hash in reviews database

= 1.6.4 =
* Important note: Google Places API now returns reviews with anonymous authors, we added support of this
* Improve: widget works in any page builders (SiteOrigin, Elementor, Beaver Builder and etc.)

= 1.6.3 =
* Important note: Google has changed the Places API and now this is limited to 1 request per day for new accounts, we have changed the plugin according to this limitation
* Improve: added feature to upload custom place photo

= 1.6.2 =
* Bugfix: remove deprecated function create_function()

= 1.6.1 =
* Improve: support of SiteOrigin builder
* Bugfix: fix css classes for the setting page

= 1.6 =
* Feature: Added pagination
* Feature: Get business photo for place
* Feature: Added maximum width and height options
* Improve: Added compatibility with WP multisite
* Improve: Added checking of Google API key
* Bugfix: change DB.google_review.language size to 10 characters
* Bugfix: corrected time ago messages

= 1.5.9 =
* Fixed incorrect messages in the time library
* Added Italian language (it_IT)

= 1.5.8 =
* Improve: Added language setting
* Added Polish language (pl_PL)
* Added Portuguese language (pt_PT)
* Update plugin to WP 4.9

= 1.5.7 =
* Widget options description corrected
* Bugfix: widget options loop
* Added Danish language (da_DK)

= 1.5.6 =
* Tested up to WordPress 4.8
* Improve: change permission from activate_plugins to manage_options for the plugin's settings
* Bugfix: CURLOPT_FOLLOWLOCATION for curl used only with open_basedir and safe_mode disable
* Bugfix: cURL proxy fix

= 1.5.5 =
* Update description
* Bugfix: use default json_encode if it's possible

= 1.5.4 =
* Bugfix: badge, available for old versions, not clickable

= 1.5.3 =
* Bugfix: set charset collate for plugin's tables
* Improve: extract inline init script of widget to separate js file (rplg.js), common for rich plugins

= 1.5.2 =
* Full refactoring of widget code
* Bugfix: widget options check
* Bugfix: SSL unverify connection
* Bugfix: remove line breaks to prevent wrapped it by paragraph editor's plugins
* Added debug information

= 1.5.1 =
* Added Catalan language (ca)
* Added Spanish language (es_ES)
* Added Turkish language (tr_TR)

= 1.5 =
* Remove 'Live Support' tab from setting page
* Added instruction and video how to get Google Places API Key
* Added Dutch language (nl_NL)

= 1.49 =
* Bugfix: time-ago on English by default, update readme, added fr_FR locale

= 1.48 =
* Bugfix, update readme

= 1.47 =
* Added localization for German (de_DE)

= 1.46 =
* Bugfix: remove unused variable

= 1.45 =
* Bugfix: auto-updating existing place rating

= 1.44 =
* Update readme

= 1.43 =
* Bugfix, Added search by Google Place ID

= 1.42 =
* Bugfix: update path images in reviews helper

= 1.4 =
* Bugfix: update path images
