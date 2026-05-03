/**
 * SKIN: CITIZEN
 * @see {@link https://www.mediawiki.org/wiki/Skin:Citizen}
 */

import id from '../id';
import * as utils from '../utils';

mw.hook( 'wikipage.content' ).add( () => {
	if ( !utils.isAllowed() || mw.config.get( 'skin' ) !== 'citizen' ) return;

	/**
	 * Adds support for the "Last modified" link in the sidebar.
	 * @param {HTMLAnchorElement} link
	 * @param {HTMLElement} container
	 */
	const renderLastMod = ( link, container ) => {
		try {
			const url = new URL( link.href );
			if ( utils.isEmpty( url.searchParams.get( 'diff' ) ) ) {
				url.searchParams.set( 'diff', 'cur' );
				link.href = url.href;
			}

			link.dataset.instantdiffsLink = 'basic';
			link.dataset.instantdiffsOptions = JSON.stringify( {
				showLink: false,
				showPageLink: false,
				showAltTitle: true,
			} );

			mw.hook( `${ id.config.prefix }.process` ).fire( $( container ) );
		} catch ( error ) {
			utils.logException( 'Skin-Citizen', 'Unable to append the link action.', error );
		}
	};

	const lastModLink = document.querySelector( '#citizen-lastmod-relative' );
	const lastModSidebar = document.querySelector( '#citizen-sidebar-lastmod' );
	if ( lastModLink && lastModSidebar ) {
		renderLastMod( lastModLink, lastModSidebar );
	}
} );