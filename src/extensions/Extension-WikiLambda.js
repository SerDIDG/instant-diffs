/**
 * EXTENSION: WIKILAMBDA
 *
 * Shown warning about WikiLambda app limitations.
 * Restores the WikiLambda app after the page is loaded.
 * @see {@link https://www.mediawiki.org/wiki/Extension:WikiLambda}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Restores WikiLambda extension.
 * @param {import('../Page').default} page
 */
function process( page ) {
	if ( !page || page.error || page.article.get( 'type' ) !== 'revision' ) return;

	switch ( page.type ) {
		case 'local':
			processLocal( page );
			break;
		case 'global':
		case 'foreign':
			processForeign( page );
			break;
	}
}

/**
 * Restores local WikiLambda extension.
 * @param {import('../Page').default} page
 */
function processLocal( page ) {
	page.nodes.$wikiLambdaApp = page.getBody().find( '#ext-wikilambda-app' );
	if ( page.nodes.$wikiLambdaApp.length === 0 ) return;

	// Restore WikiLambda app
	renderApp( page.nodes.$wikiLambdaApp );
}

/**
 * Renders the WikiLambda app.
 * Partially copied from the WikiLambda extension code:
 * @see {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/WikiLambda/+/refs/heads/master/resources/ext.wikilambda.app/index.js}
 * @param {JQuery} $container
 */
function renderApp( $container ) {
	if ( !$container || $container.length === 0 ) return;

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
 * @param {import('../Page').default} page
 */
function processForeign( page ) {
	page.nodes.$wikiLambdaApp = page.getBody().find( '#ext-wikilambda-app' );
	if ( page.nodes.$wikiLambdaApp.length === 0 ) return;

	// Render a notice about unsupported WikiLambda app
	const $content = $( utils.msgDom( 'dialog-notice-foreign-wikilambda' ) );
	page.renderWarning( {
		$content,
		type: 'notice',
		container: page.nodes.$wikiLambdaApp,
		insertMethod: 'insertBefore',
	} );

	// Hide unsupported or unnecessary elements
	page.getBody()
		.find( '#ext-wikilambda-app, .ext-wikilambda-view-nojsfallback' )
		.addClass( 'instantDiffs-hidden' );

}

mw.hook( `${ id.config.prefix }.page.ready` ).add( process );