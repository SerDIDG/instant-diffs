import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { getNamespaces } from './utils-api';
import { getDependencies } from './utils-article';

import Page from './Page';
import view from './View';

const { h } = utils;

/**
 * Class representing a Foreign Diff.
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
            this.requestNamespaces(),
            this.requestMessages(),
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
        if ( this.article.get( 'origin' ).includes( 'www.wikidata.org' ) ) {
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
     * @returns {JQuery.Promise}
     */
    requestProcess() {
        const values = this.article.getValues();
        const params = {
            action: 'compare',
            prop: [ 'diff', 'ids', 'parsedcomment', 'rel', 'timestamp', 'title', 'user' ],
            fromrev: utils.isValidID( values.oldid ) ? values.oldid : undefined,
            fromrelative: utils.isValidDir( values.oldid ) ? values.oldid : undefined,
            torev: utils.isValidID( values.diff ) ? values.diff : undefined,
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
        return this.requestManager.get( params, this.article.getMW( 'api' ) || id.local.mwApi );
    }

    /**
     * Event that emits after the request successive.
     */
    onRequestDone( data ) {
        this.data = data?.compare;
    }

    async requestNamespaces() {
        const namespaces = await getNamespaces( this.article.get( 'origin' ) );
        if ( !utils.isEmptyObject( namespaces ) ) {
            const formattedNamespaces = {};
            const namespaceIds = {};

            for ( const value of Object.values( namespaces ) ) {
                formattedNamespaces[ value.id ] = value.canonical;
                namespaceIds[ value.nameDb ] = value.id;
                namespaceIds[ value.canonicalDb ] = value.id;
            }

            this.mwConfig.wgFormattedNamespaces = { ...mw.config.get( 'wgFormattedNamespaces' ), ...formattedNamespaces };
            this.mwConfig.wgNamespaceIds = { ...mw.config.get( 'wgNamespaceIds' ), ...namespaceIds };

            // Set additional config variables
            this.setConfigs();
        }
    }

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
            'rev-deleted-user',
            'rev-deleted-comment',
            'diff-empty',
        ];
        await utils.loadMessage( messages, { promise: false } );
    }

    /******* RENDER *******/

    renderContent() {
        // Collect missing data from the response
        this.collectData();

        // Set additional config variables
        this.setConfigs();

        // Render warning about foreign diff limitations
        this.renderForeignWarning();

        // Render diff table
        this.renderDiffTable();
    }

    renderForeignWarning() {
        const $message = $( utils.msgDom( `dialog-notice-foreign-${ this.article.get( 'type' ) }`, this.article.get( 'origin' ), this.article.get( 'origin' ) ) );
        this.renderWarning( $message, 'notice' );
    }

    collectData() {
        // Get values for mw.config
        this.mwConfig.wgArticleId = this.data.toid;
        this.mwConfig.wgRevisionId = this.data.torevid;
        this.mwConfig.wgDiffOldId = this.data.fromrevid;
        this.mwConfig.wgDiffNewId = this.data.torevid;
        if ( !this.data.next ) {
            this.mwConfig.wgCurRevisionId = this.data.torevid;
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
            curid: this.mwConfig.wgArticleId,
            curRevid: this.mwConfig.wgCurRevisionId,
            revid: this.mwConfig.wgRevisionId,
            title: this.data.totitle,
            section: this.data.tosection,
        } );

        // Save the title values to the mw.config
        const mwTitle = this.article.getMW( 'title' );
        if ( mwTitle ) {
            this.mwConfig.wgTitle = mwTitle.getMainText();
            this.mwConfig.wgPageName = mwTitle.getPrefixedDb();
            this.mwConfig.wgNamespaceNumber = mwTitle.getNamespaceId();
            this.mwConfig.wgRelevantPageName = mwTitle.getPrefixedDb();
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

    renderDiffTable() {
        // Render table structure
        this.nodes.table = utilsPage.renderDiffTable( this.data.body );

        // Add deleted side content
        if ( this.data.fromid ) {
            const deleted = utilsPage.renderDiffTableSide( {
                prefix: 'o',
                title: this.data.fromtitle,
                revid: this.data.fromrevid,
                curRevid: this.mwConfig.wgCurRevisionId,
                origin: this.article.get( 'origin' ),
                timestamp: this.data.fromtimestamp,
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
                curRevid: this.mwConfig.wgCurRevisionId,
                origin: this.article.get( 'origin' ),
                timestamp: this.data.totimestamp,
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

        // Append content
        this.nodes.$table = $( this.nodes.table.container ).appendTo( this.nodes.$body );
        utils.addBaseToLinks( this.nodes.$table, this.article.get( 'origin' ) );

        // Show or hide diff info table in the revision view
        if ( this.article.get( 'type' ) === 'revision' ) {
            utilsPage.processRevisionDiffTable( this.nodes.$table );
        }
    }

    renderErrorContent() {
        super.renderErrorContent();

        // Render warning about foreign diff limitations
        this.renderForeignWarning();

        // Try to parse error message for a missing id
        const values = this.article.getValues();
        const revid = this.errorData?.code === 'missingcontent' ? this.errorData.info.replace( /\D/g, '' ) : null;
        const ids = [ values.oldid, values.diff, revid ].filter( num => !isNaN( num ) && num > 0 );

        // Get values for mw.config
        this.mwConfig.wgDiffOldId = Math.min( ...ids );
        this.mwConfig.wgDiffNewId = Math.max( ...ids );

        // Set additional config variables
        this.setConfigs();

        // Collect links that will be available in the navigation
        if ( this.mwConfig.wgDiffOldId !== this.mwConfig.wgDiffNewId ) {
            this.links.prev = utils.isValidID( this.mwConfig.wgDiffOldId );
            this.links.next = utils.isValidID( this.mwConfig.wgDiffNewId );
        }

        // Set previous page as the initiator to render the back link
        this.options.initiatorPage = view.getPreviousPage();
    }

    /******* REVISION *******/

    /**
     * Request revision.
     * @returns {JQuery.Promise}
     */
    requestRevision() {
        if ( this.error ) return $.Deferred().resolve();

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
            .get( params, this.article.getMW( 'api' ) || id.local.mwApi )
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

    onRequestRevisionDone( data, params ) {
        // Render error if the parse request is completely failed
        this.parse = data?.parse;
        if ( !this.parse ) {
            return this.onRequestRevisionError( null, data, params );
        }

        this.renderRevision();
    }

    renderRevision() {
        // Get values for mw.config
        this.mwConfig.wgArticleId = this.parse.pageid;
        this.mwConfig.wgRevisionId = Math.max( this.article.get( 'revid' ), this.parse.revid );
        this.mwConfig = { ...this.mwConfig, ...this.parse.jsconfigvars };

        // Set article values
        this.article.setValue( 'curid', this.mwConfig.wgArticleId );
        this.article.setValue( 'revid', this.mwConfig.wgRevisionId );

        // Set additional config variables
        this.setConfigs();

        // Append title
        const title = this.mwConfig.wgRevisionId === this.mwConfig.wgCurRevisionId ? 'currentrev-asof' : 'revisionasof';
        this.nodes.revisionTitle = h( 'h2', { class: 'diff-currentversion-title' },
            mw.msg( title, utilsPage.getUserDate( this.data.totimestamp ) ),
        );
        this.nodes.$body.append( this.nodes.revisionTitle );

        // Append content
        this.nodes.$revision = $( this.parse.text ).appendTo( this.nodes.$body );
        utils.addBaseToLinks( this.nodes.$revision, this.article.get( 'origin' ) );

        // Get page dependencies
        const dependencies = [
            ...this.parse.modulestyles,
            ...this.parse.modulescripts,
            ...this.parse.modules,
            ...getDependencies( this.article ),
        ];
        mw.loader.load( utils.getDependencies( dependencies ) );
    }
}

export default GlobalPage;