import id from './id';
import * as utils from './utils';
import { getUserDate, renderDiffTable } from './utils-page';
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
            fireWikipageHooks: false,
        } );
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
        return this.requestManager.get( params, this.article.mw.api || id.local.mwApi );
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
        ];
        await utils.loadMessage( messages, { promise: false } );

        // Render diff table
        this.renderDiffTable();

        // Request and render revision
        if ( this.article.get( 'type' ) === 'revision' ) {
            await this.requestRevision();
        }
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
    }

    renderDiffTable() {
        // Render table structure
        this.nodes.table = renderDiffTable();
        utils.setHTML( this.nodes.table.body, this.compare.body );

        // Add deleted side content
        const deletedTitle = this.mwConfg.wgDiffOldId === this.mwConfg.wgCurRevisionId ? 'currentrev-asof' : 'revisionasof';
        const deleted = hf(
            h( 'div', { id: 'mw-diff-otitle1' },
                h( 'strong', mw.msg( deletedTitle, getUserDate( this.compare.fromtimestamp ) ) ),
            ),
            h( 'div', { id: 'mw-diff-otitle2' },
                h( 'bdi', this.compare.fromuser ),
            ),
        );
        utils.embed( deleted, this.nodes.table.deleted );

        // Add added side content
        const addedTitle = this.mwConfg.wgDiffNewId === this.mwConfg.wgCurRevisionId ? 'currentrev-asof' : 'revisionasof';
        const added = hf(
            h( 'div', { id: 'mw-diff-otitle1' },
                h( 'strong', mw.msg( addedTitle, getUserDate( this.compare.totimestamp ) ) ),
            ),
            h( 'div', { id: 'mw-diff-otitle2' },
                h( 'bdi', this.compare.touser ),
            ),
        );
        utils.embed( added, this.nodes.table.added );

        // Append
        this.nodes.$table = $( this.nodes.table.container ).appendTo( this.nodes.$body );
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

        const oldid = this.mwConfg.wgDiffNewId || Math.max( this.article.get( 'revid' ), this.article.get( 'oldid' ) );
        const pageid = this.mwConfg.wgArticleId || this.article.get( 'curid' );
        if ( utils.isValidID( oldid ) ) {
            params.oldid = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.pageid = pageid;
        }

        return this.requestManager
            .get( params, this.article.mw.api || id.local.mwApi )
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

        // Append title
        const title = this.mwConfg.wgRevisionId === this.mwConfg.wgCurRevisionId ? 'currentrev-asof' : 'revisionasof';
        this.nodes.revisionTitle = h( 'h2', { class: 'diff-currentversion-title' },
            mw.msg( title, getUserDate( this.compare.totimestamp ) ),
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