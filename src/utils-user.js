import * as utils from './utils';

/**
 * Checks if the user registered.
 * @returns {boolean}
 */
export function isRegistered( user ) {
	if ( user === '<unregistered>' ) {
		return false;
	}
	return !mw.util.isIPAddress( user );
}

/**
 * Checks if the user a temporary user.
 * @returns {boolean}
 */
export function isTemporary( user ) {
	return 'isTemporaryUser' in mw.util ? mw.util.isTemporaryUser( user ) : false;
}

/**
 * Gets a date in the user format.
 * Uses "mediawiki.DateFormatter" module for formatting if exists, otherwise uses "date.toLocaleString".
 * @param {string|Date} date a date string, or a Date instance
 * @returns {string|undefined}
 */
export function getDate( date ) {
	if ( utils.isString( date ) ) {
		date = new Date( date );
	}
	if ( !( date instanceof Date ) ) return;

	const DateFormatter = utils.moduleRequire( 'mediawiki.DateFormatter' );
	return DateFormatter
		? DateFormatter.forUser().formatTimeAndDate( date )
		: date.toLocaleString();
}