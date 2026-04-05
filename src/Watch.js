import id from './id';
import * as utils from './utils';
import * as utilsWatch from './utils-watch';
import { getModuleExport } from './utils-oojs';

import Api from './Api';

/**
 * Class representing a Watch handler for managing article watchlist status.
 */
class Watch {
	/**
	 * Watchlist utility functions.
	 * @type {typeof utilsWatch}
	 */
	static utils = utilsWatch;

	/**
	 * Notification ID for watch-related notifications.
	 * @type {string}
	 */
	static notificationId = 'mw-watchlink-notification';

	/**
	 * Associated Article instance.
	 * @type {import('./Article').default}
	 */
	article;

	/**
	 * Hostname of the wiki.
	 * @type {string}
	 */
	hostname;

	/**
	 * Configuration options.
	 * @type {Object}
	 */
	options = {};

	/**
	 * User's preferred expiry setting for watched pages.
	 * @type {string}
	 */
	preferredExpiry;

	/**
	 * Whether watchlist expiry feature is enabled.
	 * @type {boolean}
	 */
	isWatchlistExpiryEnabled = false;

	/**
	 * Whether watchlist labels feature is enabled.
	 * @type {boolean}
	 */
	watchlistLabelsEnabled = false;

	/**
	 * Current watch status of the article.
	 * @type {boolean}
	 */
	isWatched = false;

	/**
	 * Creates a Watch instance.
	 * @param {import('./Article').default} article - Article instance to manage watch status for
	 * @param {Object} [options] - Configuration options
	 * @param {Function} [options.onUpdate] - Callback invoked when watch status updates
	 */
	constructor( article, options ) {
		this.article = article;

		this.hostname = this.article.get( 'hostname' );

		this.options = {
			onUpdate: () => {},
			...options,
		};

		// Get ajax watch config
		const config = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' ) || {};
		this.isWatchlistExpiryEnabled = !this.article.isForeign && ( config.WatchlistExpiry || false );
		this.watchlistLabelsEnabled = !this.article.isForeign && ( config.EnableWatchlistLabels || false );

		// Preload the notification module for mw.notify
		const modulesToLoad = [ 'mediawiki.notification' ];

		// Preload modules required for the popup in parallel with the initial watch API call.
		if ( this.isWatchlistExpiryEnabled || this.watchlistLabelsEnabled ) {
			modulesToLoad.push( 'mediawiki.watchstar.widgets' );
		}
		if ( this.watchlistLabelsEnabled ) {
			modulesToLoad.push( 'mediawiki.widgets.MenuTagMultiselectWidget' );
		}

		mw.loader.load( modulesToLoad );
	}

	/**
	 * Adds or removes a page from the watchlist based on the current status.
	 * @returns {Promise<mw.Api.AbortablePromise>} API request promise
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

	/**
	 * Preloads watch-related i18n messages from the API.
	 * @returns {Promise<void>}
	 */
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

	/**
	 * Shows an error notification when the watch/unwatch request fails.
	 * @param {string} code - Error code
	 * @param {Object} data - Error data from API
	 */
	showError = ( code, data ) => {
		// Format error message
		const $msg = Api.getApi().getErrorMessage( data );

		// Report about the error
		mw.notify( $msg, {
			tag: 'watch-self',
			type: 'error',
			id: this.constructor.notificationId,
		} );
	};

	/**
	 * Shows a notification about watch status change.
	 * Displays either an interactive popup (if expiry/labels are enabled) or basic notification.
	 * @see {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/ceeb57e7cb8c45524e70612e84ab6a1817198e10/resources/src/mediawiki.page.watch.ajax/watch-ajax.js#355}
	 * @param {Object} response - API response object
	 * @param {boolean} response.watched - Whether the page is now watched
	 * @param {string} [response.expiry] - Expiry timestamp or 'infinity'
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

		// @since 1.35 - pop up notification will be loaded with OO.ui
		// only if one or both of watchlist expiry or watchlist labels are enabled
		if ( this.isWatchlistExpiryEnabled || this.watchlistLabelsEnabled ) {
			if ( this.isWatched ) {
				// The message should include the 'infinite' watch period
				message = !this.preferredExpiry || mw.util.isInfinity( this.preferredExpiry ) ? 'addedwatchindefinitelytext' : 'addedwatchexpirytext';
				if ( mwTitle.isTalkPage() ) {
					message += '-talk';
				}
			}
			notifyPromise = this.showWatchlistPopup( $link, mwTitle, message, expiry );
		} else {
			notifyPromise = this.showBasicNotice( mwTitle, message );
		}

		// The notifications are stored as a promise, and the watch link is only updated
		// once it is resolved. Otherwise, if $wgWatchlistExpiry set, the loading of
		// OO.ui could cause a race condition and the link is updated before the popup
		// actually is shown. See T263135
		notifyPromise.always( () => {
			const action = this.isWatched ? 'unwatch' : 'watch';
			this.updateStatus( $link, action, 'idle', expiry, 'infinity' );
		} );
	};

	/**
	 * Generates a formatted i18n message for watch notifications.
	 * @param {mw.Title} mwTitle - MediaWiki title object
	 * @param {string} message - Message key
	 * @returns {JQuery} Parsed DOM message with properly configured links
	 */
	getNoticeMessage( mwTitle, message ) {
		const $message = mw.message( message, mwTitle.getPrefixedText(), this.preferredExpiry ).parseDom();
		utils.addBaseToLinks( $message, `https://${ this.hostname }` );
		utils.addTargetToLinks( $message );
		return $message;
	}

	/**
	 * Shows a basic text notification without the interactive popup.
	 * @param {mw.Title} mwTitle - MediaWiki title object
	 * @param {string} message - Message key
	 * @returns {JQuery.Promise} Notification promise
	 */
	showBasicNotice( mwTitle, message ) {
		const $message = this.getNoticeMessage( mwTitle, message );
		return mw.notify( $message, {
			tag: 'watch-self',
			id: this.constructor.notificationId,
		} );
	};

	/**
	 * Shows an interactive watchlist popup notification with expiry and label options.
	 * Falls back to basic notice if the popup widget fails to load or construct.
	 * @param {JQuery} $link - jQuery link element for the watch button
	 * @param {mw.Title} mwTitle - MediaWiki title object
	 * @param {string} message - Message key
	 * @param {string} expiry - Current expiry value
	 * @returns {JQuery.Promise} Promise that resolves when the popup is shown
	 */
	showWatchlistPopup( $link, mwTitle, message, expiry ) {
		return mw.loader.using( 'mediawiki.watchstar.widgets' ).then( ( require ) => {
			const WatchlistPopup = require( 'mediawiki.watchstar.widgets' );
			if ( !WatchlistPopup ) {
				return this.showBasicNotice( mwTitle, message );
			}

			const $message = this.getNoticeMessage( mwTitle, message );

			// Configure WatchlistPopup constructor parameters:
			// [action, title, expiry, callback, config]
			const params = [
				this.isWatched ? 'watch' : 'unwatch',
				mwTitle.getPrefixedDb(),
				expiry,
				this.updateStatus,
				{
					expiryEnabled: this.isWatchlistExpiryEnabled,
					labelsEnabled: this.watchlistLabelsEnabled,
					$link,
					message: $message,
				},
			];

			// Remove the expiry argument that was added in 1.45.0 (T265716)
			// for the older MediaWiki versions.
			if ( utils.semverCompare( mw.config.get( 'wgVersion' ), '1.45.0' ) < 0 ) {
				params.splice( 2, 1 );
			}

			// Construct a widget instance
			try {
				const watchlistPopup = new WatchlistPopup( ...params );
				mw.notify( watchlistPopup.$element, {
					tag: 'watch-self',
					id: this.constructor.notificationId,
					autoHideSeconds: 'short',
				} );
			} catch {
				this.showBasicNotice( mwTitle, message );
			}
		} );
	};

	/**
	 * Updates the article's watch status and related UI elements.
	 * - Updates the article watch status and button
	 * - Fires page update if article matches current page
	 * - Updates watchlist lines if on a watchlist page
	 * @param {mw.Title|JQuery<HTMLElement>} titleOrLink - Title or link element
	 * @param {('watch'|'unwatch')} action - Next available action
	 * @param {('idle'|'loading')} state - Current state
	 * @param {string} [expiry] - Expiry timestamp or 'infinity'
	 * @param {string} [expirySelected] - Selected expiry value
	 */
	updateStatus = ( titleOrLink, action, state, expiry, expirySelected ) => {
		const watched = action === 'unwatch';
		expiry ||= 'infinity';
		expirySelected ||= 'infinity';

		// Update the article watch status
		this.isWatched = watched;
		this.article.setValues( { watched, expiry, expirySelected } );
		this.options.onUpdate( state );

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

	/******* ARTICLE *******/

	/**
	 * Gets the associated Article instance.
	 * @returns {import('./Article').default} The Article instance
	 */
	getArticle() {
		return this.article;
	};
}

export default Watch;