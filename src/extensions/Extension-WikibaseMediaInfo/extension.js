/**
 * EXTENSION: WIKIBASE MEIDA INFO
 *
 * Restores file media info tabs.
 * @see {@link https://www.mediawiki.org/wiki/Extension:WikibaseMediaInfo}
 */

import * as utils from '../../utils';

import './styles.less';

const { h } = utils;

/**
 * Extension config.
 * @type {Record<string, any>}
 */
export const schema = {
	name: 'Extension-WikibaseMediaInfo',
	enabled: true,
	dependencies: {
		revision: {
			6: [                                                        // File:
				'wikibase.mediainfo.filepage.styles',
				'wikibase.mediainfo.statements',
				'wikibase.mediainfo.statements.styles',
			],
		},
		detailed: {
			6: [                                                        // File:
				'wikibase.mediainfo.uls',
			],
		},
		messages: {
			6: [                                                        // File:
				'wikibasemediainfo-filepage-fileinfo-heading',
				'wikibasemediainfo-filepage-structured-data-heading',
			],
		},
	},
	foreignDependencies: {
		revision: {
			styles: {
				6: [                                                    // File:
					'wikibase.mediainfo.filepage.styles',
					'wikibase.mediainfo.statements',
					'wikibase.mediainfo.statements.styles',
				],
			},
		},
	},
	hooks: {
		'page.renderSuccess': processPage,
	},
};

/**
 * Processes Page view.
 * @param {import('../Page').Page.Any} page
 */
function processPage( page ) {
	if ( !page || page.article.get( 'type' ) !== 'revision' ) return;

	// Infuse server-rendered OOUI tab elements, if present.
	const $tabsContainer = page.getBody().find( '.wbmi-tabs-container' );
	if ( $tabsContainer.length > 0 ) {
		return processTabs( page, $tabsContainer );
	}

	// Otherwise render mediainfoview, if present.
	const $mediaInfoView = page.getBody().find( 'mediainfoview' );
	if ( $mediaInfoView.length > 0 ) {
		return renderTabs( page, $mediaInfoView );
	}
}

/**
 * Infuse PHP OOUI tabs.
 * @param {import('../Page').Page.Any} page
 * @param {JQuery<HTMLElement>} $tabsContainer
 */
function processTabs( page, $tabsContainer ) {
	// Modify ids of the PHP OOUI infuse elements so ensure they do not repeat
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
 * @param {JQuery<HTMLElement>} $mediaInfoView
 */
function renderTabs( page, $mediaInfoView ) {
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

	// Render and embed structure
	const content = h( 'div', { class: 'instantDiffs-extension-wikibaseMediaInfo' }, panel.$element.get( 0 ) );
	utils.embed( content, page.nodes.$diffTitle, 'insertAfter' );
}