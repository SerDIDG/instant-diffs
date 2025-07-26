import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { getNamespaceConfig } from './utils-api';
import { addLinkTags, getForeignDependencies, removeLinkTags } from './utils-article';

import Api from './Api';
import Page from './Page';
import view from './View';

const { h } = utils;

/**
 * Class representing a Global Page.
 * @augments {import('./Page').default}
 */
class GlobalPage extends Page {
    /**
     * @type {string}
     */
    type = 'foreign';

    /**
     * @type {Object}
     */
    compare;

    /**
     * @type {Object}
     */
    parse;

    /**
     * @type {Array<HTMLLinkElement>}
     */
    linkTags = [];

    /**
     * Create a foreign diff instance.
     * @param {import('./Article').default} article an Article instance
     * @param {Object} [options] configuration options
     */
    constructor( article, options ) {
        super( article, {
            ...options,
            fireDiffHook: false,
        } );
    }

    /**
     * Load process that chains multiple requests into one promise.
     * @returns {Promise}
     */
    loadProcess() {
        const promises = [
            this.requestMessages(),
            this.requestSiteInfo(),
            this.requestPageCurRevId(),
            this.request(),
        ];

        const promise = Promise.allSettled( promises )
            .then( this.onLoadResponse );

        return promise.then( this.loadProcessSecondary );
    }

    /**
     * Secondary load process that chains multiple requests into one promise.
     * Process fires in a chain only after the main request because it needs additional data.
     * @returns {Promise}
     */
    loadProcessSecondary = () => {
        const promises = [];

        // Add a request for the wikidata label name
        if ( this.article.getMW( 'serverName' ) === 'www.wikidata.org' ) {
            promises.push( this.requestWBLabel() );
        }

        // Add a request for the revision view
        if ( this.article.get( 'type' ) === 'revision' ) {
            promises.push( this.requestRevision() );
        }

        return Promise.allSettled( promises );
    };

    /******* REQUESTS *******/

    /**
     * Request process to get diff compare content.
     * @returns {mw.Api.AbortablePromise}
     */
    requestProcess() {
        const values = this.article.getValues();
        const params = {
            action: 'compare',
            prop: [ 'diff', 'ids', 'parsedcomment', 'rel', 'timestamp', 'title', 'user' ],
            fromrev: utils.isValidID( values.oldid ) ? values.oldid : undefined,
            fromrelative: utils.isValidDir( values.oldid ) ? values.oldid : undefined,
            torev: utils.isValidID( values.diff ) ? values.diff : undefined,
            difftype: utils.isMF() ? 'inline' : 'table',
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };
        if ( values.type === 'diff' && !utils.isValidID( values.diff ) ) {
            params.torelative = utils.isValidDir( values.diff ) ? values.diff : 'prev';
        }
        if ( values.type === 'revision' && !utils.isValidID( values.diff ) ) {
            params.torelative = utils.isValidDir( values.direction ) ? values.direction : 'prev';
        }
        if ( values.typeVariant === 'page' && utils.isValidID( values.curid ) ) {
            params.fromid = values.curid;
            params.torelative = 'cur';
        }
        return this.requestManager.get( params, this.article.get( 'hostname' ) );
    }

    /**
     * Event that emits after the request successive.
     * Sets compare data to the class property.
     */
    onRequestDone( data ) {
        this.data = data?.compare;
    }

    /**
     * Request project-specific site info.
     * @returns {Promise}
     */
    async requestSiteInfo() {
        const fields = [ 'general', 'namespaces', 'namespacealiases' ];
        const data = await Api.getSiteInfo( fields, this.article.get( 'hostname' ), this.requestManager ) || {};
        if ( !utils.isEmptyObject( data ) ) {
            const general = data.general;
            if ( !utils.isEmptyObject( general ) ) {
                // Set article hostname to revalidate server names
                this.article.set( { hostname: general.servername } );

                this.configManager.setValues( {
                    wgServer: general.server,
                    wgServerName: general.servername,
                    mobileServer: general.mobileserver,
                    mobileServerName: general.mobileservername,
                } );
            }

            // Process namespace list into mw.config format
            const namespaceConfig = getNamespaceConfig( this.article.get( 'hostname' ) );
            this.configManager.setValues( namespaceConfig );

            // Set additional config variables
            this.setConfigs();
        }
    }

    /**
     * Request MediaWiki interface messages is missing.
     * @returns {Promise}
     */
    async requestMessages() {
        const messages = [
            'revisionasof',
            'currentrev-asof',
            'word-separator',
            'pipe-separator',
            'parentheses',
            'talkpagelinktext',
            'contribslink',
            'changeslist-nocomment',
            'rev-deleted-no-diff',
            'rev-deleted-user',
            'rev-deleted-comment',
            'diff-empty',
        ];
        await Api.loadMessage( messages );
    }

    /******* RENDER *******/

    async render() {
        await super.render();

        // Render warning about foreign diff limitations
        this.renderForeignWarning();
    }

    async renderContent() {
        // Collect missing data from the response
        this.collectData();

        // Set additional config variables
        this.setConfigs();

        // Render diff table
        await this.renderDiffTable();
    }

    collectData() {
        // Get values for mw.config
        this.configManager.setValues( {
            wgArticleId: this.data.toid,
            wgRevisionId: this.data.torevid,
            wgDiffOldId: this.data.fromrevid,
            wgDiffNewId: this.data.torevid,
        } );
        if ( !this.data.next ) {
            this.configManager.set( 'wgCurRevisionId', this.data.torevid );
        }

        // Get sections
        const $fromSectionLinks = $( '<span>' ).html( this.data.fromparsedcomment ).find( '.autocomment a' );
        if ( $fromSectionLinks.length > 0 ) {
            this.data.fromsection = utils.getComponentFromUrl( 'hash', $fromSectionLinks.prop( 'href' ) );
        }

        const $toSectionLinks = $( '<span>' ).html( this.data.toparsedcomment ).find( '.autocomment a' );
        if ( $toSectionLinks.length > 0 ) {
            this.data.tosection = utils.getComponentFromUrl( 'hash', $toSectionLinks.prop( 'href' ) );
        }

        // Set article values
        this.article.set( {
            previd: this.data.prev,
            nextid: this.data.next,
            curid: this.configManager.get( 'wgArticleId' ),
            curRevid: this.configManager.get( 'wgCurRevisionId' ),
            revid: this.configManager.get( 'wgRevisionId' ),
            title: this.data.totitle || this.data.fromtitle,
            section: this.data.tosection,
        } );

        // Save the title values to the mw.config
        const mwTitle = this.article.getMW( 'title' );
        if ( mwTitle ) {
            this.configManager.setValues( {
                wgTitle: mwTitle.getMainText(),
                wgPageName: mwTitle.getPrefixedDb(),
                wgNamespaceNumber: mwTitle.getNamespaceId(),
                wgRelevantPageName: mwTitle.getPrefixedDb(),
            } );
        }

        // Collect links that will be available in the navigation:
        // * For a revision, add the ability to navigate to the very first revision of the article;
        // * For a diff, we show only a comparison between two revisions,
        // * so there will be no link to navigate to a comparison between nothing and revision.
        this.links.prev = this.article.get( 'type' ) === 'revision'
            ? utils.isValidID( this.data.fromrevid )
            : this.data.prev && this.data.prev !== this.data.fromrevid;
        this.links.next = this.data.next && this.data.next !== this.data.torevid;
    }

    async renderDiffTable() {
        // Render table structure
        this.nodes.table = utilsPage.renderDiffTable( this.data.body );

        // Render warning about hidden content
        if ( this.data.fromtexthidden || this.data.totexthidden ) {
            await this.renderDeletedWarning();
        }

        // Add deleted side content
        if ( this.data.fromid ) {
            const deleted = utilsPage.renderDiffTableSide( {
                prefix: 'o',
                title: this.data.fromtitle,
                revid: this.data.fromrevid,
                curRevid: this.configManager.get( 'wgCurRevisionId' ),
                hostname: this.article.get( 'hostname' ),
                timestamp: this.data.fromtimestamp,
                texthidden: this.data.fromtexthidden,
                user: this.data.fromuser,
                userhidden: this.data.fromuserhidden,
                comment: this.data.fromparsedcomment,
                commenthidden: this.data.fromcommenthidden,
            } );
            utils.embed( deleted, this.nodes.table.deleted );
        } else {
            this.nodes.table.added.colSpan = 4;
            this.nodes.table.deleted.classList.add( 'instantDiffs-hidden' );
        }

        // Add added side content
        if ( this.data.toid ) {
            const added = utilsPage.renderDiffTableSide( {
                prefix: 'n',
                title: this.data.totitle,
                revid: this.data.torevid,
                curRevid: this.configManager.get( 'wgCurRevisionId' ),
                hostname: this.article.get( 'hostname' ),
                timestamp: this.data.totimestamp,
                texthidden: this.data.totexthidden,
                user: this.data.touser,
                userhidden: this.data.touserhidden,
                comment: this.data.toparsedcomment,
                commenthidden: this.data.tocommenthidden,
            } );
            utils.embed( added, this.nodes.table.added );
        } else {
            this.nodes.table.deleted.colSpan = 4;
            this.nodes.table.added.classList.add( 'instantDiffs-hidden' );
        }

        // Append diff content
        this.nodes.$table = $( this.nodes.table.container ).appendTo( this.nodes.$body );
        utils.addBaseToLinks( this.nodes.$table, `https://${ this.article.get( 'hostname' ) }` );

        // Show or hide diff info table in the revision view
        if ( this.article.get( 'type' ) === 'revision' ) {
            utilsPage.processRevisionDiffTable( this.nodes.$table );
        }
    }

    async renderErrorContent() {
        // Render a custom error warning is a revision was hidden
        if ( this.errorData?.code === 'missingcontent' ) {
            await this.renderDeletedWarning();
        } else {
            await super.renderErrorContent();
        }

        // Try to parse error message for a missing id
        const values = this.article.getValues();
        const revid = this.errorData?.code === 'missingcontent' ? this.errorData.info.replace( /\D/g, '' ) : null;
        const ids = [ values.oldid, values.diff, revid ].filter( num => !isNaN( num ) && num > 0 );

        // Get values for mw.config
        this.configManager.setValues( {
            wgDiffOldId: Math.min( ...ids ),
            wgDiffNewId: Math.max( ...ids ),
        } );

        // Set additional config variables
        this.setConfigs();

        // Collect links that will be available in the navigation
        if ( this.configManager.get( 'wgDiffOldId' ) !== this.configManager.get( 'wgDiffNewId' ) ) {
            this.links.prev = utils.isValidID( this.configManager.get( 'wgDiffOldId' ) );
            this.links.next = utils.isValidID( this.configManager.get( 'wgDiffNewId' ) );
        }

        // Set previous page as the initiator to render the back link
        this.options.initiatorPage = view.getPreviousPage();
    }

    renderForeignWarning() {
        const $content = $( utils.msgDom(
            `dialog-notice-foreign-${ this.article.get( 'type' ) }`,
            `https://${ this.article.get( 'hostname' ) }`,
            this.article.get( 'hostname' ),
        ) );

        this.nodes.$foreignWarning = this.renderWarning( {
            $content,
            type: 'notice',
        } );
    }

    async renderDeletedWarning() {
        const message = await Api.parseWikitext( {
            title: this.article.get( 'title' ),
            text: mw.msg( 'rev-deleted-no-diff' ),
        }, this.article.get( 'hostname' ) );

        const $content = $( message ).find( 'p' );

        this.nodes.$deleteWarning = this.renderWarning( {
            $content,
            type: 'warning',
            container: this.nodes.$foreignWarning,
            insertMethod: 'insertAfter',
        } );
    }

    /******* REVISION *******/

    /**
     * Request revision.
     * @returns {JQuery.Promise}
     */
    requestRevision() {
        if ( this.error ) return $.Deferred().resolve().promise();

        const params = {
            action: 'parse',
            prop: [ 'text', 'revid', 'modules', 'jsconfigvars' ],
            disablelimitreport: 1,
            redirects: 1,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };

        const oldid = Math.max( this.article.get( 'revid' ), this.article.get( 'oldid' ) );
        const pageid = this.article.get( 'curid' );
        if ( utils.isValidID( oldid ) ) {
            params.oldid = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.pageid = pageid;
        }

        return this.requestManager
            .get( params, this.article.get( 'hostname' ) )
            .then( ( data ) => this.onRequestRevisionDone( data, params ) )
            .fail( ( message, data ) => this.onRequestRevisionError( message, data, params ) );
    }

    onRequestRevisionError( message, data, params ) {
        const error = {
            message,
            type: 'dependencies',
        };
        if ( data?.error ) {
            error.code = data.error.code;
            error.message = data.error.info;
        }

        const type = params.oldid ? 'revid' : 'curid';
        utils.notifyError( `error-dependencies-${ type }`, error, this.article );
    }

    async onRequestRevisionDone( data, params ) {
        // Render error if the parse request is completely failed
        this.parse = data?.parse;
        if ( !this.parse ) {
            return this.onRequestRevisionError( null, data, params );
        }

        await this.renderRevision();
    }

    async renderRevision() {
        // Get values for mw.config
        this.configManager.setValues( {
            wgArticleId: this.parse.pageid,
            wgRevisionId: Math.max( this.article.get( 'revid' ), this.parse.revid ),
            ...this.parse.jsconfigvars,
        } );

        // Set article values
        this.article.setValues( {
            curid: this.configManager.get( 'wgArticleId' ),
            revid: this.configManager.get( 'wgRevisionId' ),
        } );

        // Set additional config variables
        this.setConfigs();

        // Append title
        const title = this.configManager.get( 'wgRevisionId' ) === this.configManager.get( 'wgCurRevisionId' )
            ? 'currentrev-asof' : 'revisionasof';
        this.nodes.diffTitle = h( 'h2', { class: 'diff-currentversion-title' },
            mw.msg( title, utilsPage.getUserDate( this.data.totimestamp ) ),
        );
        this.nodes.$diffTitle = $( this.nodes.diffTitle ).appendTo( this.nodes.$body );

        // Append and process content
        this.nodes.$revision = $( this.parse.text ).appendTo( this.nodes.$body );
        await this.processRevision();

        // Convert relative links to absolute
        utils.addBaseToLinks( this.nodes.$revision, `https://${ this.article.get( 'hostname' ) }` );

        // Get page dependencies
        utilsPage.requestDependencies( this.parse, this.article );

        // Get page foreign dependencies
        const foreignDependencies = getForeignDependencies( this.article );
        this.linkTags = addLinkTags( foreignDependencies.styles );
    }

    async processRevision() {
        // Hide unsupported or unnecessary element
        this.nodes.$body
            .find( '#ext-wikilambda-app, .ext-wikilambda-view-nojsfallback, .mw-diff-slot-header, .mw-slot-header' )
            .addClass( 'instantDiffs-hidden' );

        // Render a notice about unsupported WikiLambda app
        this.nodes.$wikiLambdaApp = this.nodes.$body.find( '#ext-wikilambda-app' );
        if ( this.nodes.$wikiLambdaApp.length > 0 ) {
            const $content = $( `<p>${ utils.msg( 'dialog-notice-foreign-wikilambda' ) }</p>` );
            this.renderWarning( {
                $content,
                type: 'notice',
                container: this.nodes.$wikiLambdaApp,
                insertMethod: 'insertBefore',
            } );
        }

        // Restore functionally that not requires that elements are in the DOM
        await this.restoreFunctionality();
    }

    /******* ACTIONS *******/

    detach() {
        if ( this.isDetached ) return;

        super.detach();

        // Remove link tags from the head, that was added to load styles for the foreign pages
        removeLinkTags( this.linkTags );
    }
}

export default GlobalPage;