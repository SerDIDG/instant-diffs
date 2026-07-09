/**
 * EXTENSION: PERSONAL DASHBOARD
 *
 * Adds support for links in the Review changes box.
 * @see {@link https://www.mediawiki.org/wiki/Extension:PersonalDashboard}
 */

import id from '../id';

/**
 * Process Personal Dashborad extension.
 */
function process() {
	const $context = $( '#personal-dashboard-root' );
	if ( !$context || $context.length === 0 ) return;

	const options = JSON.stringify( { setClasses: 'clear' } );
	$context
		.find( 'a.personal-dashboard-review-changes__card' )
		.attr( 'data-instantdiffs-link', 'event' )
		.attr( 'data-instantdiffs-options', options );

	mw.hook( `${ id.config.prefix }.process` ).fire( $context );
}

mw.hook( 'personaldashboard.recentactivity.listcard.loaded' ).add( process );