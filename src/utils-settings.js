import id from './id';
import * as utils from './utils';
import { schema } from './schema-settings';

const { h } = utils;

/**
 * Gets a list of settings options from the schema with enabled status.
 * @returns {Record<string, boolean>} Map of setting names to their enabled status
 * @example
 * // Returns: { enableHotkeys: true, showIcons: false, ... }
 */
export function getSchemaSettings() {
	const fields = Object.values( schema )
		.flatMap( tab => Object.entries( tab.fields ) );

	const entries = fields.map( ( [ name, field ] ) =>
		[ name, field.enabled ],
	);

	return Object.fromEntries( entries );
}

/**
 * Gets a list of settings defaults from the schema.
 * @returns {Record<string, *>} Map of setting names to their default values
 * @example
 * // Returns: { enableHotkeys: true, linksFormat: 'full', ... }
 */
export function getSchemaDefaults() {
	const fields = Object.values( schema )
		.flatMap( tab => Object.entries( tab.fields ) );

	const entries = fields.map( ( [ name, field ] ) =>
		[ name, field.default ],
	);

	return Object.fromEntries( entries );
}

/**
 * Parses currentScript src URL for the settings defaults from query parameters.
 * @returns {Record<string, *>} Map of setting names to their values from URL query
 * @example
 * // URL: script.js?instantdiffs[standalone]=true
 * // Returns: { standalone: true }
 */
export function getQueryDefaults() {
	const settings = utils.parseQuery( document.currentScript?.src )?.instantdiffs || {};

	const entries = Object.entries( settings )
		.map( ( [ key, value ] ) => {
			// Convert string booleans to actual booleans
			const parsed = value === 'true' ? true : value === 'false' ? false : value;
			return [ key, parsed ];
		} );

	return Object.fromEntries( entries );
}

/**
 * Renders a success message box.
 * @param {Object} [params] configuration params
 * @param {Element|*} [params.content] message content
 * @param {string} [params.image] image file path
 * @param {string} [params.alt] image alternative text
 * @returns {Element}
 */
export function renderSuccessBox( params ) {
	params = {
		content: null,
		image: null,
		alt: null,
		...params,
	};

	return h( 'div.instantDiffs-success-box',
		h( 'img', {
			src: `${ id.config.commonsAssetsPath }${ params.image }`,
			alt: params.alt,
		} ),
		h( 'h5', params.content ),
	);
}