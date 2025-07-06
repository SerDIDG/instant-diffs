import id from './id';
import * as utils from './utils';

import Diff from './Diff';

const { h } = utils;

/**
 * Class representing a global Diff.
 * @augments {import('./Diff').default}
 */
class GlobalDiff extends Diff {

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
            torelative: utils.isValidDir( this.page.diff ) ? this.page.diff : false,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };

        return this.requestManager.get( params, this.page.mwApi || id.local.mwApi );
    }

    /******* RENDER *******/

    renderSuccess( data ) {
        // Render error if the data request is completely failed
        this.data = data?.compare;
        if ( !this.data ) {
            this.onRequestError();
            return false;
        }

        this.render();
        return true;
    }

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
}

export default GlobalDiff;