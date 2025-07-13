import id from './id';
import * as utils from './utils';

import RequestManager from './RequestManager';
import Navigation from './Navigation';

import './styles/page.less';
import { getWBLabel } from './utils-api';

/**
 * Class representing a Diff.
 * @mixes OO.EventEmitter
 */
class Page {
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
    mwConfig = {
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
        wbEntityId: false,
        'thanks-confirmation-required': true,
    };

    /**
     * @type {Object}
     */
    mwUserOptions = {};

    /**
     * @type {Object}
     */
    nodes = {};

    /**
     * @type {Object}
     */
    links = {};

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
        const promises = [
            this.request(),
        ];

        // Add a request for the wikidata label name
        if ( this.article.get( 'origin' ).includes( 'www.wikidata.org' ) ) {
            promises.push( this.requestWBLabel() );
        }

        return Promise.allSettled( promises )
            .then( this.onLoadResponse );
    }

    /**
     * Event that emits after the load complete.
     */
    onLoadResponse = () => {
        this.isLoading = false;
        this.isLoaded = true;

        // The Diff can be already detached from the DOM
        if ( this.isDetached ) return;

        // Do mot render content when request was programmatically aborted
        if ( this.error?.statusText === 'abort' ) return;

        // Render content and fire hooks
        if ( !utils.isEmpty( this.data ) ) {
            this.renderSuccess();
        } else
            this.renderError();
    };

    /******* REQUESTS *******/

    /**
     * Request a diff content.
     * @returns {JQuery.Promise|Promise}
     */
    request() {
        return this.requestProcess()
            .done( this.onRequestDone.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
    }

    /**
     * Request process.
     * @returns {JQuery.Promise|Promise}
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
     * Request wikidata label name.
     * @returns {JQuery.Promise}
     */
    async requestWBLabel() {
        if ( this.error ) return $.Deferred().resolve();

        const title = this.article.getMW( 'title' )?.getMain();
        const label = await getWBLabel( title, this.article.get( 'origin' ) );
        if ( !utils.isEmpty( label ) ) {
            this.mwConfig.wbEntityId = title;
            this.article.setValue( 'wbLabel', label );
        }
    }

    abort() {
        if ( !this.isLoading ) return;
        this.requestManager.abort();
    }

    /******* RENDER *******/

    renderSuccess() {
        this.render();

        mw.hook( `${ id.config.prefix }.page.renderSuccess` ).fire( this );
        mw.hook( `${ id.config.prefix }.page.renderComplete` ).fire( this );
    }

    renderError() {
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

        this.render();

        mw.hook( `${ id.config.prefix }.page.renderError` ).fire( this );
        mw.hook( `${ id.config.prefix }.page.renderComplete` ).fire( this );
    }

    render() {
        const classes = [
            'instantDiffs-page',
            `instantDiffs-page--${ this.article.get( 'type' ) }`,
            'mw-body-content',
            `mw-content-${ document.dir }`,
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
            .addClass( 'instantDiffs-page-body' )
            .appendTo( this.nodes.$container );

        if ( this.error ) {
            this.renderErrorContent();
        } else {
            this.renderContent();
        }

        this.renderNavigation();
    }

    renderContent() {}

    renderErrorContent() {
        const message = utils.getErrorMessage( `error-${ this.error.type }-${ this.error.code }`, this.error, this.article );
        const $message = $( `<p>${ message }</p>` );
        this.renderWarning( $message );
    }

    renderWarning( $content, type = 'warning' ) {
        const $box = utils.renderMessageBox( { $content, type } );
        utils.embed( $box, this.nodes.$body, 'prependTo' );
    }

    renderNavigation() {
        this.navigation = new Navigation( this, this.article, this.articleParams, {
            initiatorAction: this.options.initiatorAction,
            links: this.links,
        } );
        this.navigation.embed( this.nodes.$container, 'prependTo' );
    }

    processLinksTaget() {
        if ( !utils.defaults( 'openInNewTab' ) ) return;

        const $links = this.nodes.$container.find( 'a:not(.mw-thanks-thank-link, .jquery-confirmable-element)' );
        $links.each( ( i, node ) => {
            // Add target attribute only to links with non-empty href.
            // Some scripts add links with href="#" - bypass those as well.
            const href = node.getAttribute( 'href' );
            if ( utils.isEmpty( href ) || href === '#' ) return;

            node.setAttribute( 'target', '_blank' );
        } );
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
        this.processLinksTaget();

        // Fire hook on complete
        mw.hook( `${ id.config.prefix }.page.complete` ).fire( this );
    }

    focus() {
        this.emit( 'focus' );
    }

    setConfigs() {
        mw.config.set( this.mwConfig );
        mw.user.options.set( this.mwUserOptions );
    }

    /**
     * Get the Article instance.
     * @returns {import('./Article').default}
     */
    getArticle() {
        return this.article;
    }

    getArticleTitleText() {
        if ( this.error ) return utils.msg( 'dialog-title-not-found' );
        if ( utils.isEmpty( this.article.get( 'title' ) ) ) return utils.msg( 'dialog-title-empty' );
        if ( !utils.isEmpty( this.article.get( 'wbLabel' ) ) ) {
            return `${ this.article.get( 'wbLabel' ) } (${ this.article.get( 'titleText' ) })`;
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
        this.getNavigation()?.detach();
        this.getContainer()?.detach();
        this.isDetached = true;
    }
}

export default Page;