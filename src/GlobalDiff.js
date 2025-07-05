import id from './id';
import * as utils from './utils';

import Diff from './Diff';

const { h } = utils;

/**
 * Class representing a global Diff.
 * @augments {import('./Diff').default}
 * @mixes OO.EventEmitter
 */
class GlobalDiff extends Diff {
    /**
     * Request a Diff dependencies and html content.
     * @returns {Promise}
     */
    load() {
        if ( !this.isLoading ) {
            this.requestPromise = this.request();
        }
        return this.requestPromise;
    }

    /******* REQUESTS *******/

    /**
     * Request a Diff html content.
     * @returns {JQuery.Promise}
     */
    request() {
        this.isLoading = true;
        this.isLoaded = false;
        this.error = null;

        const params = {
            action: 'compare',
            prop: [ 'diff', 'ids', 'parsedcomment', 'rel', 'timestamp', 'title', 'user' ],
            fromrev: utils.isValidID( this.page.oldid ) ? this.page.oldid : undefined,
            fromrelative: utils.isValidDir( this.page.oldid ) ? this.page.oldid : undefined,
            torev: utils.isValidID( this.page.diff ) ? this.page.diff : undefined,
            torelative: utils.isValidDir( this.page.diff ) ? this.page.diff : false,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };

        console.log( this.page );

        const api = new mw.ForeignApi( `${ this.page.origin }${ mw.util.wikiScript( 'api' ) }` );
        return this.requestManager
            .get( params, api )
            .done( this.onRequestDone.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
    }

    /**
     * Event that emits after the request successive.
     */
    onRequestDone( data ) {
        this.isLoading = false;

        // The Diff can be already detached from the DOM
        if ( this.isDetached ) return;

        // Render error if the data request is completely failed
        this.data = data?.compare;
        if ( !this.data ) {
            return this.onRequestError();
        }

        console.log( this.data );

        this.render();
        mw.hook( `${ id.config.prefix }.diff.renderSuccess` ).fire( this );
        mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
    }

    /******* RENDER *******/

    renderContent() {
        // Collect data
        this.collectData();

        // Set additional config variables
        this.setConfigs();

        // Render diff table
        this.nodes.table = this.getDiffTable();
        this.nodes.table.body.innerHTML = this.data.body;
        this.nodes.$table = $( this.nodes.table.container ).appendTo( this.nodes.$body );

    }

    collectData() {
        this.mwConfg.wgArticleId = this.data.toid;
        this.mwConfg.wgDiffOldId = this.data.fromrevid;
        this.mwConfg.wgDiffNewId = this.data.torevid;
        this.mwConfg.wgRevisionId = this.data.torevid;
    }

    /**
     * Get the required <table> structure for displaying diffs.
     * {@link https://gerrit.wikimedia.org/g/mediawiki/core/+/a4dc5cf4549ea7688fcea4ae51b02cee6255c4a5/resources/src/mediawiki.page.preview.js#510}
     * @returns {Element}
     */
    getDiffTable() {
        const nodes = {};

        nodes.container = h( 'table', { class: 'diff' },
            h( 'col', { class: 'diff-marker' } ),
            h( 'col', { class: 'diff-content' } ),
            h( 'col', { class: 'diff-marker' } ),
            h( 'col', { class: 'diff-content' } ),
            h( 'thead',
                h( 'tr', { class: 'diff-title' },
                    h( 'td', { class: [ 'diff-otitle', 'diff-side-deleted' ], colspan: 2 } ),
                    h( 'td', { class: [ 'diff-ntitle', 'diff-side-added' ], colspan: 2 } ),
                ),
            ),
            nodes.body = h( 'tbody' ),
        );

        return nodes;
    }

    /******* ACTIONS *******/

    fire() {
        // Replace link target attributes after the hooks have fired
        this.processLinksTaget();

        // Fire hook on complete
        mw.hook( `${ id.config.prefix }.diff.complete` ).fire( this );
    }
}

export default GlobalDiff;