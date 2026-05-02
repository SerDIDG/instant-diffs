import id from './id';
import * as utils from './utils';
import * as utilsWatch from './utils-watch';
import { getModuleExport } from './utils-oojs';

import settings from './settings';
import Api from './Api';

const { h } = utils;

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
	 * Whether a watchlist popup is enabled.
	 * @type {boolean}
	 */
	isWatchListPopupEnabled = false;

	/**
	 * Current watch status of the article.
	 * @type {boolean}
	 */
	isWatched = false;

	/**
	 * jQuery link element for the fake watch button.
	 * @type {JQuery<HTMLElement>}
	 */
	$watchLink;

	/**
	 * WatchlistPopup wrapper element.
	 * @type {HTMLElement}
	 */
	watchlistPopupWrapper;

	/**
	 * WatchlistPopup instance.
	 * @type {Vue.App<import('vue').ComponentOptions>}
	 */
	watchlistPopup;

	/**
	 * Creates a Watch instance.
	 * @param {import('./Article').default} article - Article instance to manage watch status for
	 * @param {Object} [options] - Configuration options
	 * @param {Function} [options.onUpdate] - Callback invoked when watch status updates
	 */
	constructor( article, options ) {
		this.article = article;

		this.options = {
			onUpdate: () => {},
			...options,
		};

		// Render a fake watch button that required in watchlist popup
		this.$watchLink = $( '<a class="instantDiffs-button--fake-watch">' );
		utils.embed( this.$watchLink, document.body );

		// Get ajax watch config
		const config = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' ) || {};
		this.isWatchlistExpiryEnabled = !this.article.isForeign && ( config.WatchlistExpiry || false );
		this.watchlistLabelsEnabled = !this.article.isForeign && ( config.EnableWatchlistLabels || false );
		this.isWatchListPopupEnabled = settings.get( 'showWatchlistPopup' ) && ( this.isWatchlistExpiryEnabled || this.watchlistLabelsEnabled );

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
	 * Adds or removes a page from the watchlist based on the current status.
	 * @returns {Promise<mw.Api.AbortablePromise>} API request promise
	 */
	async request() {
		await this.preloadMessages();

		this.preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );
		this.isWatched = this.article.get( 'watched' );

		if ( this.isWatchListPopupEnabled ) {
			return this.requestModules();
		} else {
			return this.requestWatchStatus();
		}
	}

	requestModules() {
		return mw.loader.using( 'mediawiki.watchstar.widgets' ).then( ( require ) => {
			const watchlistWidgets = require( 'mediawiki.watchstar.widgets' );

			// @since 1.46 a popup is shown (T417847)
			if ( utils.isObject( watchlistWidgets ) ) {
				return this.showWatchlistPopup();
			} else {
				return this.requestWatchStatus();
			}
		} );
	}

	requestWatchStatus() {
		const title = this.article.getMW( 'title' ).getPrefixedDb();

		const request = this.isWatched
			? Api.unwatch( title, this.article )
			: Api.watch( title, this.preferredExpiry, this.article );

		return request
			.then( this.showNotice )
			.fail( this.showError );
	}

	/**
	 * Shows an error notification when the watch/unwatch request fails.
	 * @param {string|undefined} code - Error code
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
	 * @param {Object} data - API response object
	 * @param {boolean} data.watched - Whether the page is now watched
	 * @param {string} [data.expiry] - Expiry timestamp or 'infinity'
	 */
	showNotice = ( data ) => {
		if ( !data ) {
			return this.showError( undefined, data );
		}

		this.isWatched = data.watched === true;
		const mwTitle = this.article.getMW( 'title' );
		const expiry = data.expiry || 'infinity';

		let message = this.isWatched ? 'addedwatchtext' : 'removedwatchtext';
		if ( mwTitle.isTalkPage() ) {
			message += '-talk';
		}

		let notifyPromise;

		// @since 1.35 - pop up notification will be loaded with OO.ui
		// only if one or both of watchlist expiry or watchlist labels are enabled
		if ( this.isWatchListPopupEnabled ) {
			if ( this.isWatched ) {
				// The message should include the 'infinite' watch period
				message = !this.preferredExpiry || mw.util.isInfinity( this.preferredExpiry ) ? 'addedwatchindefinitelytext' : 'addedwatchexpirytext';
				if ( mwTitle.isTalkPage() ) {
					message += '-talk';
				}
			}
			notifyPromise = this.showWatchlistNotice( mwTitle, message, expiry );
		} else {
			notifyPromise = this.showBasicNotice( mwTitle, message );
		}

		// Re-set to idle.
		notifyPromise.always( () => {
			const otherAction = this.isWatched ? 'unwatch' : 'watch';
			this.updateStatus( this.$watchLink, otherAction, 'idle', expiry, 'infinity' );
		} );
	};

	/**
	 * Generates a formatted i18n message for watch notifications.
	 * @param {mw.Title} mwTitle - MediaWiki title object
	 * @param {string} message - Message key
	 * @returns {JQuery} Parsed DOM message with properly configured links
	 */
	getNoticeMessage( mwTitle, message ) {
		const hostname = this.article.get( 'hostname' );
		const $message = mw.message( message, mwTitle.getPrefixedText(), this.preferredExpiry ).parseDom();
		utils.addBaseToLinks( $message, `https://${ hostname }` );
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
	}

	/**
	 * Shows an interactive watchlist notification with expiry and label options.
	 * Falls back to basic notice if the notification widget fails to load or construct.
	 * @param {mw.Title} mwTitle - MediaWiki title object
	 * @param {string} message - Message key
	 * @param {string} expiry - Current expiry value
	 * @returns {JQuery.Promise} Promise that resolves when the popup is shown
	 */
	showWatchlistNotice( mwTitle, message, expiry ) {
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
					$link: this.$watchLink,
					message: $message,
				},
			];

			// Remove the expiry argument added @since 1.45 (T265716)
			// for older MediaWiki versions.
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
			} catch ( error ) {
				utils.logException( this.constructor.name, 'Falls back to basic watch/unwatch functionality', error );
				this.showBasicNotice( mwTitle, message );
			}
		} );
	}

	showWatchlistPopup() {
		if ( this.watchlistPopup ) {
			if ( this.watchlistPopup.isOpen ) {
				this.watchlistPopup.isOpen = false;
			} else {
				this.watchlistPopup.openPopup( this.$watchLink[ 0 ] );
			}
			return $.Deferred().resolve().promise();
		}

		return mw.loader.using( [ '@wikimedia/codex', 'mediawiki.watchstar.widgets' ] )
			.then( require => {
				const Vue = require( 'vue' );
				const watchlistWidgets = require( 'mediawiki.watchstar.widgets' );
				const WatchlistPopup = watchlistWidgets.WatchlistPopup;

				this.watchlistPopupWrapper = h( 'span.mw-watchlink-popup' );
				utils.embed( this.watchlistPopupWrapper, document.body );

				this.watchlistPopup = Vue.createMwApp( WatchlistPopup, {
					initialAction: this.isWatched ? 'unwatch' : 'watch',
					expiryEnabled: this.isWatchlistExpiryEnabled,
					labelsEnabled: this.watchlistLabelsEnabled,
					title: this.article.getMW( 'title' ),
					dataExpiryOptions: watchlistWidgets.dataExpiryOptions,
					preferredExpiry: this.preferredExpiry,
					link: this.$watchLink[ 0 ],
				} ).mount( this.watchlistPopupWrapper );

				window.addEventListener( 'WatchlistPopup.watch', this.onWatchlistPopupWatch );
				window.addEventListener( 'WatchlistPopup.unwatch', this.onWatchlistPopupUnwatch );
			} );
	}

	onWatchlistPopupWatch = ( event ) => {
		this.isWatched = true;
		const expiry = event.detail?.watchResponse
			? event.detail.watchResponse.expiry || event.detail.watchResponse._rawValue?.expiry
			: 'infinity';
		this.updateStatus( this.$watchLink, 'unwatch', 'idle', expiry );
	};

	onWatchlistPopupUnwatch = ( event ) => {
		this.isWatched = false;
		this.updateStatus( this.$watchLink, 'watch', 'idle' );
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

	/******* ACTIONS *******/

	/**
	 * Gets the associated Article instance.
	 * @returns {import('./Article').default} The Article instance
	 */
	getArticle() {
		return this.article;
	}

	detach() {
		// Detach watchlist popup and associated events
		if ( this.watchlistPopup ) {
			window.removeEventListener( 'WatchlistPopup.watch', this.onWatchlistPopupWatch );
			window.removeEventListener( 'WatchlistPopup.unwatch', this.onWatchlistPopupUnwatch );

			this.watchlistPopup.isOpen = false;
			//this.watchlistPopup.unmount();
			this.watchlistPopupWrapper.remove();
		}

		// Detach the fake watch button
		this.$watchLink.detach();
	}
}

export default Watch;