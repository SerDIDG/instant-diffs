import id from './id';
import * as utils from './utils';
import * as utilsDiff from './utils-diff';
import { executeModuleScript } from './utils-oojs';

import Navigation from './Navigation';
import RequestManager from './RequestManager';

/**
 * Class representing a Diff.
 * @mixes OO.EventEmitter
 */
class Diff {
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
     * @type {Promise}
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
     */
    constructor( page, options ) {
        this.page = { ...page };

        this.options = {
            initiatorAction: null,
            initiatorDiff: null,
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
     * Request a Diff dependencies and html content.
     * @returns {Promise}
     */
    load() {
        if ( !this.isLoading ) {
            const promises = [
                this.requestPageIds(),
                this.request(),
            ];

            // Try to load page dependencies in parallel to the main request:
            // * for the revision view we need to know actual revision id;
            // * for the page view we need to know page id.
            if (
                ( this.page.type === 'revision' && utils.isValidID( this.page.revid ) ) ||
                ( this.page.typeVariant === 'page' && utils.isValidID( this.page.curid ) )
            ) {
                promises.push( this.requestPageDependencies() );
            }

            this.requestPromise = Promise.allSettled( promises );
        }
        return this.requestPromise;
    }

    /******* DEPENDENCIES *******/

    /**
     * Request page ids.
     * @returns {JQuery.Promise}
     */
    requestPageIds() {
        const params = {
            action: 'compare',
            prop: [ 'ids' ],
            torelative: 'cur',
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };

        const oldid = this.page.revid || this.page.oldid;
        const pageid = this.page.curid;
        if ( utils.isValidID( oldid ) ) {
            params.fromrev = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.fromid = pageid;
        }

        return this.requestManager
            .get( params )
            .then( ( data ) => this.onRequestPageIdsDone( data, params ) )
            .fail( ( message, data ) => this.onRequestPageIdsError( message, data, params ) );
    }

    onRequestPageIdsError( message, data, params ) {
        const error = {
            message,
            type: 'dependencies',
        };
        if ( data?.error ) {
            error.code = data.error.code;
            error.message = data.error.info;
        }
        const type = params.fromrev ? 'revid' : 'curid';
        utils.notifyError( `error-dependencies-${ type }`, error, this.page, true );
    }

    onRequestPageIdsDone( data, params ) {
        // Render error if the parse request is completely failed
        const compare = data?.compare;
        if ( !compare ) {
            return this.onRequestPageIdsError( null, data, params );
        }

        // Get values for mw.config
        this.mwConfg.wgArticleId = this.page.curid = compare.toid;
        this.mwConfg.wgCurRevisionId = this.page.curRevid = compare.torevid;

        // Set additional config variables
        this.setConfigs();
    }

    /**
     * Request page dependencies.
     * @returns {JQuery.Promise}
     */
    requestPageDependencies() {
        const params = {
            action: 'parse',
            prop: [ 'revid', 'modules', 'jsconfigvars' ],
            disablelimitreport: 1,
            redirects: 1,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };

        const oldid = this.mwConfg.wgDiffNewId || Math.max( this.page.revid, this.page.oldid );
        const pageid = this.mwConfg.wgArticleId || this.page.curid;
        if ( utils.isValidID( oldid ) ) {
            params.oldid = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.pageid = pageid;
        }

        return this.requestManager
            .get( params )
            .then( ( data ) => this.onRequestPageDependenciesDone( data, params ) )
            .fail( ( message, data ) => this.onRequestPageDependenciesError( message, data, params ) );
    }

    onRequestPageDependenciesError( message, data, params ) {
        this.isDependenciesLoaded = true;

        const error = {
            message,
            type: 'dependencies',
        };
        if ( data?.error ) {
            error.code = data.error.code;
            error.message = data.error.info;
        }
        const type = params.oldid ? 'revid' : 'curid';
        utils.notifyError( `error-dependencies-${ type }`, error, this.page, true );
    }

    onRequestPageDependenciesDone( data, params ) {
        this.isDependenciesLoaded = true;

        // Render error if the parse request is completely failed
        const parse = data?.parse;
        if ( !parse ) {
            return this.onRequestPageDependenciesError( null, data, params );
        }

        // Get values for mw.config
        this.mwConfg.wgArticleId = this.page.curid = parse.pageid;
        this.mwConfg.wgRevisionId = this.page.revid = Math.max( this.page.revid, parse.revid );
        this.mwConfg = { ...this.mwConfg, ...parse.jsconfigvars };

        // Set additional config variables
        this.setConfigs();

        // Get page dependencies
        let dependencies = [ ...parse.modulestyles, ...parse.modulescripts, ...parse.modules ];

        // Get dependencies by type
        const typeDependencies = id.config.dependencies[ this.page.type ];
        if ( typeDependencies ) {
            // Set common dependencies
            if ( typeDependencies[ '*' ] ) {
                dependencies = dependencies.concat( typeDependencies[ '*' ] );
            }

            // Set namespace-specific dependencies
            const pageNamespace = this.page.mwTitle?.getNamespaceId();
            if ( typeDependencies[ pageNamespace ] ) {
                dependencies = dependencies.concat( typeDependencies[ pageNamespace ] );
            }
        }

        mw.loader.load( utils.getDependencies( dependencies ) );
    }

    /******* REQUESTS *******/

    /**
     * Request a Diff html content.
     * @returns {JQuery.jqXHR}
     */
    request() {
        this.isLoading = true;
        this.isLoaded = false;
        this.error = null;

        const page = {
            title: !utils.isEmpty( this.page.title ) ? this.page.title : undefined,
            diff: !utils.isEmpty( this.page.diff ) ? this.page.diff : this.page.direction,
            oldid: !utils.isEmpty( this.page.oldid ) ? this.page.oldid : undefined,
            curid: !utils.isEmpty( this.page.curid ) ? this.page.curid : undefined,
        };

        const params = {
            url: id.local.mwEndPoint,
            dataType: 'html',
            data: $.extend( page, this.pageParams ),
        };

        return this.requestManager
            .ajax( params )
            .done( this.onRequestDone.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
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

        // Create error object
        this.error = {
            type: this.page.type,
            code: this.page.typeVariant === 'page' ? 'curid' : 'generic',
            message: utils.getErrorStatusText( error?.status ),
        };

        // Show critical notification popup
        utils.notifyError( `error-${ this.error.type }-${ this.error.code }`, this.error, this.page );

        // Render content and fire hooks
        this.render();
        mw.hook( `${ id.config.prefix }.diff.renderError` ).fire( this );
    }

    /**
     * Event that emits after the request successive.
     */
    onRequestDone( data ) {
        this.isLoading = false;

        // The Diff can be already detached from the DOM
        if ( this.isDetached ) return;

        // Render error if the data request is completely failed
        this.data = data;
        if ( !this.data ) {
            return this.onRequestError();
        }

        this.render();
        mw.hook( `${ id.config.prefix }.diff.renderSuccess` ).fire( this );
        mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
    }

    abort() {
        if ( !this.isLoading ) return;
        this.requestManager.abort();
    }

    /******* RENDER *******/

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
            this.renderError();
        } else {
            this.renderContent();
        }

        this.renderNavigation();
    }

    renderContent() {
        // Parse and append all data coming from endpoint
        this.nodes.data = $.parseHTML( this.data );
        this.nodes.$data = $( this.nodes.data ).appendTo( this.nodes.$body );

        // Collect missing data from the diff table before manipulations
        this.collectData();

        // Set additional config variables
        this.setConfigs();

        // Prepend content warnings
        this.nodes.$data
            .filter( '.cdx-message' )
            .prependTo( this.nodes.$body );
        this.nodes.$data
            .find( '.cdx-message ' )
            .prependTo( this.nodes.$body );

        // Render a warning when revision was not found
        const $emptyMessage = this.nodes.$data.filter( 'p' );
        if ( $emptyMessage.length > 0 ) {
            this.renderWarning( $emptyMessage );
        }

        // Process diff table
        this.processDiffTable();
        this.processFlaggedRevs();

        // Process revision
        if ( this.page.type === 'revision' ) {
            this.processRevision();
        }

        // Restore functionally that not requires that elements are in the DOM
        this.restoreFunctionality();
    }

    collectData() {
        const $fromLinks = this.nodes.$data.find( '#mw-diff-otitle1 strong > a, #differences-prevlink' );
        const $toLinks = this.nodes.$data.find( '#mw-diff-ntitle1 strong > a, #differences-nextlink' );

        // Get diff and oldid values
        // FixMe: request via api action=revisions
        if ( $fromLinks.length > 0 ) {
            const oldid = Number( utils.getParamFromUrl( 'oldid', $fromLinks.prop( 'href' ) ) );
            if ( utils.isValidID( oldid ) ) {
                this.mwConfg.wgDiffOldId = oldid;
            }
        }
        if ( $toLinks.length > 0 ) {
            const diff = Number( utils.getParamFromUrl( 'oldid', $toLinks.prop( 'href' ) ) );
            if ( utils.isValidID( diff ) ) {
                this.mwConfg.wgDiffNewId = diff;
                this.mwConfg.wgRevisionId = diff;

                // Set actual revision id for the copy actions, etc.
                this.page.revid = diff;

                // Replace diff when its values = cur
                if ( this.page.diff === 'cur' ) {
                    this.page.diff = diff;
                }
            }
        }

        // Get page title
        const $links = $toLinks.add( $fromLinks );
        if ( utils.isEmpty( this.page.title ) && $links.length > 0 ) {
            const title = utils.getParamFromUrl( 'title', $links.prop( 'href' ) ) || $links.prop( 'title' );
            this.page = utils.extendPage( this.page, { title } );
        }

        // Populate section name
        const $toSectionLinks = this.nodes.$data.find( '#mw-diff-ntitle3 .autocomment a' );
        if ( utils.isEmpty( this.page.section ) && $toSectionLinks.length > 0 ) {
            const section = utils.getComponentFromUrl( 'hash', $toSectionLinks.prop( 'href' ) );
            this.page = utils.extendPage( this.page, { section } );
        }

        // Get undo links to check if user can edit the page
        const $editLinks = this.nodes.$data.find( '.mw-diff-undo a, .mw-rollback-link a' );
        if ( $editLinks.length > 0 ) {
            this.mwConfg.wgIsProbablyEditable = true;
        }

        // Save the title values to the mw.config
        if ( this.page.mwTitle ) {
            this.mwConfg.wgTitle = this.page.mwTitle.getMainText();
            this.mwConfg.wgPageName = this.page.mwTitle.getPrefixedDb();
            this.mwConfg.wgNamespaceNumber = this.page.mwTitle.getNamespaceId();
            this.mwConfg.wgRelevantPageName = this.page.mwTitle.getPrefixedDb();
        }

        // Save additional user options dependent of a page type
        if ( this.page.type !== 'diff' ) {
            this.mwUserOptions[ 'visualeditor-diffmode-historical' ] = 'source';
        }
    }

    processDiffTable() {
        // Find diff table tools container and pre-toggle visibility
        this.nodes.$diffTablePrefix = this.nodes.$data.filter( '.mw-diff-table-prefix' );
        if ( this.page.type !== 'diff' || !utils.defaults( 'showDiffTools' ) ) {
            this.nodes.$diffTablePrefix.addClass( 'instantDiffs-hidden' );
        }

        // Find table elements
        this.nodes.$table = this.nodes.$data.filter( 'table.diff' );

        // Find and hide the next / previous diff links, so the other scripts can use them later
        this.links.$prev = this.nodes.$table
            .find( '#differences-prevlink' )
            .attr( 'data-instantdiffs-link', 'none' )
            .addClass( 'instantDiffs-hidden' );
        this.links.$next = this.nodes.$table
            .find( '#differences-nextlink' )
            .attr( 'data-instantdiffs-link', 'none' )
            .addClass( 'instantDiffs-hidden' );

        // Clear whitespaces after detaching links
        const leftTitle4 = this.nodes.$table.find( '#mw-diff-otitle4' );
        if ( leftTitle4.length > 0 ) {
            leftTitle4.contents().each( ( i, node ) => {
                if ( node.nodeType !== 3 ) return;
                node.remove();
            } );
        }
        const rightTitle4 = this.nodes.$table.find( '#mw-diff-ntitle4' );
        if ( rightTitle4.length > 0 ) {
            rightTitle4.contents().each( ( i, node ) => {
                if ( node.nodeType !== 3 ) return;
                node.remove();
            } );
        }

        // Show or hide diff info table in the revision view
        if ( this.page.type === 'revision' ) {
            if ( utils.defaults( 'showRevisionInfo' ) ) {
                // Hide the left side of the table and left only related to the revision info
                this.nodes.$table.find( 'td:is(.diff-otitle, .diff-side-deleted)' ).addClass( 'instantDiffs-hidden' );
                this.nodes.$table.find( 'td:is(.diff-ntitle, .diff-side-added)' ).attr( 'colspan', '4' );

                // Hide comparison lines
                this.nodes.$table.find( 'tr:not([class])' ).addClass( 'instantDiffs-hidden' );
            } else {
                this.nodes.$table.addClass( 'instantDiffs-hidden' );
            }
        }

        // Hide unsupported or unnecessary element
        this.nodes.$data
            .filter( '.mw-revslider-container, .mw-diff-revision-history-links,  #mw-oldid' )
            .addClass( 'instantDiffs-hidden' );
    }

    processFlaggedRevs() {
        // Find FlaggedRevs table info and insert before the diff table to fix the elements flow
        this.nodes.$frDiffHeader = this.nodes.$data
            .filter( '#mw-fr-diff-headeritems' )
            .insertBefore( this.nodes.$table );

        // Find and hide the "All unpatrolled diffs" link, so the other scripts can use it later
        this.nodes.$unpatrolledLink = this.nodes.$frDiffHeader
            .find( '.fr-diff-to-stable a' )
            .attr( 'data-instantdiffs-link', 'none' )
            .addClass( 'instantDiffs-hidden' );
        if ( this.page.type === 'diff' ) {
            this.links.$unpatrolled = this.nodes.$unpatrolledLink;
        }

        // Show or hide diff info table in the revision view
        if ( this.page.type === 'revision' ) {
            if ( utils.defaults( 'showRevisionInfo' ) ) {
                // Hide the left side of the table and left only related to the revision info
                this.nodes.$frDiffHeader.find( '.fr-diff-ratings td:nth-child(2n-1)' ).addClass( 'instantDiffs-hidden' );
            } else {
                this.nodes.$frDiffHeader.addClass( 'instantDiffs-hidden' );
            }
        }

        // Hide unsupported or unnecessary element
        this.nodes.$data
            .find( '.fr-diff-to-stable, #mw-fr-diff-dataform' )
            .addClass( 'instantDiffs-hidden' );
    }

    processRevision() {
        this.nodes.$diffTitle = this.nodes.$data.filter( '.diff-currentversion-title' );

        // Hide unsupported or unnecessary element
        this.nodes.$data
            .find( '.mw-diff-slot-header, .mw-slot-header' )
            .addClass( 'instantDiffs-hidden' );
    }

    renderError() {
        const message = utils.getErrorMessage( `error-${ this.error.type }-${ this.error.code }`, this.error, this.page );
        const $message = $( `<p>${ message }</p>` );
        this.renderWarning( $message );
    }

    renderWarning( $content ) {
        const $box = utils.renderMessageBox( { $content, type: 'warning' } );
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

    /******* RESTORE FUNCTIONALITY *******/

    async restoreFunctionality() {
        if ( this.error ) return;

        // Restore file media info
        this.nodes.$mediaInfoView = this.nodes.$data.find( 'mediainfoview' );
        if ( this.page.type === 'revision' && this.nodes.$mediaInfoView.length > 0 ) {
            const content = await utilsDiff.restoreFileMediaInfo( this.nodes.$mediaInfoView );
            if ( content ) {
                utils.embed( content, this.nodes.$diffTitle, 'insertAfter' );
            }
        }
    }

    restoreFunctionalityEmbed() {
        if ( this.error ) return;

        // Restore rollback and patrol links scripts
        executeModuleScript( 'mediawiki.misc-authed-curate' );

        // Restore rollback link
        utilsDiff.restoreRollbackLink( this.nodes.$body );

        // Restore diff format toggle buttons
        const diffTablePrefixTools = [];

        if ( this.page.type === 'diff' && utils.defaults( 'showDiffTools' ) ) {
            const hasInlineToggle = utilsDiff.restoreInlineFormatToggle( this.nodes.$diffTablePrefix );
            if ( hasInlineToggle ) diffTablePrefixTools.push( hasInlineToggle );

            const hasVisualDiffs = utilsDiff.restoreVisualDiffs( this.nodes.$diffTablePrefix );
            if ( hasVisualDiffs ) diffTablePrefixTools.push( hasVisualDiffs );
        }

        // Show diffTablePrefix if at least one tool was restored and visible
        if ( this.nodes.$diffTablePrefix?.length > 0 ) {
            const hasVisibleChild = this.nodes.$diffTablePrefix.children( ':visible' ).length > 0;
            this.nodes.$diffTablePrefix.toggleClass( 'instantDiffs-hidden', ( !hasVisibleChild || diffTablePrefixTools.length === 0 ) );
        }

        // Restore WikiLambda app
        this.nodes.$wikiLambdaApp = this.nodes.$data.filter( '#ext-wikilambda-app' );
        if ( this.nodes.$wikiLambdaApp.length > 0 ) {
            // Render warning about current limitations
            const $message = $( utils.msgDom( 'dialog-notice-wikilambda' ) );
            this.renderWarning( $message );
        }
    }

    restoreFunctionalityWithDependencies() {
        if ( this.error ) return;

        // Restore WikiLambda app
        if ( this.nodes.$wikiLambdaApp.length > 0 ) {
            utilsDiff.restoreWikiLambda( this.nodes.$wikiLambdaApp );
        }
    }

    /******* ACTIONS *******/

    /**
     * Fire hooks and events.
     */
    async fire() {
        // Restore functionally that requires elements appended in the DOM
        this.restoreFunctionalityEmbed();

        // Request page dependencies lazily
        if ( this.page.type === 'revision' && !this.isDependenciesLoaded ) {
            await this.requestPageDependencies();
        }

        // Restore functionally that requires page dependencies
        this.restoreFunctionalityWithDependencies();

        // Fire navigation events
        this.getNavigation()?.fire();

        // Fire diff table hook
        const $diffTable = this.getDiffTable();
        if ( this.page.type === 'diff' && $diffTable?.length > 0 ) {
            mw.hook( 'wikipage.diff' ).fire( $diffTable );
        }

        // Fire general content hook
        const $container = this.getContainer();
        if ( $container?.length > 0 ) {
            mw.hook( 'wikipage.content' ).fire( $container );
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