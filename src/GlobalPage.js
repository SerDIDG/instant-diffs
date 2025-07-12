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
        const request = Promise.allSettled([
            this.requestNamespaces(),
            this.request(),
        ] );

        // Handle request for the diff view
        if ( this.article.get( 'type' ) !== 'revision' ) {
            return request;
        }

        // Otherwise add revision request to the request chain
        return request.then( () => this.requestRevision() );
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

    async requestNamespaces() {
        // Request formatted name
        const namespaces = await getNamespaces( this.article.get( 'origin' ) );
        if (  namespaces ) {
            this.mwConfg.wgFormattedNamespaces = namespaces;
        }
    }

    /******* RENDER *******/

    renderSuccess( data ) {
        // Render error if the data request is completely failed
        this.compare = data?.compare;
        if ( !this.compare ) {
            this.onRequestError();
            return false;
        }

        this.render();
        return true;
    }

    async renderContent() {
        // Collect missing data from the response
        this.collectData();

        // Set additional config variables
        this.setConfigs();

        // Render warning about foreign diff limitations
        const $message = $( utils.msgDom( `dialog-notice-foreign-${ this.article.get( 'type' ) }`, this.article.get( 'origin' ), this.article.get( 'origin' ) ) );
        this.renderWarning( $message, 'notice' );

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

        // Render diff table
        this.renderDiffTable();
    }

    collectData() {
        // Get values for mw.config
        this.mwConfg.wgArticleId = this.compare.toid;
        this.mwConfg.wgRevisionId = this.compare.torevid;
        this.mwConfg.wgDiffOldId = this.compare.fromrevid;
        this.mwConfg.wgDiffNewId = this.compare.torevid;
        if ( !this.compare.next ) {
            this.mwConfg.wgCurRevisionId = this.compare.torevid;
        }

        // Set article values
        this.article.set( {
            previd: this.compare.prev,
            nextid: this.compare.next,
            curid: this.mwConfg.wgArticleId,
            curRevid: this.mwConfg.wgCurRevisionId,
            revid: this.mwConfg.wgRevisionId,
            title: this.compare.totitle,
        } );

        // Save the title values to the mw.config
        const mwTitle = this.article.getMW( 'title' );
        if ( mwTitle ) {
            this.mwConfg.wgTitle = mwTitle.getMainText();
            this.mwConfg.wgPageName = mwTitle.getPrefixedDb();
            this.mwConfg.wgNamespaceNumber = mwTitle.getNamespaceId();
            this.mwConfg.wgRelevantPageName = mwTitle.getPrefixedDb();
        }

        // Collect links that will be available in the navigation:
        // * For a revision, add the ability to navigate to the very first revision of the article;
        // * For a diff, we show only a comparison between two revisions,
        // * so there will be no link to navigate to a comparison between nothing and revision.
        this.links.prev = this.article.get( 'type' ) === 'revision'
            ? utils.isValidID( this.compare.fromrevid )
            : this.compare.prev && this.compare.prev !== this.compare.fromrevid;
        this.links.next = this.compare.next && this.compare.next !== this.compare.torevid;
    }

    renderDiffTable() {
        // Render table structure
        this.nodes.table = utilsPage.renderDiffTable( this.compare.body );

        // Add deleted side content
        if ( this.compare.fromid ) {
            const deleted = utilsPage.renderDiffTableSide( {
                prefix: 'o',
                title: this.compare.fromtitle,
                revid: this.compare.fromrevid,
                curRevid: this.mwConfg.wgCurRevisionId,
                origin: this.article.get( 'origin' ),
                timestamp: this.compare.fromtimestamp,
                user: this.compare.fromuser,
            } );
            utils.embed( deleted, this.nodes.table.deleted );
        } else {
            this.nodes.table.added.colSpan = 4;
            this.nodes.table.deleted.classList.add( 'instantDiffs-hidden' );
        }

        // Add added side content
        if ( this.compare.toid ) {
            const added = utilsPage.renderDiffTableSide( {
                prefix: 'n',
                title: this.compare.totitle,
                revid: this.compare.torevid,
                curRevid: this.mwConfg.wgCurRevisionId,
                origin: this.article.get( 'origin' ),
                timestamp: this.compare.totimestamp,
                user: this.compare.touser,
            } );
            utils.embed( added, this.nodes.table.added );
        } else {
            this.nodes.table.deleted.colSpan = 4;
            this.nodes.table.added.classList.add( 'instantDiffs-hidden' );
        }

        // Append content
        this.nodes.$table = $( this.nodes.table.container ).appendTo( this.nodes.$body );
        utils.addBaseToLinks( this.nodes.$table, this.article.get( 'origin' ) );
    }

    /******* REVISION *******/

    /**
     * Request revision.
     * @returns {JQuery.Promise}
     */
    requestRevision() {
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
        this.mwConfg.wgArticleId = this.parse.pageid;
        this.mwConfg.wgRevisionId = Math.max( this.article.get( 'revid' ), this.parse.revid );
        this.mwConfg = { ...this.mwConfg, ...this.parse.jsconfigvars };

        // Set article values
        this.article.setValue( 'curid', this.mwConfg.wgArticleId );
        this.article.setValue( 'revid', this.mwConfg.wgRevisionId );

        // Set additional config variables
        this.setConfigs();

        // Show or hide diff info table in the revision view
        utilsPage.processRevisionDiffTable( this.nodes.$table );

        // Append title
        const title = this.mwConfg.wgRevisionId === this.mwConfg.wgCurRevisionId ? 'currentrev-asof' : 'revisionasof';
        this.nodes.revisionTitle = h( 'h2', { class: 'diff-currentversion-title' },
            mw.msg( title, utilsPage.getUserDate( this.compare.totimestamp ) ),
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