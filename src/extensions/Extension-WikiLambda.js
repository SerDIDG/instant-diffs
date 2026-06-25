/**
 * EXTENSION: WIKILAMBDA
 *
 * Shown warning about WikiLambda app limitations.
 * Restores the WikiLambda app after the page is loaded.
 * @see {@link https://www.mediawiki.org/wiki/Extension:WikiLambda}
 */

import id from '../id';
import * as utils from '../utils';
import { restoreWikiLambda } from '../utils-page';

/**
 * Process local WikiLambda extension.
 */
function process() {
	this.nodes.$wikiLambdaApp = this.nodes.$body.find( '#ext-wikilambda-app' );
	if ( this.nodes.$wikiLambdaApp.length === 0 ) return;

	// Render warning about WikiLambda app limitations
	const $content = $( utils.msgDom( 'dialog-notice-wikilambda' ) );
	this.renderWarning( {
		$content,
		type: 'notice',
		container: this.nodes.$wikiLambdaApp,
		insertMethod: 'insertBefore',
	} );

	// Restore WikiLambda app
	restoreWikiLambda( this.nodes.$wikiLambdaApp );
}

/**
 * Process foreign WikiLambda extension.
 */
function processForeign() {
	this.nodes.$wikiLambdaApp = this.nodes.$body.find( '#ext-wikilambda-app' );
	if ( this.nodes.$wikiLambdaApp.length === 0 ) return;

	// Render a notice about unsupported WikiLambda app
	const $content = $( utils.msgDom( 'dialog-notice-foreign-wikilambda' ) );
	this.renderWarning( {
		$content,
		type: 'notice',
		container: this.nodes.$wikiLambdaApp,
		insertMethod: 'insertBefore',
	} );

	// Hide unsupported or unnecessary elements
	this.nodes.$body
		.find( '#ext-wikilambda-app, .ext-wikilambda-view-nojsfallback' )
		.addClass( 'instantDiffs-hidden' );

}

mw.hook( `${ id.config.prefix }.page.ready` ).add(
	/**
	 * @param {import('../Page').default} page
	 */
	( page ) => {
		if ( !page || page.error || page.article.get( 'type' ) !== 'revision' ) return;

		switch ( page.type ) {
			case 'local':
				process.call( page );
				break;
			case 'global':
			case 'foreign':
				processForeign.call( page );
				break;
		}
	},
);