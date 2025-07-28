import * as utils from './utils';
import { getModuleExport } from './utils-oojs';
import { getHrefAbsolute } from './utils-article';

import Api from './Api';

/**
 * Adds or removes page from the watchlist.
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @returns {mw.Api.AbortablePromise}
 */
export function setWatchStatus( article, button ) {
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
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @param {Object} response
 */
function showWatchNotice( article, button, response ) {
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
 * Sets the article's watch \ unwatch status and updates the button.
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @param {mw.Title|JQuery<HTMLElement>} titleOrLink
 * @param {string} action
 * @param {string} state
 * @param {string} expiry
 * @param {string} expirySelected
 */
function updateWatchStatus( article, button, [ titleOrLink, action, state, expiry, expirySelected ] ) {
    // Update the article watch status
    article.setValues( {
        watched: action === 'unwatch',
        expiry: expiry || 'infinity',
        expirySelected: expirySelected || 'infinity',
    } );

    // Update related button
    button.helper?.pending( state === 'loading' );
    updateWatchLinkStatus( article, button );
}

/**
 * Updates status of the watch \ unwatch button.
 * @param {import('./Article').default} article an Article instance
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 */
export function updateWatchLinkStatus( article, button ) {
    //const config = getModuleExport(  'mediawiki.page.watch.ajax', 'config.json' );
    const watched = article.get( 'watched' );
    const action = watched ? 'unwatch' : 'watch';
    const expiry = article.get( 'expiry' ) || 'infinity';

    const label = `action-${ action }`;
    const href = mw.util.getUrl( article.get( 'title' ), { action } );

    let daysLeftExpiry = null;
    let tooltipAction;
    let icon;

    if ( watched ) {
        // Checking to see what if the expiry is set or indefinite to display the correct message
        if ( mw.util.isInfinity( expiry ) ) {
            tooltipAction = 'unwatch';
            icon = 'unStar';
        } else {
            const expiryDate = new Date( expiry );
            const currentDate = new Date();

            // Using the Math.ceil function instead of floor so when, for example, a user selects one week
            // the tooltip shows 7 days instead of 6 days (see Phab ticket T253936)
            daysLeftExpiry = Math.ceil( ( expiryDate - currentDate ) / ( 1000 * 60 * 60 * 24 ) );
            tooltipAction = daysLeftExpiry > 0 ? 'unwatch-expiring' : 'unwatch-expiring-hours';
            icon = 'halfStar';
        }
    } else {
        tooltipAction = 'watch';
        icon = 'star';
    }

    button.setLabel( utils.msg( label ) );
    button.setTitle( mw.msg( `tooltip-ca-${ tooltipAction }`, daysLeftExpiry ) );
    button.setIcon( icon );
    button.setHref( getHrefAbsolute( article, href ) );
}