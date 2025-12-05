import id from './id';
import * as utils from './utils';

const { h } = utils;

/**
 * Parses currentScript src href for the settings defaults.
 * @return {Object}
 */
export function getQueryDefaults() {
	const settings = utils.parseQuery( document.currentScript?.src )?.instantdiffs || {};
	for ( const [ key, value ] of Object.entries( settings ) ) {
		settings[ key ] = value === 'true' ? true : value === 'false' ? false : value;
	}
	return settings;
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