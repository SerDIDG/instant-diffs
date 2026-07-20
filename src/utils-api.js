import id from './id';
import { isEmpty, isEmptyObject } from './utils';

/**
 * Checks if a title meets the Wikibase entity criteria
 * @param {string} title
 * @return {boolean}
 */
export function isProbablyWbTitle( title ) {
	return !isEmpty( title ) && /^[QPL][0-9]+$/.test( title );
}

/**
 * Checks if a content model meets the Wikibase entity criteria
 * @param {string} contentModel
 * @return {boolean}
 */
export function isWbContentModel( contentModel ) {
	return !isEmpty( contentModel ) && contentModel.includes( 'wikibase' );
}

/**
 * Checks if a content model is probably editable.
 * @param {string} contentModel
 * @return {boolean}
 */
export function isEditableContentModel( contentModel ) {
	return !id.config.nonEditableContentModels.includes( contentModel );
}

/**
 * Gets a label for the Wikibse EntitySchema from the display title.
 * @param {string} displayTitle
 * @return {string|*}
 */
export function getEntitySchemaLabel( displayTitle ) {
	const $html = $( displayTitle );
	return $html.find( '.entityschema-title-label' ).text();
}

/**
 * Gets a label for the Wikilambda entity from the page props.
 * @param {Object} props
 * @return {string|*}
 */
export function getWikilambdaLabel( props ) {
	return !isEmptyObject( props ) && (
		props[ `wikilambda-label-${ id.local.userLanguage }` ] ||
		props[ 'wikilambda-label-en' ]
	);
}

/**
 * Gets a label for the AbstractWiki entity from the page terms.
 * @param {Object} terms
 * @return {string|*}
 */
export function getAbstractWikiLabel( terms ) {
	return !isEmptyObject( terms ) && terms.label?.[ 0 ];
}

export function getQueryPageError( query ) {
	const page = query.pages?.[ 0 ];

	// Check for a specific error code
	const error = { type: 'revision' };
	if ( query.badrevids ) {
		error.code = 'badrevids';
	} else if ( query.badpageids ) {
		error.code = 'badpageids';
	} else if ( !page || page.missing ) {
		error.code = 'missing';
	} else if ( page.invalid ) {
		error.code = 'invalid';
		error.info = page.invalidreason;
	}

	if ( !error.code ) return;
	return error;
}

export function getQueryRevisionError( query ) {
	const page = query.pages?.[ 0 ];
	const revision = page?.revisions?.[ 0 ];

	// Check for a specific error code
	const error = { type: 'revision' };
	if ( query.badrevids ) {
		error.code = 'badrevids';
	} else if ( query.badpageids ) {
		error.code = 'badpageids';
	} else if ( !page || page.missing || !revision ) {
		error.code = 'missing';
	} else if ( page.invalid ) {
		error.code = 'invalid';
		error.info = page.invalidreason;
	}

	if ( !error.code ) return;
	return error;
}