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

/**
 * Processes page.
 */
function processPageAdjustments() {
	const lastModLink = document.querySelector( '#citizen-lastmod-relative' );
	const lastModSidebar = document.querySelector( '#citizen-sidebar-lastmod' );
	if ( lastModLink && lastModSidebar ) {
		renderLastMod( lastModLink, lastModSidebar );
	}
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