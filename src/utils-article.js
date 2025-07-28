import id from './id';
import * as utils from './utils';
import { getModuleExport } from './utils-oojs';

import Api from './Api';
import Article from './Article';

/******* VALUES *******/

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

/******* DEPENDENCIES *******/

/**
 * Gets an article dependencies.
 * @param {import('./Article').default} article
 * @return {Array<string>}
 */
export function getDependencies( article ) {
    let dependencies = [];

    const pageDependencies = id.config.dependencies.page;
    if ( pageDependencies ) {
        dependencies = dependencies.concat(
            getNamespaceDependencies( article, pageDependencies ),
        );
    }

    const typeDependencies = id.config.dependencies[ article.get( 'type' ) ];
    if ( typeDependencies ) {
        dependencies = dependencies.concat(
            getNamespaceDependencies( article, typeDependencies ),
        );
    }

    return dependencies;
}

function getNamespaceDependencies( article, data ) {
    let dependencies = [];

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
 * Gets a foreign article dependencies.
 * @param {import('./Article').default} article
 * @returns {Object<string, Array<string>>}
 */
export function getForeignDependencies( article ) {
    let styles = [];

    const typeDependencies = id.config.dependencies.foreign[ article.get( 'type' ) ];
    if ( typeDependencies ) {
        // Styles dependencies
        const stylesDependencies = typeDependencies.styles;
        if ( stylesDependencies ) {
            // Set common dependencies
            if ( utils.isArray( stylesDependencies[ '*' ] ) ) {
                styles = styles.concat(
                    stylesDependencies[ '*' ].map( title => getStyleHref( article, title ) ),
                );
            }

            // Set namespace-specific dependencies
            const namespace = article.getMW( 'title' )?.getNamespaceId();
            if ( utils.isArray( stylesDependencies[ namespace ] ) ) {
                styles = styles.concat(
                    stylesDependencies[ namespace ].map( title => getStyleHref( article, title ) ),
                );
            }
        }
    }

    return { styles };
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
    const options = {
        relative: false,
        minify: utils.defaults( 'linksFormat' ) === 'minify',
        wikilink: true,
        wikilinkPreset: utils.defaults( 'wikilinksFormat' ),
    };

    // Get project prefix for the foreign link
    if ( article.isForeign ) {
        const interwikiMap = await Api.getInterwikiMap();
        if ( interwikiMap ) {
            options.interwiki = interwikiMap
                .filter( entry => entry.url.includes( article.getMW( 'serverName' ) ) )
                .reduce( ( accumulator, entry ) => !accumulator || accumulator.prefix.length > entry.prefix.length ? entry : accumulator );
        }
    }

    // Get wikilink
    return getHref( article, {}, options );
}

/**
 * Gets article's formatted url href.
 * @param {import('./Article').default|Object} article an Article instance
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
    if ( utils.isForeign( article.get( 'hostname' ) ) ) {
        options.relative = false;
    }

    // Get link's endpoint url
    const mwEndPointUrl = article.getMW( 'endPointUrl' ) || id.local.mwEndPointUrl;

    // Get url with the current hostname
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

function getStyleHref( article, title ) {
    const href = mw.util.getUrl( title, { action: 'raw', ctype: 'text/css' } );
    return article.isForeign
        ? getHrefAbsolute( article, href )
        : href;
}

/******* WATCH \ UNWATCH *******/

/**
 * Adds or removes page from the watchlist.
 * @param {import('./Article').default} article an Article instance
 * @param {Function} callback
 */
export function setWatchStatus( article, callback ) {
    preloadWatchNotice( article );

    const preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );
    const notificationId = 'mw-watchlink-notification';

    const watched = article.get( 'watched' );
    const hostname = article.get( 'hostname' );
    const title = article.getMW( 'title' ).getPrefixedDb();

    const action = watched
        ? Api.unwatch( title, hostname )
        : Api.watch( title, preferredExpiry, hostname );

    return action
        .then( ( response ) => {
            showWatchNotice( article, response, callback );
        } )
        .fail( ( code, data ) => {
            // Format error message
            const $msg = Api.getApi().getErrorMessage( data );

            // Report to user about the error
            mw.notify( $msg, {
                tag: 'watch-self',
                type: 'error',
                id: notificationId,
            } );
        } );
}

/**
 * Preloads the watch star widget modules.
 * Partially copied from:
 * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/2a828f2e72a181665e1f627e2f737abb75b74eb9/resources/src/mediawiki.page.watch.ajax/watch-ajax.js#350}
 * @param {import('./Article').default} article an Article instance
 */
function preloadWatchNotice( article ) {
    const config = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' );
    const isWatchlistExpiryEnabled = config?.WatchlistExpiry || false;

    // Preload the notification module for mw.notify
    const modulesToLoad = [ 'mediawiki.notification' ];

    // Preload watchlist expiry widget so it runs in parallel with the api call
    if ( isWatchlistExpiryEnabled && !article.isForeign ) {
        modulesToLoad.push( 'mediawiki.watchstar.widgets' );
    }

    mw.loader.load( modulesToLoad );
}

/**
 * Shows a notification about watch status.
 * Partially copied from:
 * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/2a828f2e72a181665e1f627e2f737abb75b74eb9/resources/src/mediawiki.page.watch.ajax/watch-ajax.js#350}
 * @param {import('./Article').default} article an Article instance
 * @param {Function} callback
 * @param {Object} response
 */
function showWatchNotice( article, response, callback ) {
    const config = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' );
    const isWatchlistExpiryEnabled = config?.WatchlistExpiry || false;
    const preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );
    const notificationId = 'mw-watchlink-notification';

    const isWatched = response.watched === true;
    const mwTitle = article.getMW( 'title' );

    let message = isWatched ? 'addedwatchtext' : 'removedwatchtext';
    if ( mwTitle.isTalkPage() ) {
        message += '-talk';
    }

    let notifyPromise;
    let watchlistPopup;

    // @since 1.35 - pop up notification will be loaded with OOUI
    // only if Watchlist Expiry is enabled
    if ( isWatchlistExpiryEnabled && !article.isForeign ) {
        if ( isWatched ) {
            if ( !preferredExpiry || mw.util.isInfinity( preferredExpiry ) ) {
                // The message should include `infinite` watch period
                message = mwTitle.isTalkPage() ? 'addedwatchindefinitelytext-talk' : 'addedwatchindefinitelytext';
            } else {
                message = mwTitle.isTalkPage() ? 'addedwatchexpirytext-talk' : 'addedwatchexpirytext';
            }
        }

        notifyPromise = mw.loader.using( 'mediawiki.watchstar.widgets' ).then( ( require ) => {
            const WatchlistExpiryWidget = require( 'mediawiki.watchstar.widgets' );

            if ( !watchlistPopup ) {
                const $message = mw.message( message, mwTitle.getPrefixedText(), preferredExpiry ).parseDom();
                utils.addBaseToLinks( $message, `https://${ article.get( 'hostname' ) }` );
                utils.addTargetToLinks( $message );

                watchlistPopup = new WatchlistExpiryWidget(
                    isWatched ? 'watch' : 'unwatch',
                    article.getMW( 'title' ).getPrefixedDb(),
                    response.expiry,
                    ( ...args ) => updateWatchStatus( article, callback, [ ...args ] ),
                    {
                        message: $message,
                        $link: $( '<a>' ),
                    },
                );
            }

            mw.notify( watchlistPopup.$element, {
                tag: 'watch-self',
                id: notificationId,
                autoHideSeconds: 'short',
            } );
        } );
    } else {
        const $message = mw.message( message, mwTitle.getPrefixedText() ).parseDom();
        utils.addBaseToLinks( $message, `https://${ article.get( 'hostname' ) }` );
        utils.addTargetToLinks( $message );

        notifyPromise = mw.notify( $message, {
            tag: 'watch-self',
            id: notificationId,
        } );
    }

    // The notifications are stored as a promise and the watch link is only updated
    // once it is resolved. Otherwise, if $wgWatchlistExpiry set, the loading of
    // OOUI could cause a race condition and the link is updated before the popup
    // actually is shown. See T263135
    notifyPromise.always( () => {
        updateWatchStatus( article, callback, [
            $( '<a>' ),
            isWatched ? 'unwatch' : 'watch',
            'idle',
            response.expiry,
            'infinity',
        ] );
    } );
}

function updateWatchStatus( article, callback, [ titleOrLink, action, state, expiry, expirySelected ] ) {
    // Update the article watch status
    article.setValues( {
        watched: action === 'unwatch',
        expiry: expiry || 'infinity',
        expirySelected: expirySelected || 'infinity',
    } );

    // Update related button
    if ( utils.isFunction( callback ) ) {
        callback( state );
    }
}