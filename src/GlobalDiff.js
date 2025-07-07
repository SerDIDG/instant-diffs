import id from './id';
import * as utils from './utils';
import { getUserDate, renderDiffTable } from './utils-diff';

import Diff from './Diff';

const { h, hf } = utils;

/**
 * Class representing a global Diff.
 * @augments {import('./Diff').default}
 */
class GlobalDiff extends Diff {
    /**
     * @type {string}
     */
    type = 'global';

    /**
     * @type {object}
     */
    compare;

    /**
     * @type {object}
     */
    parse;

    /**
     * Create a global diff instance.
     * @param {object} page a page object
     * @param {object} [options] configuration options
     */
    constructor( page, options ) {
        super( page, {
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
            fromrev: utils.isValidID( this.page.oldid ) ? this.page.oldid : undefined,
            fromrelative: utils.isValidDir( this.page.oldid ) ? this.page.oldid : undefined,
            torev: utils.isValidID( this.page.diff ) ? this.page.diff : undefined,
            torelative: utils.isValidDir( this.page.diff ) ? this.page.diff : this.page.direction,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };
        return this.requestManager.get( params, this.page.mwApi || id.local.mwApi );
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
        // Get values for mw.config
        this.mwConfg.wgArticleId = this.page.curid = this.compare.toid;
        this.mwConfg.wgRevisionId = this.page.revid = this.compare.torevid;
        this.mwConfg.wgDiffOldId = this.compare.fromrevid;
        this.mwConfg.wgDiffNewId = this.compare.torevid;
        if ( !this.compare.next ) {
            this.mwConfg.wgCurRevisionId = this.page.curRevid = this.compare.torevid;
        }

        // Set additional config variables
        this.setConfigs();

        // Render warning about global diff limitations
        const $message = $( utils.msgDom( `dialog-notice-global-${ this.page.type }`, this.page.origin, this.page.origin ) );
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
        if ( this.page.type === 'revision' ) {
            await this.requestRevision();
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

        const oldid = this.mwConfg.wgDiffNewId || Math.max( this.page.revid, this.page.oldid );
        const pageid = this.mwConfg.wgArticleId || this.page.curid;
        if ( utils.isValidID( oldid ) ) {
            params.oldid = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.pageid = pageid;
        }

        return this.requestManager
            .get( params, this.page.mwApi || id.local.mwApi )
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
        utils.notifyError( `error-dependencies-${ type }`, error, this.page );
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
        this.mwConfg.wgArticleId = this.page.curid = this.parse.pageid;
        this.mwConfg.wgRevisionId = this.page.revid = Math.max( this.page.revid, this.parse.revid );
        this.mwConfg = { ...this.mwConfg, ...this.parse.jsconfigvars };

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
        utils.addBaseToLinks( this.nodes.$revision, this.page.origin );

        // Get page dependencies
        const dependencies = [
            ...this.parse.modulestyles,
            ...this.parse.modulescripts,
            ...this.parse.modules,
            ...utils.getPageDependencies( this.page ),
        ];
        mw.loader.load( utils.getDependencies( dependencies ) );
    }
}

export default GlobalDiff;