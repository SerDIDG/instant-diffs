import id from './id';
import * as utils from './utils';
import { getInterwikiMap } from './utils-api';

import Article from './Article';

export function getRevID( article ) {
    const values = article.getValues();

    if ( utils.isValidID( values.revid ) ) {
        return values.revid;
    }

    if ( values.type === 'revision' ) {
        if ( utils.isValidID( values.oldid ) ) {
            if ( !utils.isValidDir( values.direction ) || values.direction === 'prev' ) {
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

export function getDependencies( article ) {
    let dependencies = [];
    const typeDependencies = id.config.dependencies[ article.get( 'type' ) ];
    if ( typeDependencies ) {
        // Set common dependencies
        if ( typeDependencies[ '*' ] ) {
            dependencies = dependencies.concat( typeDependencies[ '*' ] );
        }

        // Set namespace-specific dependencies
        const namespace = article.getMW( 'title' )?.getNamespaceId();
        if ( typeDependencies[ namespace ] ) {
            dependencies = dependencies.concat( typeDependencies[ namespace ] );
        }
    }
    return dependencies;
}

/******* FORMAT HREFS *******/

/**
 * Gets formated wikilink, adds interwiki prefix if an article is foreign.
 * @param {import('./Article').default} article an Article instance
 * @returns {string} formated wikilink
 */
export async function getWikilink( article ) {
    const options = {
        relative: false,
        minify: utils.defaults( 'linksFormat' ) === 'minify',
        wikilink: true,
        wikilinkPreset: utils.defaults( 'wikilinksFormat' ),
    };

    // Get project prefix for the foreign link
    if ( article.isForeign ) {
        const interwikiMap = await getInterwikiMap();

        if ( interwikiMap ) {
            options.interwiki = interwikiMap
                .filter( entry => entry.url.includes( article.get( 'origin' ) ) )
                .reduce( ( accumulator, entry ) => !accumulator || accumulator.prefix.length > entry.prefix.length ? entry : accumulator );
        }
    }

    // Get wikilink
    return getHref( article, {}, options );
}

/**
 * Gets article's formatted url href.
 * @param {import('./Article').default} article an Article instance
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

    // Get copy of the values
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
            if ( utils.isValidDir( values.direction ) && values.direction === 'next' ) {
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
 * Adds absolute path from the article to provided href.
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
        wikilink: false,
        wikilinkPreset: null,
        ...options,
    };

    // Validate
    if ( window.location.origin !== article.get( 'origin' ) ) {
        options.relative = false;
    }

    // Get link's endpoint url
    const mwEndPointUrl = article.getMW( 'endPointUrl' ) || id.local.mwEndPointUrl;

    // Get url with the current origin
    let url;
    if ( !utils.isEmpty( article.get( 'title' ) ) ) {
        url = new URL( mw.util.getUrl( article.get( 'title' ), articleParams ), mwEndPointUrl.origin );
    } else {
        url = new URL( mwEndPointUrl );
        url.search = new URLSearchParams( articleParams ).toString();
    }

    // Add hash
    if ( options.hash && !utils.isEmpty( article.get( 'section' ) ) ) {
        url.hash = `#${ article.get( 'section' ) }`;
    }

    // Minify href
    if ( options.minify ) {
        url.pathname = '';
        url.hash = '';
        url.searchParams.delete( 'title' );
    }

    // Get relative or absolute href
    options.href = decodeURIComponent( options.relative ? ( url.pathname + url.search + url.hash ) : url.toString() );

    // Get wikilink
    if ( options.wikilink ) {
        return processWikilink( article, articleParams, options );
    }

    return options.href;
}

function processWikilink( article, articleParams, options ) {
    articleParams = { ...articleParams };
    options = {
        href: null,
        type: 'diff',
        minify: false,
        relative: true,
        interwiki: null,
        wikilink: true,
        wikilinkPreset: 'special',
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

    // Get preset
    const preset = id.config.wikilinkPresets[ options.wikilinkPreset ] || id.config.wikilinkPresets.special;

    // Format wikilink
    const wikilink = preset[ options.type ];
    const prefix = options.interwiki?.prefix;
    return wikilink
        .replace( '$1', attr )
        .replace( '$pref', prefix ? `${ prefix }:` : '' )
        .replace( '$href', options.href )
        .replace( '$msg', utils.msg( `copy-wikilink-${ options.type }` ) );
}