import id from './id';
import * as utils from './utils';
import * as utilsWatch from './utils-watch';
import { getModuleExport } from './utils-oojs';

import Api from './Api';

/**
 * Class representing a Watch start.
 */
class Watch {
    /**
     * @type {typeof utilsWatch}
     */
    static utils = utilsWatch;

    /**
     * @type {string}
     */
    static notificationId = 'mw-watchlink-notification';

    /**
     * @type {import('./Article').default}
     */
    article;

    /**
     * @type {OO.ui.ButtonWidget}
     */
    button;

    /**
     * @type {string}
     */
    hostname;

    /**
     * @type {string}
     */
    preferredExpiry;

    /**
     * @type {boolean}
     */
    isExpiryEnabled = false;

    /**
     * @type {boolean}
     */
    isWatched = false;

    /**
     * Create a Watch instance.
     * @param {import('./Article').default} article an Article instance
     * @param {OO.ui.ButtonWidget} button a Button instance
     */
    constructor( article, button ) {
        this.article = article;
        this.button = button;
        this.hostname = this.article.get( 'hostname' );

        // Get ajax watch config
        const { WatchlistExpiry } = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' ) || {};
        this.isExpiryEnabled = !this.article.isForeign && ( WatchlistExpiry || false );

        // Preload the notification module for mw.notify
        const modules = [ 'mediawiki.notification' ];

        // Preload watchlist expiry widget so it runs in parallel with the api call
        if ( this.isExpiryEnabled ) {
            modules.push( 'mediawiki.watchstar.widgets' );
        }

        mw.loader.load( modules );
    }

    /**
     * Adds or removes page from the watchlist.
     * @returns {mw.Api.AbortablePromise}
     */
    async request() {
        await this.preloadMessages();

        this.preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );
        this.isWatched = this.article.get( 'watched' );

        const title = this.article.getMW( 'title' ).getPrefixedDb();

        const request = this.isWatched
            ? Api.unwatch( title, this.hostname )
            : Api.watch( title, this.preferredExpiry, this.hostname );

        return request
            .then( this.showNotice )
            .fail( this.showError );
    }

    async preloadMessages() {
        await Api.loadMessage( [
            'watchlist-expiring-days-full-text',
            'watchlist-expiring-hours-full-text',
            'tooltip-ca-watch',
            'tooltip-ca-unwatch',
            'tooltip-ca-unwatch-expiring',
            'tooltip-ca-unwatch-expiring-hours',
        ] );
    }

    showError = ( code, data ) => {
        // Format error message
        const $msg = Api.getApi().getErrorMessage( data );

        // Report to user about the error
        mw.notify( $msg, {
            tag: 'watch-self',
            type: 'error',
            id: this.constructor.notificationId,
        } );
    };

    /**
     * Shows a notification about watch status.
     * Partially copied from:
     * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/2a828f2e72a181665e1f627e2f737abb75b74eb9/resources/src/mediawiki.page.watch.ajax/watch-ajax.js#350}
     * @param {Object} response
     */
    showNotice = ( response ) => {
        this.isWatched = response.watched === true;

        const mwTitle = this.article.getMW( 'title' );
        const expiry = response.expiry || 'infinity';
        const $link = $( '<a>' );

        let message = this.isWatched ? 'addedwatchtext' : 'removedwatchtext';
        if ( mwTitle.isTalkPage() ) {
            message += '-talk';
        }

        let notifyPromise;
        let watchlistPopup;

        // @since 1.35 - pop up notification will be loaded with OO.ui
        // only if Watchlist Expiry is enabled
        if ( this.isExpiryEnabled ) {
            if ( this.isWatched ) {
                if ( mw.util.isInfinity( this.preferredExpiry ) ) {
                    // The message should include `infinite` watch period
                    message = mwTitle.isTalkPage() ? 'addedwatchindefinitelytext-talk' : 'addedwatchindefinitelytext';
                } else {
                    message = mwTitle.isTalkPage() ? 'addedwatchexpirytext-talk' : 'addedwatchexpirytext';
                }
            }

            notifyPromise = mw.loader.using( 'mediawiki.watchstar.widgets' ).then( ( require ) => {
                const WatchlistExpiryWidget = require( 'mediawiki.watchstar.widgets' );

                if ( !watchlistPopup ) {
                    const $message = mw.message( message, mwTitle.getPrefixedText(), this.preferredExpiry ).parseDom();
                    utils.addBaseToLinks( $message, `https://${ this.hostname }` );
                    utils.addTargetToLinks( $message );

                    /**
                     * Configure WatchlistExpiryWidget params
                     * @param {string} action
                     * @param {string} title
                     * @param {string} expiry
                     * @param {Function} callback
                     * @param {Object} config
                     */
                    const params = [
                        this.isWatched ? 'watch' : 'unwatch',
                        mwTitle.getPrefixedDb(),
                        expiry,
                        this.updateStatus,
                        {
                            $link,
                            message: $message,
                        },
                    ];

                    // Remove expiry argument that was added in 1.45.0 (T265716)
                    // for the older MediaWiki versions.
                    if ( utils.semverCompare( mw.config.get( 'wgVersion' ), '1.45.0' ) < 0 ) {
                        params.splice( 2, 1 );
                    }

                    // Construct a widget instance
                    watchlistPopup = new WatchlistExpiryWidget( ...params );
                }

                mw.notify( watchlistPopup.$element, {
                    tag: 'watch-self',
                    id: this.constructor.notificationId,
                    autoHideSeconds: 'short',
                } );
            } );
        } else {
            const $message = mw.message( message, mwTitle.getPrefixedText() ).parseDom();
            utils.addBaseToLinks( $message, `https://${ this.hostname }` );
            utils.addTargetToLinks( $message );

            notifyPromise = mw.notify( $message, {
                tag: 'watch-self',
                id: this.constructor.notificationId,
            } );
        }

        // The notifications are stored as a promise and the watch link is only updated
        // once it is resolved. Otherwise, if $wgWatchlistExpiry set, the loading of
        // OO.ui could cause a race condition and the link is updated before the popup
        // actually is shown. See T263135
        notifyPromise.always( () => {
            const action = this.isWatched ? 'unwatch' : 'watch';
            this.updateStatus( $link, action, 'idle', expiry, 'infinity' );
        } );
    };

    /**
     * Sets the article's watch \ unwatch status, updates related button;
     * than if an article page matches a current page, fires a page update;
     * that if current page is a watchlist, updates watchlist lines.
     * @param {mw.Title|JQuery<HTMLElement>} titleOrLink
     * @param {('watch', 'unwatch')} action
     * @param {('idle', 'loading')} state
     * @param {string} expiry
     * @param {string} expirySelected
     */
    updateStatus = ( titleOrLink, action, state, expiry, expirySelected ) => {
        const watched = action === 'unwatch';
        expiry ||= 'infinity';
        expirySelected ||= 'infinity';

        // Update the article watch status
        this.isWatched = watched;
        this.article.setValues( { watched, expiry, expirySelected } );

        // Update related button
        this.button.helper?.pending( state === 'loading' );
        utilsWatch.updateWatchButtonStatus( this.article, this.button );

        // For the current page, also update page status, that triggers the hook 'wikipage.watchlistChange'
        if (
            !this.article.isForeign &&
            id.local.mwTitleText === this.article.get( 'titleText' )
        ) {
            const { updatePageWatchStatus } = utils.moduleRequire( 'mediawiki.page.watch.ajax' ) || {};
            updatePageWatchStatus?.( watched, expiry, expirySelected );
        }

        // Perform next updates only on the idle state
        if ( state !== 'loading' ) {
            // For the watchlist, also update watchlist lines.
            if (
                !this.article.isForeign &&
                mw.user.options.get( 'watchlistunwatchlinks' ) &&
                id.local.mwCanonicalSpecialPageName === 'Watchlist'
            ) {
                utilsWatch.updateWatchlistStatus( this.article, watched, expiry );
            }

            // For the global watchlist, also update watchlist lines.
            if ( id.local.mwCanonicalSpecialPageName === 'GlobalWatchlist' ) {
                utilsWatch.updateGlobalWatchlistStatus( this.article, watched, expiry );
            }
        }
    };
}

export default Watch;