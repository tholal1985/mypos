<?php
//Begin Really Simple Security session cookie settings
@ini_set('session.cookie_httponly', true);
@ini_set('session.cookie_secure', true);
@ini_set('session.use_only_cookies', true);
//END Really Simple Security cookie settings
//Begin Really Simple Security key
define('RSSSL_KEY', 'kCL9pTvpo85W5p5LcqCxMA7zXVOyRMxXMywZc8fkw9sKqjN0VR9h6UXhm7Rb66Hl');
//END Really Simple Security key

/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'kqjgjbmy_WPVZY');

/** Database username */
define('DB_USER', 'kqjgjbmy_WPVZY');

/** Database password */
define('DB_PASSWORD', '5kwvt.6.kQemamqm7');

/** Database hostname */
define('DB_HOST', 'localhost');

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY', '9ee8f5814b5fbf4893cf288c7e6891e9e0241a80e57138b0d1a72c251cce7e3c');
define('SECURE_AUTH_KEY', 'e5932ab518e8db1e08fb62c1fed4a068e80cf8b27d228f9ba6048df5fcc21c6b');
define('LOGGED_IN_KEY', 'ef0ddb3fa1b5fadee1366f016160d93502d66e8b51aa0ae8124e4b994fdb8095');
define('NONCE_KEY', 'cec4a91080527da2bb3b531df5f743512230d588876800b50530ce0c08482cfa');
define('AUTH_SALT', '6c11e915a4e4bd75b4fcd9a54beceac7846b23a2393ef41633cdb5554520685b');
define('SECURE_AUTH_SALT', '8df7c1b04aee76be769466093e02f5739735e59712d1128d260c4d7c8e5a733f');
define('LOGGED_IN_SALT', '25c94354c6f6d3eb56f042e71f92781e41fcb09363878a89fb98a3584858d3ae');
define('NONCE_SALT', 'c4ddb9c23459e13daf4c768d39e0416a3398d3dc49171618528a0cef0e121ed7');

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'sUZ_';
define('WP_CRON_LOCK_TIMEOUT', 120);
define('AUTOSAVE_INTERVAL', 300);
define('WP_POST_REVISIONS', 20);
define('EMPTY_TRASH_DAYS', 7);
define('WP_AUTO_UPDATE_CORE', true);

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
