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
	watchlistExpiryEnabled = false;

	/**
	 * Whether watchlist labels feature is enabled.
	 * @type {boolean}
	 */
	watchlistLabelsEnabled = false;

	/**
	 * Whether watchstar popover feature is enabled.
	 * @type {boolean}
	 */
	watchstarPopoverEnabled = false;

	/**
	 * Whether a watchlist popup is enabled.
	 * @type {boolean}
	 */
	isWatchListPopupEnabled = false;

	/**
	 * Whether a watchstar popover is enabled.
	 * @type {boolean}
	 */
	isWatchstarPopoverEnabled = false;

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
	 * Watchstar popover wrapper element.
	 * @type {HTMLElement}
	 */
	watchstarPopoverWrapper;

	/**
	 * Watchstar popover Vue app instance.
	 * @type {import('vue').App<Element>}
	 */
	watchstarPopoverApp;

	/**
	 * Watchstar popover mounted component instance.
	 * @type {import('vue').ComponentPublicInstance}
	 */
	watchstarPopover;

	/**
	 * Creates a Watch instance.
	 * @param {import('./Article').default} article - Article instance to manage watch status for
	 * @param {Object} [options] - Configuration options
	 * @param {HTMLElement} [options.linkContainer] - Container for the fake watch link
	 * @param {Function} [options.onUpdate] - Callback invoked when watch status updates
	 */
	constructor( article, options ) {
		this.article = article;

		this.options = {
			linkContainer: null,
			onUpdate: () => {},
			...options,
		};

		// Render a fake watch button that required in watchlist popup
		this.$watchLink = $( '<a class="instantDiffs-watch-dummy">' );
		utils.embed( this.$watchLink, this.options.linkContainer );

		// Get configuration for the ajax watch
		const config = getModuleExport( 'mediawiki.page.watch.ajax', 'config.json' ) || {};
		if ( !this.article.isForeign ) {
			this.watchlistExpiryEnabled = config.WatchlistExpiry || false;
			this.watchlistLabelsEnabled = config.EnableWatchlistLabels || false;
			this.watchstarPopoverEnabled = config.EnableWatchstarPopover || mw.util.getParamValue( 'watchstarpopover' ) === '1' || false;
		}
		this.isWatchListPopupEnabled = settings.get( 'showWatchlistPopup' ) &&
			( this.watchlistExpiryEnabled || this.watchlistLabelsEnabled );
		this.isWatchstarPopoverEnabled = this.watchstarPopoverEnabled && this.isWatchListPopupEnabled;

		// Preload the notification module for mw.notify
		const modulesToLoad = [ 'mediawiki.notification' ];

		// Preload modules required for the popup in parallel with the initial watch API call.
		if ( this.watchlistExpiryEnabled || this.watchlistLabelsEnabled ) {
			if ( this.watchstarPopoverEnabled ) {
				modulesToLoad.push( 'mediawiki.watchstar.popover' );
			} else {
				modulesToLoad.push( 'mediawiki.watchstar.widgets' );
			}
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
	 * @returns {JQuery.Promise} API request promise
	 */
	async request() {
		await this.preloadMessages();

		this.preferredExpiry = mw.user.options.get( 'watchstar-expiry', 'infinity' );
		this.isWatched = this.article.get( 'watched' );

		if ( this.isWatchstarPopoverEnabled ) {
			return this.requestModules();
		} else {
			return this.requestWatchStatus();
		}
	}

	/**
	 * Loads watchlist widget modules and determines whether to show a popup or a basic status.
	 * @returns {Promise} Promise that resolves when modules are loaded and action is taken
	 * @private
	 */
	requestModules() {
		return mw.loader.using( 'mediawiki.watchstar.popover' ).then( ( require ) => {
			const popover = require( 'mediawiki.watchstar.popover' );

			// @since 1.47 a popup is shown (T417847)
			if ( utils.isObject( popover ) ) {
				return this.showWatchstarPopover();
			} else {
				return this.requestWatchStatus();
			}
		} );
	}

	/**
	 * Performs the watch/unwatch API request.
	 * @returns {JQuery.Promise} API request promise that resolves with watch status
	 * @private
	 */
	requestWatchStatus() {
		const title = this.article.getTitle().getPrefixedDb();

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
		const mwTitle = this.article.getTitle();
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
			const state = this.isWatched ? 'unwatch' : 'watch';
			this.updateStatus( this.$watchLink, state, 'idle', expiry, 'infinity' );
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
	 * Falls back to the basic notice if the notification widget fails to load or construct.
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
					expiryEnabled: this.watchlistExpiryEnabled,
					labelsEnabled: this.watchlistLabelsEnabled,
					$link: this.$watchLink,
					message: $message,
				},
			];

			// Remove the expiry argument added @since 1.45 (T265716)
			// for older MediaWiki versions.
			if ( utils.isLegacy( '1.45.0' ) ) {
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
				utils.logError( 'Watch', 'Falls back to basic watch/unwatch functionality.', error );
				this.showBasicNotice( mwTitle, message );
			}
		} );
	}

	/**
	 * Updates the article's watch status and related UI elements.
	 * - Updates the article watch status and button
	 * - Fires page update if the article matches the current page
	 * - Updates watchlist lines if on a watchlist page
	 * @param {mw.Title|JQuery<HTMLElement>} titleOrLink - Title or link element
	 * @param {('watch'|'unwatch')} action - Next available action
	 * @param {('idle'|'loading')} state - Current state
	 * @param {string} [expiry='infinity'] - Expiry timestamp or 'infinity'
	 * @param {string} [expirySelected='infinity'] - Selected expiry value
	 */
	updateStatus = (
		titleOrLink,
		action,
		state,
		expiry = 'infinity',
		expirySelected = 'infinity',
	) => {
		const watched = action === 'unwatch';

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

	/******* POPOVER *******/

	/**
	 * Shows the watchstar popover interface for managing watch status, expiry, and labels.
	 * @since MediaWiki 1.47 (T417847)
	 * @returns {JQuery.Promise} Promise that resolves when popover is shown or toggled
	 * @private
	 */
	showWatchstarPopover() {
		if ( this.watchstarPopover ) {
			this.resetWatchstarPopover();
			return $.Deferred().resolve().promise();
		}

		return mw.loader.using( 'mediawiki.watchstar.popover' )
			.then( require => {
				const Vue = require( 'vue' );
				const { WatchlistPopup, dataExpiryOptions } = require( 'mediawiki.watchstar.popover' ) ?? {};

				this.watchstarPopoverWrapper = h( 'span.mw-watchlink-popup' );
				utils.embed( this.watchstarPopoverWrapper, document.body );

				this.watchstarPopoverApp = Vue.createMwApp( WatchlistPopup, {
					initialAction: this.isWatched ? 'unwatch' : 'watch',
					expiryEnabled: this.watchlistExpiryEnabled,
					labelsEnabled: this.watchlistLabelsEnabled,
					title: this.article.getTitle(),
					dataExpiryOptions: dataExpiryOptions,
					preferredExpiry: this.preferredExpiry,
					link: this.$watchLink[ 0 ],
					placement: 'right-start',
					// On mobile the popover is shown as a bottom sheet.
					useBottomSheet: utils.isMF(),
				} );
				this.watchstarPopover = this.watchstarPopoverApp.mount( this.watchstarPopoverWrapper );

				window.addEventListener( 'WatchlistPopup.loading', this.onWatchlistPopupLoading );
				window.addEventListener( 'WatchlistPopup.watch', this.onWatchlistPopupWatch );
				window.addEventListener( 'WatchlistPopup.unwatch', this.onWatchlistPopupUnwatch );

				this.resetWatchstarPopover();
			} );
	}

	/**
	 * Resets the watchstar popover instance idle state.
	 * @private
	 */
	resetWatchstarPopover() {
		// Re-set to idle.
		const state = this.isWatched ? 'unwatch' : 'watch';
		this.updateStatus( this.$watchLink, state, 'idle' );

		if ( this.watchstarPopover.isOpen ) {
			this.watchstarPopover.isOpen = false;
		} else {
			this.watchstarPopover.openPopup( this.$watchLink[ 0 ] );
		}
	}

	/**
	 * Unmounts and removes the watchstar popover and event listeners.
	 * @private
	 */
	destroyWatchstarPopover() {
		window.removeEventListener( 'WatchlistPopup.loading', this.onWatchlistPopupLoading );
		window.removeEventListener( 'WatchlistPopup.watch', this.onWatchlistPopupWatch );
		window.removeEventListener( 'WatchlistPopup.unwatch', this.onWatchlistPopupUnwatch );

		this.watchstarPopoverApp.unmount();
		this.watchstarPopoverWrapper.remove();

		this.watchstarPopoverApp = null;
		this.watchstarPopover = null;
		this.watchstarPopoverWrapper = null;
	}

	/**
	 * Event handler for WatchlistPopup watch events.
	 * Updates watch status to the loading state.
	 * @param {CustomEvent} event - Custom event with watch response details
	 * @private
	 */
	onWatchlistPopupLoading = ( event ) => {
		const state = this.isWatched ? 'unwatch' : 'watch';
		this.updateStatus( this.$watchLink, state, 'loading' );
	};

	/**
	 * Event handler for WatchlistPopup watch events.
	 * Updates watch status to watched state with expiry information.
	 * @param {CustomEvent} event - Custom event with watch response details
	 * @private
	 */
	onWatchlistPopupWatch = ( event ) => {
		this.isWatched = true;
		const expiry = event.detail?.watchResponse
			? event.detail.watchResponse.expiry || event.detail.watchResponse._rawValue?.expiry
			: 'infinity';
		this.updateStatus( this.$watchLink, 'unwatch', 'idle', expiry );
	};

	/**
	 * Event handler for WatchlistPopup unwatch events.
	 * Updates watch status to unwatched state.
	 * @param {CustomEvent} event - Custom event with unwatch response details
	 * @private
	 */
	onWatchlistPopupUnwatch = ( event ) => {
		this.isWatched = false;
		this.updateStatus( this.$watchLink, 'watch', 'idle' );
	};

	/******* ACTIONS *******/

	/**
	 * Gets the associated Article instance.
	 * @returns {import('./Article').default} The Article instance
	 */
	getArticle() {
		return this.article;
	}

	/**
	 * Cleans up and detaches watch-related UI elements and event listeners.
	 */
	detach() {
		// Detach watchstar popover and associated events
		if ( this.watchstarPopover ) {
			this.destroyWatchstarPopover();
		}

		// Detach the fake watch button
		this.$watchLink.detach();
	}
}

export default Watch;