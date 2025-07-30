import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { getDependencies } from './utils-article';
import { getEntitySchemaLabel, getWikilambdaLabel, isWbContentModel } from './utils-api';

import Api from './Api';
import ConfigManager from './ConfigManager';
import RequestManager from './RequestManager';
import Navigation from './Navigation';

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
     * @param {import('./Article').default} article a page object
     * @param {Object} [options] configuration options
     * @param {string[]} [options.initiatorAction] an action name
     * @param {import('./Page').default} [options.initiatorPage] a Page instance
     * @param {boolean} [options.fireDiffHook] fire 'wikipage.diff' hook on fire method
     * @param {boolean} [options.fireContentHook] fire 'wikipage.content' hook on fire method
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
            unhide: utils.defaults( 'unHideDiffs' ) ? 1 : 0,
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

        return this.loadPromise = this.loadProcess();
    }

    /**
     * Load process that combines multiple requests into the one promise.
     * @returns {JQuery.Promise|Promise}
     */
    loadProcess() {
        const promises = this.getLoadPromises();

        return Promise.allSettled( promises )
            .then( this.onLoadResponse )
            .then( this.loadProcessSecondary );
    }

    /**
     * Secondary load process that chains multiple requests into one promise.
     * Process fires in a chain only after the main request because it needs additional data.
     * @returns {Promise}
     */
    loadProcessSecondary = () => {
        const promises = this.getLoadSecondaryPromises();

        return Promise.allSettled( promises );
    };

    /**
     * Get promise array for the main load request.
     * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
     */
    getLoadPromises() {
        return [
            this.requestPageInfo(),
            this.request(),
        ];
    }

    /**
     * Get promise array for the secondary load request.
     * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
     */
    getLoadSecondaryPromises() {
        return [
            this.requestWBLabel(),
        ];
    }

    /**
     * Event that emits after the load complete.
     */
    onLoadResponse = async () => {
        this.isLoading = false;
        this.isLoaded = true;

        // The Diff can be already detached from the DOM
        if ( this.isDetached ) return;

        // Do mot render content when request was programmatically aborted
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
            .done( this.onRequestDone.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
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
     */
    onRequestError( error, data ) {
        this.error = error;
        this.errorData = data?.error;
    }

    /**
     * Event that emits after the request successive.
     */
    onRequestDone( data ) {
        this.data = data;
    }

    /**
     * Request page current revision id.
     * @returns {Promise}
     */
    async requestPageInfo() {
        const oldid = Math.max( this.article.get( 'revid' ), this.article.get( 'oldid' ) );
        const pageid = this.article.get( 'curid' );

        const params = {};
        if ( utils.isValidID( oldid ) ) {
            params.revids = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.pageids = pageid;
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
        // then check is it's a wikibase entity content model,
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

    markAsSeen() {
        // Check if there are no errors,
        // then check if the "mark as viewed" option is allowed by user,
        // then check if it's a foreign article, because local article will be marked automatically,
        // then check if an article has revision timestamp and last viewed timestamp,
        // otherwise terminate.
        if (
            this.error ||
            !utils.defaults( 'markWatchedLine' ) ||
            !this.article.isForeign ||
            utils.isEmpty( this.article.get( 'timestamp' ) ) ||
            utils.isEmpty( this.article.get( 'notificationtimestamp' ) )
        ) {
            return;
        }

        // Check if revision timestamp is newer then last viewed timestamp
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
     * Abort all requests that were added via request manager.
     */
    abort() {
        if ( !this.isLoading ) return;
        this.requestManager.abort();
    }

    /******* RENDER *******/

    async renderSuccess() {
        await this.render();

        // Mark page as seen in watchlist
        this.markAsSeen();

        mw.hook( `${ id.config.prefix }.page.renderSuccess` ).fire( this );
        mw.hook( `${ id.config.prefix }.page.renderComplete` ).fire( this );
    }

    async renderError() {
        // Create error object
        this.error = {
            type: this.article.get( 'type' ),
            code: this.article.get( 'typeVariant' ) === 'page' ? 'curid' : 'generic',
            status: this.error?.status,
            statusText: this.error?.statusText,
            message: this.errorData?.info || utils.getErrorStatusText( this.error?.status ),
        };

        // Show critical notification popup
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

        if ( this.error ) {
            await this.renderErrorContent();
        } else {
            await this.renderContent();
        }

        this.renderNavigation();
    }

    async renderContent() {
        // Restore functionally that not requires that elements are in the DOM
        await this.restoreFunctionality();

        // Request lazy-loaded dependencies
        this.requestDependencies();
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

    renderNavigation() {
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

    /******* RESTORE FUNCTIONALITY *******/

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

    /******* ACTIONS *******/

    /**
     * Fire hooks and events.
     */
    async fire() {
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

    getArticleTitleText() {
        if ( utils.isEmpty( this.article.get( 'title' ) ) ) {
            return utils.msg( this.error ? 'dialog-title-not-found' : 'dialog-title-empty' );
        }
        if ( !utils.isEmpty( this.article.get( 'label' ) ) ) {
            return `${ this.article.get( 'label' ) } (${ this.article.get( 'titleText' ) })`;
        }
        return this.article.get( 'titleText' );
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