/**
 * EXTENSION: PERSONAL DASHBOARD
 *
 * Adds support for links in the Review changes box.
 * @see {@link https://www.mediawiki.org/wiki/Extension:PersonalDashboard}
 */

import id from '../../id';
import * as utils from '../../utils';

import './styles.less';

/**
 * Extension configuration options.
 * @type {import('../../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Extension-PersonalDashboard',
	enabled: true,
	onReady: ready,
};

/**
 * Context elements selectors.
 * @type {string[]}
 */
const CONTEXT_SELECTORS = [
	'.personal-dashboard-viewport',
	'#personal-dashboard-teleport',
];

/**
 * Extension ready.
 */
function ready() {
	mw.hook( 'personaldashboard.recentactivity.listcard.loaded' ).add( process );
}

/**
 * Process Personal Dashboard extension.
 */
function process() {
	const $context = $( CONTEXT_SELECTORS.join( ',' ) );
	if ( !utils.isAllowed() || $context.length === 0 ) return;

	const options = JSON.stringify( { setClasses: 'clear' } );
	$context
		.find( 'a.personal-dashboard-review-changes__card__link' )
		.attr( 'data-instantdiffs-link', 'event' )
		.attr( 'data-instantdiffs-options', options );

	mw.hook( `${ id.config.prefix }.process` ).fire( $context );
}