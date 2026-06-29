/**
 * EXTENSION: WIKIBASE MEIDA INFO
 *
 * Restores file media info.
 * @see {@link https://www.mediawiki.org/wiki/Extension:WikibaseMediaInfo}
 */

import id from '../id';
import * as utils from '../utils';

const { h } = utils;

/**
 * Restores file media info.
 * @param {import('../Page').default} page
 */
function process( page ) {
	if ( !page || page.error || page.article.get( 'type' ) !== 'revision' ) return;

	page.nodes.$mediaInfoView = page.getBody().find( 'mediainfoview' );
	if ( page.nodes.$mediaInfoView.length === 0 ) return;

	const content = render( page.nodes.$mediaInfoView );
	if ( content ) {
		utils.embed( content, page.nodes.$diffTitle, 'insertAfter' );
	}
}

/**
 * Renders tab index layout and embeds media info content.
 * @param {JQuery<HTMLElement>} $content
 * @returns {HTMLElement}
 */
function render( $content ) {
	const captionsTab = new OO.ui.TabPanelLayout( 'captions', {
		expanded: false,
		label: mw.msg( 'wikibasemediainfo-filepage-fileinfo-heading' ),
		$content: $content.find( 'mediainfoviewcaptions' ),
	} );

	const statementsTab = new OO.ui.TabPanelLayout( 'statements', {
		expanded: false,
		label: mw.msg( 'wikibasemediainfo-filepage-structured-data-heading' ),
		$content: $content.find( 'mediainfoviewstatements' ),
	} );

	const index = new OO.ui.IndexLayout( {
		expanded: false,
		framed: false,
	} );
	index.addTabPanels( [ captionsTab, statementsTab ], 0 );

	const panel = new OO.ui.PanelLayout( {
		expanded: false,
		framed: false,
		content: [ index ],
	} );

	// Render structure
	return h( 'div', { class: 'instantDiffs-extension-wikibaseMediaInfo' }, panel.$element.get( 0 ) );
}

mw.hook( `${ id.config.prefix }.page.renderSuccess` ).add( process );