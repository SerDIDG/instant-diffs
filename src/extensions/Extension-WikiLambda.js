/**
 * EXTENSION: WIKILAMBDA
 *
 * Shown warning about WikiLambda app limitations.
 * Restores the WikiLambda app after the page is loaded.
 * @see {@link https://www.mediawiki.org/wiki/Extension:WikiLambda}
 */

import * as utils from '../utils';

/**
 * Extension config.
 * @type {Record<string, any>}
 */
export const schema = {
	name: 'Extension-WikiLambda',
	enabled: true,
	hooks: {
		'page.ready': process,
	},
};

/**
 * Restores WikiLambda extension.
 * @param {import('../Page').Page.Any} page
 */
function process( page ) {
	if ( !page || page.error || page.article.get( 'type' ) !== 'revision' ) return;

	const $wikiLambdaApp = page.getBody().find( '#ext-wikilambda-app' );
	if ( $wikiLambdaApp.length === 0 ) return;

	switch ( page.type ) {
		case 'local':
			renderApp( page, $wikiLambdaApp );
			break;

		case 'global':
		case 'foreign':
			processForeign( page, $wikiLambdaApp );
			break;
	}
}

/**
 * Renders the WikiLambda app.
 * Partially copied from the WikiLambda extension code:
 * @see {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/WikiLambda/+/refs/heads/master/resources/ext.wikilambda.app/index.js}
 * @param {import('../Page').Page.Any} page
 * @param {JQuery<HTMLElement>} $container
 */
function renderApp( page, $container ) {
	mw.loader.using( [ '@wikimedia/codex', 'ext.wikilambda.app' ] ).then( require => {
		const { createMwApp } = require( 'vue' );
		const { createPinia } = require( 'pinia' );
		const { useMainStore, App } = require( 'ext.wikilambda.app' );

		// Conditionally mount App.vue:
		// If wgWikilambda config variable is available, we want to mount WikiLambda App.
		if ( mw.config.get( 'wgWikiLambda' ) ) {
			const pinia = createPinia();
			const store = useMainStore( pinia );
			window.vueInstance = createMwApp( Object.assign( {
				provide: () => ( {
					viewmode: store.getViewMode,
				} ),
			}, App ) )
				.use( pinia )
				.mount( $container.get( 0 ) );
		}
	} );
}

/**
 * Restores foreign WikiLambda extension.
 * @param {import('../Page').Page.Any} page
 * @param {JQuery<HTMLElement>} $container
 */
function processForeign( page, $container ) {
	// Render a notice about unsupported WikiLambda app
	const $content = $( utils.msgDom( 'dialog-notice-foreign-wikilambda' ) );
	page.renderWarning( {
		$content,
		type: 'notice',
		container: $container,
		insertMethod: 'insertBefore',
	} );

	// Hide unsupported or unnecessary elements
	page.getBody()
		.find( '#ext-wikilambda-app, .ext-wikilambda-view-nojsfallback' )
		.addClass( 'instantDiffs-hidden' );

}