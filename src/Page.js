import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { getDependencies } from './utils-article';
import { getEntitySchemaLabel, getWikilambdaLabel, isWbContentModel } from './utils-api';

import Api from './Api';
import ConfigManager from './ConfigManager';
import RequestManager from './RequestManager';
import Navigation from './Navigation';
import settings from './settings';

import './styles/page.less';

/**
 * Class representing a Page.
 * @mixes OO.EventEmitter
 */
class Page {
	/**
	 * @type {typeof utilsPage}
	 */
	static utils = utilsPage;

	/**
	 * @type {string}
	 */
	type = 'abstract';

	/**
	 * @type {import('./Article').default}
	 */
	article;

	/**
	 * @type {Object}
	 */
	options = {};

	/**
	 * @type {Object}
	 */
	articleParams = {};

	/**
	 * @type {Object}
	 */
	error;

	/**
	 * @type {Object}
	 */
	errorData;

	/**
	 * @type {Object}
	 */
	nodes = {};

	/**
	 * @type {Object}
	 */
	links = {};

	/**
	 * @type {import('./ConfigManager').default}
	 */
	configManager;

	/**
	 * @type {import('./ConfigManager').default}
	 */
	userOptionsManager;

	/**
	 * @type {import('./RequestManager').default}
	 */
	requestManager;

	/**
	 * @type {JQuery.Promise|Promise}
	 */
	loadPromise;

	/**
	 * @type {import('./Navigation').default}
	 */
	navigation;

	/**
	 * @type {boolean}
	 */
	isLoading = false;

	/**
	 * @type {boolean}
	 */
	isLoaded = false;

	/**
	 * @type {boolean}
	 */
	isConfigsChanged = false;

	/**
	 * @type {boolean}
	 */
	isDetached = false;

	/**
	 * Create a diff instance.
	 * @param {import('./Article').default} article - An Article instance
	 * @param {Object} [options] - Configuration options
	 * @param {string[]} [options.initiatorAction] - An action name
	 * @param {import('./Page').default} [options.initiatorPage] - A Page instance
	 * @param {boolean} [options.fireDiffHook] - Fire 'wikipage.diff' hook on fire method
	 * @param {boolean} [options.fireContentHook] - Fire 'wikipage.content' hook on fire method
	 */
	constructor( article, options ) {
		this.article = article;

		this.options = {
			initiatorAction: null,
			initiatorPage: null,
			fireDiffHook: true,
			fireContentHook: true,
			...options,
		};

		this.articleParams = {
			action: 'render',
			diffonly: this.article.get( 'type' ) === 'diff' ? 1 : 0,
			unhide: settings.get( 'unHideDiffs' ) ? 1 : 0,
			uselang: id.local.userLanguage,
		};

		this.configManager = new ConfigManager( {
			wgTitle: false,
			wgPageName: false,
			wgRelevantPageName: false,
			wgPageContentModel: 'wikitext',
			wgNamespaceNumber: false,
			wgArticleId: false,
			wgRelevantArticleId: false,
			wgCurRevisionId: false,
			wgRevisionId: false,
			wgDiffOldId: false,
			wgDiffNewId: false,
			wgCanonicalSpecialPageName: false,
			wgIsProbablyEditable: false,
			wgRelevantPageIsProbablyEditable: false,
			wbEntityId: false,
			'thanks-confirmation-required': true,
		} );

		this.userOptionsManager = new ConfigManager( {}, mw.user.options );

		this.requestManager = new RequestManager();

		// Mixin constructor
		OO.EventEmitter.call( this );
	}

	/**
	 * Load and request all necessary dff content.
	 * @returns {JQuery.Promise|Promise}
	 */
	load() {
		if ( this.isLoading ) return this.loadPromise;

		this.isLoading = true;
		this.isLoaded = false;
		this.error = null;
		this.errorData = null;

		return this.loadPromise = this.preloadProcess();
	}

	/**
	 * Preloading process that combines multiple requests into the one promise.
	 * @returns {JQuery.Promise|Promise}
	 */
	preloadProcess() {
		const promises = this.getPreloadPromises();

		return Promise.allSettled( promises )
			.then( this.loadProcess.bind( this ) );
	}

	/**
	 * Loading process that combines multiple requests into the one promise.
	 * @returns {JQuery.Promise|Promise}
	 */
	loadProcess() {
		const promises = this.getLoadPromises();

		return Promise.allSettled( promises )
			.then( this.onLoadResponse )
			.then( this.loadProcessSecondary );
	}

	/**
	 * Secondary loading process that chains multiple requests into one promise.
	 * Process fires in a chain only after the main request because it needs additional data.
	 * @returns {Promise}
	 */
	loadProcessSecondary = () => {
		const promises = this.getLoadSecondaryPromises();

		return Promise.allSettled( promises );
	};

	/**
	 * Get a promise array for the preload request.
	 * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
	 */
	getPreloadPromises() {
		return [
			this.requestCompare(),
		];
	}

	/**
	 * Get a promise array for the main load request.
	 * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
	 */
	getLoadPromises() {
		return [
			this.requestPageInfo(),
			this.request(),
		];
	}

	/**
	 * Get a promise array for the secondary load request.
	 * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
	 */
	getLoadSecondaryPromises() {
		return [
			this.requestWBLabel(),
		];
	}

	/**
	 * Event that emits after the load complete.
	 * @private
	 */
	onLoadResponse = async () => {
		this.isLoading = false;
		this.isLoaded = true;

		// The Page can be already detached from the DOM
		if ( this.isDetached ) return;

		// Do not render content when the request was programmatically aborted
		if ( this.error?.statusText === 'abort' ) return;

		// Render content and fire hooks
		if ( !utils.isEmpty( this.data ) ) {
			await this.renderSuccess();
		} else
			await this.renderError();
	};

	/******* REQUESTS *******/

	/**
	 * Request a diff content.
	 * @returns {JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise}
	 */
	request() {
		return this.requestProcess()
			.done( this.onRequestDone )
			.fail( this.onRequestError );
	}

	/**
	 * Request process.
	 * @returns {JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise}
	 */
	requestProcess() {
		return this.requestManager.when();
	}

	/**
	 * Event that emits after the request failed.
	 * @private
	 */
	onRequestError = ( error, data ) => {
		this.error = error;
		this.errorData = data?.error;
	};

	/**
	 * Event that emits after the request successive.
	 * @private
	 */
	onRequestDone = ( data ) => {
		this.data = data;
	};

	/**
	 * Request compare pages.
	 * @returns {Promise}
	 */
	requestCompare() {
		const values = this.article.getValues();

		// Check if there are no errors,
		// then check if it's a comparePages type variant of the diff,
		// then check if oldid and diff are not the valid ids,
		// otherwise terminate.
		if (
			this.error ||
			values.typeVariant !== 'comparePages' ||
			( utils.isValidID( values.oldid ) && utils.isValidID( values.diff ) )
		) {
			return $.Deferred().resolve().promise();
		}

		const params = {
			action: 'compare',
			prop: [ 'title', 'ids', 'timestamp', 'comment' ],
			fromrev: utils.isValidID( values.rev1 ) ? values.rev1 : undefined,
			fromtitle: !utils.isEmpty( values.page1 ) ? values.page1 : undefined,
			torev: utils.isValidID( values.rev2 ) ? values.rev2 : undefined,
			totitle: !utils.isEmpty( values.page2 ) ? values.page2 : undefined,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
		};

		return this.requestManager
			.get( params, values.hostname )
			.then( this.onRequestCompareDone )
			.fail( this.onRequestCompareError );
	}

	/**
	 * Event that emits after the compare request failed.
	 * @private
	 */
	onRequestCompareError = ( error, data ) => {
		this.onRequestError( error, data );
	};

	/**
	 * Event that emits after the compare request successive.
	 * @private
	 */
	onRequestCompareDone = ( data ) => {
		// Render error if the compare request is completely failed
		const compare = data?.compare;
		if ( !compare ) {
			return this.onRequestCompareError( null, data );
		}

		// Set article values
		this.article.set( {
			oldid: compare.fromrevid,
			diff: compare.torevid,
			page1: compare.fromtitle,
			page2: compare.totitle,
			title: utils.getCompareTitle( compare ),
			section: utils.getCompareSection( compare ),
		} );
	};

	/**
	 * Request page current revision id.
	 * @returns {Promise}
	 */
	async requestPageInfo() {
		const oldid = Math.max( this.article.get( 'revid' ), this.article.get( 'oldid' ) );
		const pageid = this.article.get( 'curid' );
		const title = this.article.get( 'title' );

		const params = {};
		if ( utils.isValidID( oldid ) ) {
			params.revids = oldid;
		} else if ( utils.isValidID( pageid ) ) {
			params.pageids = pageid;
		} else if ( !utils.isEmpty( title ) ) {
			params.titles = title;
		}

		const data = await Api.getPageInfo( params, this.article.get( 'hostname' ), this.requestManager );
		if ( data ) {
			const props = data.pageprops || {};
			const entity = data.entityterms || {};

			// Set values for mw.config
			this.configManager.setValues( {
				wgArticleId: data.pageid,
				wgRelevantArticleId: data.pageid,
				wgCurRevisionId: data.lastrevid,
				wgContentLanguage: data.pagelanguage,
				wgContentLanguageDir: data.pagelanguagedir,
				wgPageContentModel: data.contentmodel,
				wgIsProbablyEditable: data.actions?.edit,
				wgRelevantPageIsProbablyEditable: data.actions?.edit,
				wbEntityId:
					props[ 'wikibase_item' ] ||
					( isWbContentModel( data.contentmodel ) && data.title ) ||
					this.configManager.get( 'wbEntityId' ),
			} );

			// Set article values
			this.article.setValues( {
				title: data.title,
				curid: data.pageid,
				curRevid: data.lastrevid,
				watched: data.watched,
				expiry: data.watchlistexpiry,
				notificationtimestamp: data.notificationtimestamp,
				new: data.new,
				label:
					( isWbContentModel( data.contentmodel ) && entity.label?.[ 0 ] ) ||
					( data.contentmodel === 'EntitySchema' && getEntitySchemaLabel( props[ 'displaytitle' ] ) ) ||
					( data.contentmodel === 'zobject' && getWikilambdaLabel( props ) ) ||
					this.article.get( 'label' ),
			} );

			// Set additional config variables
			this.setConfigs();
		}
	}

	/**
	 * Request a label name from Wikibase.
	 * @returns {Promise}
	 */
	async requestWBLabel() {
		// Check if there are no errors,
		// then check if a label is empty,
		// then check if it's a wikibase entity content model,
		// otherwise terminate.
		if (
			this.error ||
			!utils.isEmpty( this.article.get( 'label' ) ) ||
			!isWbContentModel( this.configManager.get( 'wgPageContentModel' ) )
		) {
			return $.Deferred().resolve().promise();
		}

		const title = this.article.getMW( 'title' )?.getMain();
		const label = await Api.getWBLabel( title, this.article.get( 'hostname' ), this.requestManager );
		if ( !utils.isEmpty( label ) ) {
			this.configManager.set( 'wbEntityId', title );
			this.article.setValue( 'label', label );

			// Set additional config variables
			this.setConfigs();
		}
	}

	/**
	 * Mark edit as seen in the watchlist.
	 */
	markAsSeen() {
		// Check if there are no errors,
		// then check if the user allows the "mark as viewed" option,
		// then check if it's a foreign article, because the local article will be marked automatically,
		// then check if an article has a revision timestamp and last viewed timestamp,
		// otherwise terminate.
		if (
			this.error ||
			!settings.get( 'markWatchedLine' ) ||
			!this.article.isForeign ||
			utils.isEmpty( this.article.get( 'timestamp' ) ) ||
			utils.isEmpty( this.article.get( 'notificationtimestamp' ) )
		) {
			return;
		}

		// Check if revision timestamp is newer then last-viewed timestamp
		const lastTime = new Date( this.article.get( 'notificationtimestamp' ) ).getTime();
		const revTime = new Date( this.article.get( 'timestamp' ) ).getTime();
		if ( revTime < lastTime ) return;

		// Mark revision and all earlier revisions as viewed
		const params = {
			titles: this.article.get( 'titleText' ),
			newerthanrevid: this.article.get( 'revid' ),
		};
		Api.markAsSeen( params, this.article.get( 'hostname' ) );
	}

	/**
	 * Abort all requests that were added via the request manager.
	 */
	abort() {
		if ( !this.isLoading ) return;
		this.requestManager.abort();
	}

	/******* RENDER *******/

	async renderSuccess() {
		await this.render();

		// Mark the page as seen in the watchlist
		this.markAsSeen();

		mw.hook( `${ id.config.prefix }.page.renderSuccess` ).fire( this );
		mw.hook( `${ id.config.prefix }.page.renderComplete` ).fire( this );
	}

	async renderError() {
		const type = this.article.get( 'type' );
		const typeVariant = this.article.get( 'typeVariant' );

		// Create error object
		const code = typeVariant === 'page'
			? 'curid' : typeVariant === 'comparePages'
				? 'compare-pages' : 'generic';

		this.error = {
			type,
			code,
			status: this.error?.status,
			statusText: this.error?.statusText,
			message: this.errorData?.info || utils.getErrorStatusText( this.error?.status ),
		};

		// Show a critical notification popup
		utils.notifyError( `error-${ this.error.type }-${ this.error.code }`, this.error, this.article );

		await this.render();

		mw.hook( `${ id.config.prefix }.page.renderError` ).fire( this );
		mw.hook( `${ id.config.prefix }.page.renderComplete` ).fire( this );
	}

	async render() {
		const classes = [
			'instantDiffs-page',
			`instantDiffs-page--${ this.type }`,
			`instantDiffs-page--${ this.article.get( 'type' ) }`,
			'mw-body-content',
		];

		const bodyClasses = [
			'instantDiffs-page-body',
			`instantDiffs-page-body--${ this.type }`,
			`instantDiffs-page-body--${ this.article.get( 'type' ) }`,
		];

		const skinClasses = id.config.skinBodyClasses[ mw.config.get( 'skin' ) ];
		if ( skinClasses ) {
			classes.push( ...skinClasses );
		}

		this.nodes.$container = $( '<div>' )
			.attr( 'dir', document.dir )
			.addClass( classes );

		this.nodes.$tools = $( '<div>' )
			.addClass( 'instantDiffs-page-tools' )
			.appendTo( this.nodes.$container );

		this.nodes.$body = $( '<div>' )
			.addClass( bodyClasses )
			.appendTo( this.nodes.$container );

		await this.renderContent();
		await this.renderNavigation();
	}

	async renderContent() {
		if ( this.error ) {
			await this.renderErrorContent();
		} else {
			await this.renderSuccessContent();
		}
	}

	async renderErrorContent() {
		const message = utils.getErrorMessage( `error-${ this.error.type }-${ this.error.code }`, this.error, this.article );
		const $content = $( `<p>${ message }</p>` );
		this.renderWarning( { $content } );
	}

	renderWarning( { $content, type = 'warning', container = this.nodes.$body, insertMethod = 'prependTo' } ) {
		const $box = utils.renderMessageBox( { $content, type } );
		utils.embed( $box, container, insertMethod );
		return $box;
	}

	async renderSuccessContent() {
		// Restore functionally that not requires that elements are in the DOM
		await this.restoreFunctionality();

		// Request lazy-loaded dependencies
		this.requestDependencies();
	}

	async renderNavigation() {
		this.navigation = new Navigation( this, this.article, this.articleParams, {
			initiatorAction: this.options.initiatorAction,
			links: this.links,
		} );
		this.navigation.embed( this.nodes.$container, 'prependTo' );
	}

	/**
	 * Request dependencies for the article and additional data modules.
	 * @param {Object} [data]
	 * @param {Array} [data.modulestyles]
	 * @param {Array} [data.modulescripts]
	 * @param {Array} [data.modules]
	 * @returns {JQuery.Promise}
	 */
	requestDependencies( data = {} ) {
		const { modulestyles = [], modulescripts = [], modules = [] } = data;

		const dependencies = [
			...getDependencies( this.article ),
			...modulestyles,
			...modulescripts,
			...modules,
		];

		return mw.loader.using( utils.getDependencies( dependencies ) );
	}

	/******* HELPERS *******/

	async restoreFunctionality() {
		if ( this.error ) return;

		// Restore file media info
		this.nodes.$mediaInfoView = this.nodes.$body.find( 'mediainfoview' );
		if ( this.article.get( 'type' ) === 'revision' && this.nodes.$mediaInfoView.length > 0 ) {
			const content = await utilsPage.restoreFileMediaInfo( this.nodes.$mediaInfoView );
			if ( content ) {
				utils.embed( content, this.nodes.$diffTitle, 'insertAfter' );
			}
		}
	}

	getScrollableSection() {
		const name = this.article.get( 'hash' );
		if ( !utils.isEmpty( name ) ) {
			return utils.getTargetFromFragment( name, this.nodes.$body );
		}
	}

	getScrollableOffsetTop() {
		return this.getNavigation()?.getOuterHeight( true );
	}

	/******* ACTIONS *******/

	/**
	 * Fire hooks and events.
	 */
	async fire() {
		// Fire hook on ready
		mw.hook( `${ id.config.prefix }.page.ready` ).fire( this );

		// Fire navigation events
		this.getNavigation()?.fire();

		// Fire wikipage hooks
		if ( this.options.fireDiffHook ) {
			// Fire diff table hook
			const $diffTable = this.getDiffTable();
			if ( this.article.get( 'type' ) === 'diff' && $diffTable?.length > 0 ) {
				mw.hook( 'wikipage.diff' ).fire( $diffTable );
			}
		}
		if ( this.options.fireContentHook ) {
			// Fire content hook
			const $container = this.getContainer();
			if ( $container?.length > 0 ) {
				mw.hook( 'wikipage.content' ).fire( $container );
			}
		}

		// Replace link target attributes after the hooks have fired
		utils.addTargetToLinks( this.nodes.$container );

		// Fire hook on complete
		mw.hook( `${ id.config.prefix }.page.complete` ).fire( this );
	}

	focus() {
		this.emit( 'focus' );
	}

	setConfigs() {
		this.isConfigsChanged = true;
		this.configManager.apply();
		this.userOptionsManager.apply();
	}

	restoreConfigs() {
		if ( !this.isConfigsChanged ) return;

		this.isConfigsChanged = false;
		this.configManager.restore();
		this.userOptionsManager.restore();
	}

	/**
	 * Get the Article instance.
	 * @returns {import('./Article').default}
	 */
	getArticle() {
		return this.article;
	}

	/**
	 * Get the formated page title.
	 * Uses as the Dialog's title.
	 * @returns {string}
	 */
	getArticleTitleText() {
		const values = this.article.getValues();

		let title;
		if ( !utils.isEmpty( values.page1Text ) && !utils.isEmpty( values.page2Text ) ) {
			title = `${ values.page1Text } → ${ values.page2Text }`;
		} else if ( !utils.isEmpty( values.titleText ) ) {
			title = values.titleText;
		} else {
			title = utils.msg( this.error ? 'dialog-title-not-found' : 'dialog-title-empty' );
		}

		if ( !utils.isEmpty( values.label ) ) {
			return `${ values.label } (${ title })`;
		}

		return title;
	}

	getArticleParams() {
		return this.articleParams;
	}

	getContainer() {
		return this.nodes.$container;
	}

	getDiffTable() {
		return this.nodes.$table;
	}

	getInitiatorPage() {
		return this.options.initiatorPage;
	}

	getNavigation() {
		return this.navigation;
	}

	close() {
		this.emit( 'close' );
	}

	detach() {
		if ( this.isDetached ) return;

		mw.hook( `${ id.config.prefix }.page.beforeDetach` ).fire( this );

		this.abort();
		this.restoreConfigs();
		this.getNavigation()?.detach();
		this.getContainer()?.detach();
		this.isDetached = true;
	}
}

export default Page;