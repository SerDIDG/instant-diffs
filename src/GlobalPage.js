import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { getNamespaces } from './utils-api';
import { getDependencies } from './utils-article';

import Page from './Page';

const { h, hf } = utils;

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
     * Load process that chains multiple requests into the one promise.
     * @returns {Promise}
     */
    loadProcess() {
        const requests = [
            this.requestNamespaces(),
            this.requestMessages(),
            this.request(),
        ];

        const promise = Promise.allSettled( requests )
            .then( this.onLoadResponse.bind( this ) );

        // Handle request for the diff view
        if ( this.article.get( 'type' ) !== 'revision' ) {
            return promise;
        }

        // Otherwise add revision request to the request chain
        return promise.then( () => this.requestRevision() );
    }

    /******* REQUESTS *******/

    /**
     * Request process to get diff compare content.
     * @returns {JQuery.Promise}
     */
    requestProcess() {
        const params = {
            action: 'compare',
            prop: [ 'diff', 'ids', 'parsedcomment', 'rel', 'timestamp', 'title', 'user' ],
            fromrev: utils.isValidID( this.article.get( 'oldid' ) ) ? this.article.get( 'oldid' ) : undefined,
            fromrelative: utils.isValidDir( this.article.get( 'oldid' ) ) ? this.article.get( 'oldid' ) : undefined,
            torev: utils.isValidID( this.article.get( 'diff' ) ) ? this.article.get( 'diff' ) : undefined,
            torelative: utils.isValidDir( this.article.get( 'diff' ) ) ? this.article.get( 'diff' ) : this.article.get( 'direction' ),
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };
        return this.requestManager.get( params, this.article.getMW( 'api' ) || id.local.mwApi );
    }

    onRequestDone( data ) {
        this.data = data?.compare;
    }

    async requestNamespaces() {
        // Request formatted name
        const namespaces = await getNamespaces( this.article.get( 'origin' ) );
        if ( namespaces ) {
            this.mwConfig.wgFormattedNamespaces = namespaces;
        }
    }

    async requestMessages() {
        // Request messages
        const messages = [
            'revisionasof',
            'currentrev-asof',
            'word-separator',
            'pipe-separator',
            'parentheses',
            'talkpagelinktext',
            'contribslink',
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
        const $message = $( utils.msgDom( `dialog-notice-foreign-${ this.article.get( 'type' ) }`, this.article.get( 'origin' ), this.article.get( 'origin' ) ) );
        this.renderWarning( $message, 'notice' );

        // Render diff table
        this.renderDiffTable();
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

        // Set article values
        this.article.set( {
            previd: this.data.prev,
            nextid: this.data.next,
            curid: this.mwConfig.wgArticleId,
            curRevid: this.mwConfig.wgCurRevisionId,
            revid: this.mwConfig.wgRevisionId,
            title: this.data.totitle,
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
        utils.notifyError( `error-dependencies-${ type }`, error, this.article );
    }

    onRequestRevisionDone( data, params ) {
        this.isDependenciesLoaded = true;

        // Render error if the parse request is completely failed
        this.parse = data?.parse;
        if ( !this.parse ) {
            return this.onRequestRevisionError( null, data, params );
        }

        this.renderRevision();
    }

    renderRevision() {
        console.log( this.parse );

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