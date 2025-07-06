import id from './id';
import * as utils from './utils';

import RequestManager from './RequestManager';
import Navigation from './Navigation';

/**
 * Class representing a Diff.
 * @mixes OO.EventEmitter
 */
class Diff {
    /**
     * @type {string}
     */
    type = 'abstract';

    /**
     * @type {object}
     */
    page = {};

    /**
     * @type {object}
     */
    options = {};

    /**
     * @type {object}
     */
    pageParams = {};

    /**
     * @type {object}
     */
    mwConfg = {
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
        'thanks-confirmation-required': true,
    };

    /**
     * @type {object}
     */
    mwUserOptions = {};

    /**
     * @type {object}
     */
    nodes = {};

    /**
     * @type {object}
     */
    links = {};

    /**
     * @type {import('./RequestManager').default}
     */
    requestManager;

    /**
     * @type {JQuery.Promise|Promise}
     */
    requestPromise;

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
    isDependenciesLoaded = false;

    /**
     * @type {boolean}
     */
    isDetached = false;

    /**
     * Create a diff instance.
     * @param {object} page a page object
     * @param {object} [options] configuration options
     * @param {string[]} [options.initiatorAction] an action name
     * @param {import('./Diff').default} [options.initiatorDiff] a Diff instance
     * @param {boolean} [options.fireWikipageHooks] fire wikipage hooks on fire method
     */
    constructor( page, options ) {
        this.page = { ...page };

        this.options = {
            initiatorAction: null,
            initiatorDiff: null,
            fireWikipageHooks: true,
            ...options,
        };

        this.pageParams = {
            action: 'render',
            diffonly: this.page.type === 'diff' ? 1 : 0,
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
        if ( !this.isLoading ) {
            this.requestPromise = this.loadProcess();
        }
        return this.requestPromise;
    }

    /**
     * Load process that combines multiple requests into one the promise.
     * @returns {JQuery.Promise|Promise}
     */
    loadProcess() {
        return this.request();
    }

    /******* REQUESTS *******/

    /**
     * Request a diff content.
     * @returns {JQuery.Promise|Promise}
     */
    request() {
        this.isLoading = true;
        this.isLoaded = false;
        this.error = null;

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
    onRequestError( error ) {
        this.isLoading = false;
        this.isLoaded = true;

        // The Diff can be already detached from the DOM
        if ( this.isDetached ) return;

        // Do mot render content when request was programmatically aborted
        if ( error?.statusText === 'abort' ) return;

        // Render content and fire hooks
        const status = this.renderError( error );
        if ( status ) {
            mw.hook( `${ id.config.prefix }.diff.renderError` ).fire( this );
            mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
        }
    }

    /**
     * Event that emits after the request successive.
     */
    onRequestDone( data ) {
        this.isLoading = false;
        this.isLoaded = true;

        // The Diff can be already detached from the DOM
        if ( this.isDetached ) return;

        // Render content and fire hooks
        const status = this.renderSuccess( data );
        if ( status ) {
            mw.hook( `${ id.config.prefix }.diff.renderSuccess` ).fire( this );
            mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
        }
    }

    abort() {
        if ( !this.isLoading ) return;
        this.requestManager.abort();
    }

    /******* RENDER *******/

    renderSuccess( data ) {
        // Render error if the data request is completely failed
        this.data = data;
        if ( !this.data ) {
            this.onRequestError();
            return false;
        }

        this.render();
        return true;
    }

    renderError( error ) {
        // Create error object
        this.error = {
            type: this.page.type,
            code: this.page.typeVariant === 'page' ? 'curid' : 'generic',
            message: utils.getErrorStatusText( error?.status ),
        };

        // Show critical notification popup
        utils.notifyError( `error-${ this.error.type }-${ this.error.code }`, this.error, this.page );

        this.render();
        return true;
    }

    render() {
        const classes = [
            'instantDiffs-view-content',
            `instantDiffs-view-content--${ this.page.type }`,
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
            .addClass( 'instantDiffs-view-tools' )
            .appendTo( this.nodes.$container );

        this.nodes.$body = $( '<div>' )
            .addClass( 'instantDiffs-view-body' )
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
        const message = utils.getErrorMessage( `error-${ this.error.type }-${ this.error.code }`, this.error, this.page );
        const $message = $( `<p>${ message }</p>` );
        this.renderWarning( $message );
    }

    renderWarning( $content, type = 'warning' ) {
        const $box = utils.renderMessageBox( { $content, type } );
        utils.embed( $box, this.nodes.$body, 'prependTo' );
    }

    renderNavigation() {
        this.navigation = new Navigation( this, this.page, this.pageParams, {
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
        if ( this.options.fireWikipageHooks ) {
            // Fire diff table hook
            const $diffTable = this.getDiffTable();
            if ( this.page.type === 'diff' && $diffTable?.length > 0 ) {
                mw.hook( 'wikipage.diff' ).fire( $diffTable );
            }

            // Fire content hook
            const $container = this.getContainer();
            if ( $container?.length > 0 ) {
                mw.hook( 'wikipage.content' ).fire( $container );
            }
        }

        // Replace link target attributes after the hooks have fired
        this.processLinksTaget();

        // Fire hook on complete
        mw.hook( `${ id.config.prefix }.diff.complete` ).fire( this );
    }

    focus() {
        this.emit( 'focus' );
    }

    setConfigs() {
        mw.config.set( this.mwConfg );
        mw.user.options.set( this.mwUserOptions );
    }

    /**
     * Get page.
     * @returns {object}
     */
    getPage() {
        return this.page;
    }

    getPageTitleText() {
        if ( this.error ) return utils.msg( 'dialog-title-not-found' );
        if ( utils.isEmpty( this.page.title ) ) return utils.msg( 'dialog-title-empty' );
        return this.page.titleText;
    }

    getPageParams() {
        return this.pageParams;
    }

    getContainer() {
        return this.nodes.$container;
    }

    getDiffTable() {
        return this.nodes.$table;
    }

    getInitiatorDiff() {
        return this.options.initiatorDiff;
    }

    getNavigation() {
        return this.navigation;
    }

    detach() {
        mw.hook( `${ id.config.prefix }.diff.beforeDetach` ).fire( this );

        this.abort();
        this.getNavigation()?.detach();
        this.getContainer()?.detach();
        this.isDetached = true;
    }
}

export default Diff;