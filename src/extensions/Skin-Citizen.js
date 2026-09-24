/**
 * SKIN: CITIZEN
 *
 * Add support for the "Last modified" link in the sidebar.
 * @see {@link https://www.mediawiki.org/wiki/Skin:Citizen}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Skin-Citizen',
	enabled: true,
	enabledCondition: () => mw.config.get( 'skin' ) === 'citizen',
	hooks: {
		'pageAdjustments': processPageAdjustments,
	},
};

const SIDEBAR_LASTMOD_SELECTORS = [
	'#citizen-sidebar-lastmod',      // @version 3.23
	'#citizen-page-aside-lastmod',   // @since 3.24
];

const SIDEBAR_LASTMOD_LINK_SELECTORS = [
	'#citizen-lastmod-relative',     // @version 3.23
	'.citizen-page-aside__link',   // @since 3.24
];

/**
 * Processes page.
 */
function processPageAdjustments() {
	const sidebarLastMod = document.querySelectorAll( SIDEBAR_LASTMOD_SELECTORS.join( ',' ) );
	sidebarLastMod.forEach( sidebar => {
		const link = sidebar.querySelector( SIDEBAR_LASTMOD_LINK_SELECTORS.join( ',' ) );
		if ( link ) {
			renderLastMod( link, sidebar );
		}
	} );
}

/**
 * Adds support for the "Last modified" link in the sidebar.
 * @param {HTMLAnchorElement} link
 * @param {HTMLElement} container
 */
function renderLastMod( link, container ) {
	try {
		const url = new URL( link.href );
		if ( utils.isEmpty( url.searchParams.get( 'diff' ) ) ) {
			url.searchParams.set( 'diff', 'cur' );
			link.href = url.href;
		}

		link.dataset.instantdiffsLink = 'event';
		link.dataset.instantdiffsOptions = JSON.stringify( { setClasses: 'always' } );

		mw.hook( `${ id.config.prefix }.process` ).fire( $( container ) );
	} catch ( error ) {
		utils.logError( 'Skin-Citizen', 'Unable to append the link action.', error );
	}
}