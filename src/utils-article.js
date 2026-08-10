import id from './id';
import * as utils from './utils';

import Site from './Site';
import Article from './Article';
import settings from './settings';

/******* VALUES *******/

/**
 * Gets the article hostname.
 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
 * @returns {string}
 */
export function getHostname( articleOrHostname ) {
	const hostname = articleOrHostname instanceof Article ? articleOrHostname.get( 'hostname' ) : articleOrHostname;
	if ( !utils.isEmpty( hostname ) ) {
		return hostname;
	}
	return id.local.mwServerName;
}

export function getRevID( article ) {
	const values = article.getValues();

	if ( utils.isValidID( values.revid ) ) {
		return values.revid;
	}

	if ( values.type === 'revision' ) {
		if ( utils.isValidID( values.oldid ) ) {
			if ( !utils.isValidDir( values.direction ) || values.direction === 'cur' ) {
				return values.oldid;
			}
		}
	}

	if ( values.type === 'diff' ) {
		if ( utils.isValidID( values.oldid ) && utils.isValidID( values.diff ) ) {
			return Math.max( values.oldid, values.diff );
		} else if ( utils.isValidID( values.oldid ) ) {
			if ( !utils.isValidDir( values.diff ) || values.diff === 'prev' ) {
				return values.oldid;
			}
		} else if ( utils.isValidID( values.diff ) ) {
			if ( !utils.isValidDir( values.oldid ) || values.oldid === 'prev' ) {
				return values.diff;
			}
		}
	}

	return false;
}

/******* FORMAT HREFS *******/

/**
 * Gets formated wikilink, adds interwiki prefix if an article is foreign.
 * @param {import('./Article').default} article an Article instance
 * @returns {string} formated wikilink
 */
export async function getWikilink( article ) {
	const hrefOptions = {
		relative: false,
		hash: settings.get( 'linksHash' ),
		label: settings.get( 'linksLabel' ),
		minify: settings.get( 'linksFormat' ) === 'minify',
		special: settings.get( 'linksFormat' ) === 'special',
		wikilink: true,
		wikilinkPreset: settings.get( 'wikilinksFormat' ),
	};

	// Get project prefix for the foreign link
	if ( article.isForeign ) {
		const interwikiMap = await Site.getInterwikiMap();
		if ( interwikiMap ) {
			hrefOptions.interwiki = interwikiMap
				.filter( entry => entry.url.includes( article.getMW( 'serverName' ) ) )
				.reduce( ( accumulator, entry ) => !accumulator || accumulator.prefix.length > entry.prefix.length ? entry : accumulator );
		}
	}

	// Get wikilink
	return getHref( article, {}, hrefOptions );
}

/**
 * Gets Article's formatted url href.
 * @param {import('./Article').default|Object} article - Article instance
 * @param {Object} [articleParams]
 * @param {Object} [options]
 * @returns {string}
 */
export function getHref( article, articleParams, options ) {
	if ( !( article instanceof Article ) ) {
		article = new Article( article );
	}

	articleParams = { ...articleParams };

	options = {
		type: null,
		...options,
	};

	// Get a copy of the values
	const values = { ...article.getValues() };

	// Validate options
	if ( !options.type ) {
		if ( values.type === 'revision' && values.typeVariant === 'page' ) {
			options.type = 'page';
		} else {
			options.type = values.type;
		}
	}

	// Validate page params for diffs
	if ( options.type === 'diff' ) {
		if ( utils.isEmpty( values.diff ) && utils.isValidDir( values.direction ) ) {
			values.diff = values.direction;
		}

		if ( utils.isValidID( values.oldid ) && utils.isValidID( values.diff ) ) {
			articleParams.oldid = values.oldid;
			articleParams.diff = values.diff;
		} else if ( utils.isValidID( values.revid ) ) {
			articleParams.diff = values.revid;
		} else if ( utils.isValidID( values.oldid ) ) {
			if ( utils.isValidDir( values.diff ) && values.diff !== 'prev' ) {
				articleParams.oldid = values.oldid;
				articleParams.diff = values.diff;
			} else {
				articleParams.diff = values.oldid;
			}
		} else if ( utils.isValidID( values.diff ) ) {
			if ( utils.isValidDir( values.oldid ) && values.oldid !== 'prev' ) {
				articleParams.oldid = values.diff;
				articleParams.diff = values.oldid;
			} else {
				articleParams.diff = values.diff;
			}
		}
	}

	// Validate page params for revisions
	if ( options.type === 'revision' ) {
		if ( utils.isEmpty( values.direction ) && utils.isValidDir( values.diff ) ) {
			values.direction = values.diff;
		}

		if ( utils.isValidID( values.revid ) ) {
			articleParams.oldid = values.revid;
		} else if ( utils.isValidID( values.oldid ) ) {
			articleParams.oldid = values.oldid;
			if ( utils.isValidDir( values.direction ) && values.direction !== 'cur' ) {
				articleParams.direction = values.direction;
			}
		}
	}

	// Validate page params for pages
	if ( options.type === 'page' ) {
		articleParams.curid = values.curid;
	}

	return processHref( article, articleParams, options );
}

/**
 * Adds an absolute path from the article to the provided href.
 * @param {import('./Article').default} article an Article instance
 * @param {string} [href]
 * @returns {string|undefined}
 */
export function getHrefAbsolute( article, href ) {
	const mwEndPointUrl = article?.mw.endPointUrl || id.local.mwEndPointUrl;
	try {
		return new URL( href, mwEndPointUrl.origin ).toString();
	} catch {
		return href;
	}
}

function processHref( article, articleParams, options ) {
	articleParams = { ...articleParams };
	options = {
		type: 'diff',
		relative: true,
		hash: false,
		label: false,
		minify: false,
		interwiki: null,
		special: false,
		specialTitle: null,
		wikilink: false,
		wikilinkPreset: null,
		...options,
	};

	// Validate
	if ( utils.isForeign( article.get( 'hostname' ) ) ) {
		options.relative = false;
	}

	// Get link's endpoint url
	const mwEndPointUrl = article.getMW( 'endPointUrl' ) || id.local.mwEndPointUrl;

	// Get url with the current hostname
	let url;
	if ( options.special ) {
		if ( !options.specialTitle ) {
			options.preset = id.config.linkPresets.special;
			options.specialTitle = getSpecialTitle( article, articleParams, options );
		}
		url = new URL( mw.util.getUrl( options.specialTitle ), mwEndPointUrl.origin );
	} else if ( !utils.isEmpty( article.get( 'title' ) ) ) {
		url = new URL( mw.util.getUrl( article.get( 'title' ), articleParams ), mwEndPointUrl.origin );
	} else {
		url = new URL( mwEndPointUrl );
		url.search = new URLSearchParams( articleParams ).toString();
	}

	// Add hash
	if ( options.hash ) {
		const hash = options.hash === 'hash' ? article.get( 'hash' ) : article.get( 'section' );
		const hashEncoded = !utils.isEmpty( hash ) && mw.util.escapeIdForLink( hash );
		if ( hashEncoded ) {
			url.hash = `#${ hashEncoded }`;
		}
	}

	// Minify href
	if ( options.minify ) {
		url.pathname = '';
		url.hash = '';
		url.searchParams.delete( 'title' );
	}

	// Get relative or absolute href
	options.href = decodeURIComponent( options.relative ? ( url.pathname + url.search + url.hash ) : url.toString() );
	options.hrefHash = decodeURIComponent( url.hash );

	// Get wikilink
	if ( options.wikilink ) {
		options.preset = id.config.wikilinkPresets[ options.wikilinkPreset ] || id.config.wikilinkPresets.special;
		return getSpecialTitle( article, articleParams, options );
	}

	return options.href;
}

function getSpecialTitle( article, articleParams, options ) {
	articleParams = { ...articleParams };
	options = {
		type: 'diff',
		label: false,
		interwiki: null,
		href: null,
		hrefHash: null,
		preset: {},
		...options,
	};

	// Get diff \ oldid params
	let attr = null;
	if ( !utils.isEmpty( articleParams.oldid ) && !utils.isEmpty( articleParams.diff ) ) {
		attr = `${ articleParams.oldid }/${ articleParams.diff }`;
	} else if ( !utils.isEmpty( articleParams.oldid ) ) {
		attr = articleParams.oldid;
	} else if ( !utils.isEmpty( articleParams.diff ) ) {
		attr = articleParams.diff;
	} else if ( !utils.isEmpty( articleParams.curid ) ) {
		attr = articleParams.curid;
	}

	// Add hash
	if ( !utils.isEmpty( options.hrefHash ) ) {
		attr = `${ attr }${ options.hrefHash }`;
	}

	// Format wikilink
	const wikilink = options.preset[ options.type ];
	const prefix = options.interwiki?.prefix;
	return formatPattern( wikilink, {
		'1': attr,
		'pref': prefix ? `${ prefix }:` : '',
		'href': options.href,
		'msg': options.label ? utils.msg( `copy-wikilink-${ options.type }` ) : null,
	} );
}

function formatPattern( pattern, values ) {
	// resolve {#if:$var}content{/if} blocks first
	pattern = pattern.replace( /\{#if:\$(\w+)\}(.*?)\{\/if\}/g, ( _, name, content ) =>
		utils.isEmpty( values[ name ] ) ? '' : content,
	);

	// then substitute ${var} placeholders
	return pattern.replace( /\$\{(\w+)\}/g, ( _, name ) => values[ name ] ?? '' );
}