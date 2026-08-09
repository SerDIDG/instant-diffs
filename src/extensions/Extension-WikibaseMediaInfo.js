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
 * @param {import('../Page').Page.Any} page
 */
function process( page ) {
	if ( !page || page.article.get( 'type' ) !== 'revision' ) return;

	// Infuse server-rendered OOUI tab elements, if present,
	// otherwise render mediainfoview, if present.
	const $tabsContainer = page.getBody().find( '.wbmi-tabs-container' );
	if ( $tabsContainer.length > 0 ) {
		processTabs( page, $tabsContainer );
	} else {
		renderTabs( page );
	}
}

/**
 * Infuse PHP OOUI tabs.
 * @param {import('../Page').Page.Any} page
 * @param {JQuery<HTMLElement>} $tabsContainer
 */
function processTabs( page, $tabsContainer ) {
	// Modify ids of the PHP OOUI infuse elements so insure they do not repeat
	const html = $tabsContainer
		.html()
		.replace( /("|&quot;)ooui-php-(\d+)(?!-id)("|&quot;)/g, '$1ooui-php-$2-id$3' );
	$tabsContainer.html( html );

	// Infuse tabs when the page nodes finalized and appended into DOM
	page.on( 'ready', () => {
		const $tabs = $tabsContainer.find( '.wbmi-tabs' );
		if ( $tabs.length === 0 ) return;

		const tabs = OO.ui.infuse( $tabs );
		tabs.setTabPanel( 'wikiTextPlusCaptions' );
	} );
}

/**
 * Renders tab index layout and embeds media info content.
 * @param {import('../Page').Page.Any} page
 */
function renderTabs( page ) {
	const $mediaInfoView = page.getBody().find( 'mediainfoview' );
	if ( $mediaInfoView.length === 0 ) return;

	const captionsTab = new OO.ui.TabPanelLayout( 'captions', {
		expanded: false,
		label: mw.msg( 'wikibasemediainfo-filepage-fileinfo-heading' ),
		$content: $mediaInfoView.find( 'mediainfoviewcaptions' ),
	} );

	const statementsTab = new OO.ui.TabPanelLayout( 'statements', {
		expanded: false,
		label: mw.msg( 'wikibasemediainfo-filepage-structured-data-heading' ),
		$content: $mediaInfoView.find( 'mediainfoviewstatements' ),
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

	// Render amd embed structure
	const content = h( 'div', { class: 'instantDiffs-extension-wikibaseMediaInfo' }, panel.$element.get( 0 ) );
	utils.embed( content, page.nodes.$diffTitle, 'insertAfter' );
}

mw.hook( `${ id.config.prefix }.page.renderSuccess` ).add( process );