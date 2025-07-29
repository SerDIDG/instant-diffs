import id from './id';
import * as utils from './utils';
import { getModuleExport } from './utils-oojs';
import { getHrefAbsolute } from './utils-article';

import Api from './Api';

const notificationId = 'mw-watchlink-notification';

/**
 * Gets how many expiry days left in the watchlist.
 * @param {string} expiry
 * @return {number|null}
 */
function getDaysLeftExpiry( expiry ) {
    if ( !expiry || mw.util.isInfinity( expiry ) ) return null;

    const expiryDate = new Date( expiry );
    const currentDate = new Date();

    // Using the Math.ceil function instead of floor so when, for example, a user selects one week
    // the tooltip shows 7 days instead of 6 days (see Phab ticket T253936)
    return Math.ceil( ( expiryDate - currentDate ) / ( 1000 * 60 * 60 * 24 ) );
}

/**
 * Adds or removes page from the watchlist.
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @returns {mw.Api.AbortablePromise}
 */
export async function setWatchStatus( article, button ) {
    await Api.loadMessage( [
        'watchlist-expiring-days-full-text',
        'watchlist-expiring-hours-full-text',
        'tooltip-ca-watch',
        'tooltip-ca-unwatch',
        'tooltip-ca-unwatch-expiring',
        'tooltip-ca-unwatch-expiring-hours',
    ] );

    preloadWatchNotice( article );

    const hostname = article.get( 'hostname' );
    const title = article.getMW( 'title' ).getPrefixedDb();
    const preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );

    const request = article.get( 'watched' )
        ? Api.unwatch( title, hostname )
        : Api.watch( title, preferredExpiry, hostname );

    return request
        .then( ( response ) => {
            showWatchNotice( article, button, response );
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
    const { WatchlistExpiry } = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' ) || {};
    const isWatchlistExpiryEnabled = !article.isForeign && ( WatchlistExpiry || false );

    // Preload the notification module for mw.notify
    const modulesToLoad = [ 'mediawiki.notification' ];

    // Preload watchlist expiry widget so it runs in parallel with the api call
    if ( isWatchlistExpiryEnabled ) {
        modulesToLoad.push( 'mediawiki.watchstar.widgets' );
    }

    mw.loader.load( modulesToLoad );
}

/**
 * Shows a notification about watch status.
 * Partially copied from:
 * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/2a828f2e72a181665e1f627e2f737abb75b74eb9/resources/src/mediawiki.page.watch.ajax/watch-ajax.js#350}
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @param {Object} response
 */
function showWatchNotice( article, button, response ) {
    const { WatchlistExpiry } = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' ) || {};
    const isWatchlistExpiryEnabled = !article.isForeign && ( WatchlistExpiry || false );

    const isWatched = response.watched === true;
    const mwTitle = article.getMW( 'title' );
    const preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );

    let message = isWatched ? 'addedwatchtext' : 'removedwatchtext';
    if ( mwTitle.isTalkPage() ) {
        message += '-talk';
    }

    let notifyPromise;
    let watchlistPopup;

    // @since 1.35 - pop up notification will be loaded with OOUI
    // only if Watchlist Expiry is enabled
    if ( isWatchlistExpiryEnabled ) {
        if ( isWatched ) {
            if ( mw.util.isInfinity( preferredExpiry ) ) {
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
                    ( ...args ) => updateWatchStatus( article, button, [ ...args ] ),
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
        updateWatchStatus( article, button, [
            $( '<a>' ),
            isWatched ? 'unwatch' : 'watch',
            'idle',
            response.expiry,
            'infinity',
        ] );
    } );
}

/**
 * Sets the article's watch \ unwatch status, updates related button;
 * than if an article page matches a current page, fires a page update;
 * that if current page is a watchlist, updates watchlist lines.
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @param {mw.Title|JQuery<HTMLElement>} titleOrLink
 * @param {('watch', 'unwatch')} action
 * @param {('idle', 'loading')} state
 * @param {string} expiry
 * @param {string} expirySelected
 */
function updateWatchStatus( article, button, [ titleOrLink, action, state, expiry, expirySelected ] ) {
    const watched = action === 'unwatch';
    expiry ||= 'infinity';
    expirySelected ||= 'infinity';

    // Update the article watch status
    article.setValues( { watched, expiry, expirySelected } );

    // Update related button
    button.helper?.pending( state === 'loading' );
    updateWatchLinkStatus( article, button );

    // For the current page, also update page status, that triggers the hook 'wikipage.watchlistChange'
    if (
        !article.isForeign &&
        id.local.mwTitleText === article.get( 'titleText' )
    ) {
        const { updatePageWatchStatus } = utils.moduleRequire( 'mediawiki.page.watch.ajax' ) || {};
        updatePageWatchStatus?.( watched, expiry, expirySelected );
    }

    // Perform next updates only on the idle state
    if ( state !== 'loading' ) {
        // For the watchlist, also update watchlist lines.
        if (
            !article.isForeign &&
            mw.user.options.get( 'watchlistunwatchlinks' ) &&
            id.local.mwCanonicalSpecialPageName === 'Watchlist'
        ) {
            updateWatchlistStatus( article, watched, expiry );
        }

        // For the global watchlist, also update watchlist lines.
        if ( id.local.mwCanonicalSpecialPageName === 'GlobalWatchlist' ) {
            updateGlobalWatchlistStatus( article, watched, expiry );
        }
    }
}

/**
 * Updates status of the watch \ unwatch button.
 * Partially copied from:
 * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/2a828f2e72a181665e1f627e2f737abb75b74eb9/resources/src/mediawiki.page.watch.ajax/watch-ajax.js#18}
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 */
export function updateWatchLinkStatus( article, button ) {
    const watched = article.get( 'watched' );
    const action = watched ? 'unwatch' : 'watch';
    const expiry = article.get( 'expiry' ) || 'infinity';
    const daysLeftExpiry = getDaysLeftExpiry( expiry );

    const label = `action-${ action }`;
    const href = mw.util.getUrl( article.get( 'title' ), { action } );

    let tooltipAction;
    let icon;

    if ( watched ) {
        // Checking to see what if the expiry is set or indefinite to display the correct message
        if ( mw.util.isInfinity( expiry ) ) {
            tooltipAction = 'unwatch';
            icon = 'unStar';
        } else {
            tooltipAction = daysLeftExpiry > 0 ? 'unwatch-expiring' : 'unwatch-expiring-hours';
            icon = 'halfStar';
        }
    } else {
        tooltipAction = 'watch';
        icon = 'star';
    }

    button.setLabel( utils.msg( label ) );
    button.setTitle( mw.msg( `tooltip-ca-${ tooltipAction }`, daysLeftExpiry ) );
    button.setHref( getHrefAbsolute( article, href ) );
    if ( utils.defaults( 'showMenuIcons' ) ) {
        button.setIcon( icon );
    }
}

/******* WATCHLIST *******/

/**
 * Updates watch / unwatch status in the Watchlist lines.
 * Partially copied from:
 * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/9c590c2c37434ca7a2bd101b547ccf7dcc46b538/resources/src/mediawiki.special.watchlist/watchlist.js#114}
 * @param {import('./Article').default} article an Article instance
 * @param {boolean} watched
 * @param {string} expiry
 */
export function updateWatchlistStatus( article, watched, expiry ) {
    if ( watched ) {
        forEachWatchlistLines( article.get( 'titleText' ), ( rowTitle, $row, $link ) => {
            $link
                .text( mw.msg( 'watchlist-unwatch' ) )
                .attr( 'title', mw.msg( 'tooltip-ca-unwatch' ) )
                .attr( 'href', mw.util.getUrl( rowTitle, { action: 'unwatch' } ) )
                .removeClass( 'mw-watch-link loading' )
                .addClass( 'mw-unwatch-link' );

            $row
                .find( '.mw-changelist-line-inner-unwatched' )
                .addBack( '.mw-enhanced-rc-nested' )
                .removeClass( 'mw-changelist-line-inner-unwatched' );

            updateWatchlistExpiryStatus( $row, watched, expiry );
        } );
    } else {
        forEachWatchlistLines( article.get( 'titleText' ), ( rowTitle, $row, $link ) => {
            $link
                .text( mw.msg( 'watchlist-unwatch-undo' ) )
                .attr( 'title', mw.msg( 'tooltip-ca-watch' ) )
                .attr( 'href', mw.util.getUrl( rowTitle, { action: 'watch' } ) )
                .removeClass( 'mw-unwatch-link loading' )
                .addClass( 'mw-watch-link' );

            $row
                .find( '.mw-changeslist-line-inner, .mw-enhanced-rc-nested' )
                .addBack( '.mw-enhanced-rc-nested' ) // For matching log sub-entry
                .addClass( 'mw-changelist-line-inner-unwatched' );
        } );
    }
}

/**
 * Updates watch / unwatch status in the Watchlist expiry icon.
 * @param {JQuery<HTMLElement>} $row
 * @param {boolean} watched
 * @param {string} expiry
 */
function updateWatchlistExpiryStatus( $row, watched, expiry ) {
    if ( !watched ) return;

    // Collect all visible expiry icons
    const $expiry = $row.find( '.mw-changesList-watchlistExpiry' );

    // Remove expiry icons when expiry is infinite
    if ( mw.util.isInfinity( expiry ) ) {
        return removeWatchlistExpiryStatus( $row, $expiry );
    }

    const daysLeftExpiry = getDaysLeftExpiry( expiry );
    const tooltipAction = daysLeftExpiry > 0 ? 'days-full-text' : 'hours-full-text';
    const message = mw.msg( `watchlist-expiring-${ tooltipAction }`, daysLeftExpiry );

    if ( $expiry.length > 0 ) {
        // Change title of the existing icons
        $expiry.each( ( i, node ) => {
            node.title = message;
        } );
    } else {
        // Render new icons
        renderWatchlistExpiryStatus( $row, message );
    }
}

/**
 * Removes expiry icon in the Watchlist.
 * @param {JQuery<HTMLElement>} $row
 * @param {JQuery<HTMLElement>}  $expiry
 */
function removeWatchlistExpiryStatus( $row, $expiry ) {
    $expiry.each( ( i, node ) => {
        const $this = $( node );

        // Replace separator to semicolon (T266747)
        $this
            .next( '.mw-changeslist-separator' )
            .addClass( 'mw-changeslist-separator--semicolon' )
            .removeClass( 'mw-changeslist-separator' );

        // Remove the spaces before and after the expiry icon
        node.previousSibling.nodeValue = node.previousSibling.nodeValue.trimEnd();
        node.nextSibling.nodeValue = node.nextSibling.nodeValue.trimStart();

        // Remove the icon
        $expiry.remove();
    } );

    // Add white-space for the grouped lists
    $row
        .find( '.mw-changeslist-line-inner-historyLink' )
        .prepend( ' ' );
}

/**
 * Renders new OO.ui expiry icon in the Watchlist.
 * @param {JQuery<HTMLElement>} $row
 * @param {string}  message
 */
function renderWatchlistExpiryStatus( $row, message ) {
    $row
        .find( '.mw-title' )
        .each( ( i, node ) => {
            const $this = $( node );

            const $reviewLink = $this
                .next( '.mw-fr-reviewlink' );

            const icon = new OO.ui.IconWidget( {
                icon: 'clock',
                title: message,
                classes: [ 'mw-changesList-watchlistExpiry' ],
            } );

            ( $reviewLink.length > 0 ? $reviewLink : $this )
                .after( ' ' )
                .after( icon.$element )
                .after( ' ' );

            // Replace semicolon to separator (T266747)
            icon.$element
                .next( '.mw-changeslist-separator--semicolon' )
                .addClass( 'mw-changeslist-separator' )
                .removeClass( 'mw-changeslist-separator--semicolon' );
        } );
}

/**
 * Callback for utility function.
 * @callback forEachWatchlistLinesCallback
 * @param {string} ttile
 * @param {JQuery<HTMLElement>} $row
 * @param {JQuery<HTMLElement>} $link
 */

/**
 * Utility function for looping through each watchlist line that matches
 * a certain page or its associated page (e.g. Talk).
 * Partially copied from:
 * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/9c590c2c37434ca7a2bd101b547ccf7dcc46b538/resources/src/mediawiki.special.watchlist/watchlist.js#81}
 * @param {string} title
 * @param {forEachWatchlistLinesCallback} callback
 */
function forEachWatchlistLines( title, callback ) {
    const mwTitle = mw.Title.newFromText( title );
    const associatedMwTitle = mwTitle.isTalkPage() ? mwTitle.getSubjectPage() : mwTitle.getTalkPage();
    const associatedTitle = associatedMwTitle.getPrefixedText();

    $( '.mw-changeslist-line' ).each( ( i, node ) => {
        const $line = $( node );

        $line.find( '[data-target-page]' ).each( ( i, node ) => {
            const $this = $( node );
            const rowTitle = String( $this.data( 'targetPage' ) );

            if ( rowTitle === title || rowTitle === associatedTitle ) {
                // EnhancedChangesList groups log entries by performer rather than target page.
                // Therefore...
                // * If using OldChangesList, use the <li>
                // * If using EnhancedChangesList and $this is part of a grouped log entry, use the <td> sub-entry
                // * If using EnhancedChangesList and $this is not part of a grouped log entry, use the <table> grouped entry
                const $row = $this
                    .closest( 'li, .mw-enhancedchanges-checkbox + table.mw-changeslist-log td[data-target-page], table' );

                const $link = $row
                    .find( '.mw-unwatch-link, .mw-watch-link' );

                callback( rowTitle, $row, $link );
            }
        } );
    } );
}

/******* GLOBAL WATCHLIST *******/

/**
 * Updates watch / unwatch status in the Global Watchlist.
 * @param {import('./Article').default} article an Article instance
 * @param {boolean} watched
 * @param {string} expiry
 */
export function updateGlobalWatchlistStatus( article, watched, expiry ) {
    if ( !mw.globalwatchlist ) return;

    // Follows defensive programming fot the external scripts
    try {
        const watchedSites = mw.globalwatchlist.watchedSites.siteList
            .find( entry => entry.site === article.get( 'hostname' ) );
        if ( !watchedSites ) return;

        // Use origTitle value instead of title or titleText,
        // because article's title is formatted with canonical prefixes,
        // but extension is expected title in the local format .
        watchedSites.processUpdateWatched( article.get( 'origTitle' ), !watched );
    } catch ( error ) {
        utils.notifyError( 'error-global-watchlist', {
            type: 'watchstar',
            message: error?.message || error,
        }, article, true );
    }
}