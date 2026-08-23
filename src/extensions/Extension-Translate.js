/**
 * EXTENSION: TRANSLATE
 *
 * Adds support for links in the changes block of the translation editor.
 * @see {@link https://www.mediawiki.org/wiki/Extension:Translate}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Extension-Translate',
	enabled: true,
	onReady: ready,
};

/**
 * Extension ready.
 */
function ready() {
	mw.hook( 'mw.translate.editor.showTranslationHelpers' ).add( process );
}

/**
 * Process Translation extension.
 * @param {Object} helpers
 * @param {JQuery<HTMLElement>} $context
 */
function process( helpers, $context ) {
	if ( !utils.isAllowed() || !$context ) return;

	$context
		.find( 'a.edit-summary-time' )
		.attr( 'data-instantdiffs-link', 'basic' );

	mw.hook( `${ id.config.prefix }.process` ).fire( $context );
}