import id from './id';
import * as utils from './utils';
import { isWbContentModel } from './utils-api';

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
	return mw.config.get( 'wgServerName' );
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

/******* DEPENDENCIES *******/

export function getNamespaceDependencies( article, data ) {
	let dependencies = [];
	if ( utils.isEmpty( data ) ) return dependencies;
	if ( utils.isArray( data ) ) return data;

	// Set common dependencies
	if ( utils.isArray( data[ '*' ] ) ) {
		dependencies = dependencies.concat( data[ '*' ] );
	}

	// Set namespace-specific dependencies
	const namespace = article.getMW( 'title' )?.getNamespaceId();
	if ( utils.isArray( data[ namespace ] ) ) {
		dependencies = dependencies.concat( data[ namespace ] );
	}

	return dependencies;
}

/**
 * Gets the article dependencies.
 * @param {import('./Article').default} article
 * @param {JQuery<HTMLElement>} [$container]
 * @return {Array<string>}
 */
export function getDependencies( article, $container ) {
	let dependencies = [];

	// Page common dependencies
	const pageDependencies = id.config.dependencies.page;
	if ( pageDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, pageDependencies ),
		);
	}

	// Type-specific dependencies
	const typeDependencies = id.config.dependencies[ article.get( 'type' ) ];
	if ( typeDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, typeDependencies ),
		);
	}

	// Skin-specific dependencies
	const skinDependencies = id.config.dependencies.skins[ mw.config.get( 'skin' ) ];
	if ( skinDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, skinDependencies ),
		);
	}

	// Selector-specific dependencies
	if ( $container instanceof jQuery ) {
		dependencies = dependencies.concat(
			getSelectorDependencies( article, $container ),
		);
	}

	return dependencies;
}

function getSelectorDependencies( article, $container ) {
	let dependencies = [];
	id.config.dependencies.selectors.forEach( item => {
		const $nodes = $container.find( item.selector.join( ',' ) );
		if ( $nodes.length === 0 ) return;
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, item.dependencies ),
		);
	} );
	return dependencies;
}

export function getMessageDependencies( article ) {
	let dependencies = [];

	// Local article messages
	const localDependencies = id.config.dependencies.messages;
	if ( localDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, localDependencies ),
		);
	}

	// Foreign article messages
	if ( article.isForeign ) {
		const foreignDependencies = id.config.foreignDependencies.messages;
		if ( foreignDependencies ) {
			dependencies = dependencies.concat(
				getNamespaceDependencies( article, foreignDependencies ),
			);
		}
	}

	return dependencies;
}

/**
 * Gets the foreign article dependencies.
 * @param {import('./Article').default} article
 * @returns {Object<string, Array<string>>}
 */
export function getForeignDependencies( article ) {
	let modules = [];
	let styles = [];
	let links = [];

	const typeDependencies = id.config.foreignDependencies[ article.get( 'type' ) ];
	if ( typeDependencies ) {
		// Modules
		modules = modules.concat(
			getNamespaceDependencies( article, typeDependencies ),
		);

		// Styles only
		styles = styles.concat(
			getNamespaceDependencies( article, typeDependencies.styles ),
		);

		// Content model-specific dependencies
		if ( isWbContentModel( mw.config.get( 'wgPageContentModel' ) ) ) {
			const wikibaseDependencies = typeDependencies.wikibase;
			if ( wikibaseDependencies ) {
				// Modules
				modules = modules.concat(
					getNamespaceDependencies( article, wikibaseDependencies ),
				);

				// Styles only
				styles = styles.concat(
					wikibaseDependencies.styles.all,
					utils.isMF() ? wikibaseDependencies.styles.mobile : wikibaseDependencies.styles.desktop,
				);
			}
		}

		// Styles dependencies
		links = links.concat( getForeignStylesDependencies( article, typeDependencies.links ) );
	}

	return { modules, styles, links };
}

function getForeignStylesDependencies( article, data ) {
	let styles = [];
	if ( utils.isEmpty( data ) ) return styles;

	// Set common dependencies
	if ( utils.isArray( data[ '*' ] ) ) {
		styles = styles.concat(
			data[ '*' ].map( title => getStyleHref( article, title ) ),
		);
	}

	// Set namespace-specific dependencies
	const namespace = article.getMW( 'title' )?.getNamespaceId();
	if ( utils.isArray( data[ namespace ] ) ) {
		styles = styles.concat(
			data[ namespace ].map( title => getStyleHref( article, title ) ),
		);
	}

	return styles;
}

export function loadForeignDependencies( article, data ) {
	const dependencies = utils.getMissingDependencies( data );
	const hostname = article.get( 'hostname' );
	const action = mw.util.wikiScript( 'load' );
	const params = $.param( {
		modules: dependencies.join( '|' ),
		skin: mw.config.get( 'skin' ),
	} );

	mw.loader.load( `https://${ hostname }${ action }?${ params }` );
}

export function loadForeignStylesDependencies( article, data ) {
	const dependencies = utils.getMissingDependencies( data );
	const hostname = article.get( 'hostname' );
	const action = mw.util.wikiScript( 'load' );
	const params = $.param( {
		modules: dependencies.join( '|' ),
		only: 'styles',
		skin: mw.config.get( 'skin' ),
	} );

	mw.loader.load( `https://${ hostname }${ action }?${ params }`, 'text/css' );
}

/**
 * Appends given urls array as link tags to the head.
 * @param {Array<string>} urls
 * @returns {Array<HTMLLinkElement>|undefined}
 */
export function addLinkTags( urls ) {
	if ( utils.isEmpty( urls ) ) return;
	return urls.map( url => mw.loader.addLinkTag?.( url ) );
}

/**
 * Removes link tags from the head.
 * @param {Array<HTMLLinkElement>} tags
 */
export function removeLinkTags( tags ) {
	if ( utils.isEmpty( tags ) ) return;
	tags.forEach( tag => tag?.remove() );
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
	return wikilink
		.replace( '$1', attr )
		.replace( '$pref', prefix ? `${ prefix }:` : '' )
		.replace( '$href', options.href )
		.replace( '$msg', utils.msg( `copy-wikilink-${ options.type }` ) );
}

function getStyleHref( article, title ) {
	const href = mw.util.getUrl( title, { action: 'raw', ctype: 'text/css' } );
	return article.isForeign
		? getHrefAbsolute( article, href )
		: href;
}