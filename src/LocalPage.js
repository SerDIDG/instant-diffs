import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { executeModuleScript } from './utils-oojs';

import Page from './Page';

/**
 * Class representing a Local Page.
 * @augments {import('./Page').default}
 */
class LocalPage extends Page {
    /**
     * @type {string}
     */
    type = 'local';

    /**
     * @type {boolean}
     */
    isDependenciesLoaded = false;

    /**
     * Get promise array for the main load request.
     * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
     */
    getLoadPromises() {
        const promises = super.getLoadPromises();

        // Try to load page dependencies in parallel to the main request:
        // * for the revision view we need to know actual revision id;
        // * for the page view we need to know page id.
        if (
            this.article.get( 'type' ) === 'revision' && (
                ( this.article.get( 'typeVariant' ) !== 'page' && utils.isValidID( this.article.get( 'revid' ) ) ) ||
                ( this.article.get( 'typeVariant' ) === 'page' && utils.isValidID( this.article.get( 'curid' ) ) )
            )
        ) {
            promises.push( this.requestPage() );
        }

        return promises;
    }

    /******* DEPENDENCIES *******/

    /**
     * Request page dependencies.
     * @returns {JQuery.Promise}
     */
    requestPage() {
        if ( this.error ) return $.Deferred().resolve().promise();

        const params = {
            action: 'parse',
            prop: [ 'revid', 'modules', 'jsconfigvars' ],
            disablelimitreport: 1,
            redirects: 1,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };

        const oldid = this.configManager.get( 'wgDiffNewId' ) || Math.max( this.article.get( 'revid' ), this.article.get( 'oldid' ) );
        const pageid = this.configManager.get( 'wgArticleId' ) || this.article.get( 'curid' );

        if ( utils.isValidID( oldid ) ) {
            params.oldid = oldid;
        } else if ( utils.isValidID( pageid ) ) {
            params.pageid = pageid;
        }

        return this.requestManager
            .get( params )
            .then( ( data ) => this.onRequestPageDone( data, params ) )
            .fail( ( message, data ) => this.onRequestPageError( message, data, params ) );
    }

    onRequestPageError( message, data, params ) {
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
        utils.notifyError( `error-dependencies-${ type }`, error, this.article, true );
    }

    onRequestPageDone( data, params ) {
        this.isDependenciesLoaded = true;

        // Render error if the parse request is completely failed
        const parse = data?.parse;
        if ( !parse ) {
            return this.onRequestPageError( null, data, params );
        }

        // Get values for mw.config
        this.configManager.setValues( {
            wgArticleId: parse.pageid,
            wgRevisionId: Math.max( this.article.get( 'revid' ), parse.revid ),
            ...parse.jsconfigvars,
        } );

        // Set article values
        this.article.setValues( {
            curid: this.configManager.get( 'wgArticleId' ),
            revid: this.configManager.get( 'wgRevisionId' ),
        } );

        // Set additional config variables
        this.setConfigs();

        // Get page dependencies
        this.requestDependencies( parse );
    }

    /******* REQUESTS *******/

    /**
     * Request process to get diff html content.
     * @returns {JQuery.jqXHR}
     */
    requestProcess() {
        const page = {
            title: !utils.isEmpty( this.article.get( 'title' ) ) ? this.article.get( 'title' ) : undefined,
            diff: !utils.isEmpty( this.article.get( 'diff' ) ) ? this.article.get( 'diff' ) : this.article.get( 'direction' ),
            oldid: !utils.isEmpty( this.article.get( 'oldid' ) ) ? this.article.get( 'oldid' ) : undefined,
            curid: !utils.isEmpty( this.article.get( 'curid' ) ) ? this.article.get( 'curid' ) : undefined,
        };

        const params = {
            url: id.local.mwEndPoint,
            dataType: 'html',
            data: $.extend( page, this.articleParams ),
        };

        return this.requestManager.ajax( params );
    }

    /**
     * Event that emits after the request successive.
     */
    onRequestDone( data ) {
        this.data = data;
    }

    /******* RENDER *******/

    async renderContent() {
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
            this.renderWarning( {
                $content: $emptyMessage,
            } );
        }

        // Process diff table
        this.processDiffTable();
        this.processFlaggedRevs();

        // Process revision
        if ( this.article.get( 'type' ) === 'revision' ) {
            this.processRevision();
        }

        // Call a parent method that wraps a process
        await super.renderContent();
    }

    collectData() {
        const articleValues = {};

        const $fromLinks = this.nodes.$data.find( '#mw-diff-otitle1 strong > a, #differences-prevlink' );
        const $toLinks = this.nodes.$data.find( '#mw-diff-ntitle1 strong > a, #differences-nextlink' );

        // Get title, diff and oldid values
        if ( $fromLinks.length > 0 ) {
            const oldid = Number( utils.getParamFromUrl( 'oldid', $fromLinks.prop( 'href' ) ) );
            if ( utils.isValidID( oldid ) ) {
                this.configManager.set( 'wgDiffOldId', oldid );
            }

            const title = utils.getParamFromUrl( 'title', $fromLinks.prop( 'href' ) ) || $fromLinks.prop( 'title' );
            if ( !utils.isEmpty( title ) ) {
                articleValues.title = title;
            }
        }
        if ( $toLinks.length > 0 ) {
            const diff = Number( utils.getParamFromUrl( 'oldid', $toLinks.prop( 'href' ) ) );
            if ( utils.isValidID( diff ) ) {
                this.configManager.setValues( {
                    wgDiffNewId: diff,
                    wgRevisionId: diff,
                } );

                // Set actual revision id for the copy actions, etc.
                articleValues.revid = diff;

                // Replace diff when its values = cur
                if ( this.article.get( 'diff' ) === 'cur' ) {
                    articleValues.diff = diff;
                }
            }

            const title = utils.getParamFromUrl( 'title', $toLinks.prop( 'href' ) ) || $toLinks.prop( 'title' );
            if ( !utils.isEmpty( title ) ) {
                articleValues.title = title;
            }
        }

        // Populate timestamps
        const $toTimestamp = this.nodes.$data.find( '#mw-diff-ntitle1 .mw-diff-timestamp' );
        if ( $toTimestamp.length > 0 ) {
            articleValues.timestamp = $toTimestamp.attr( 'data-timestamp' );
        }

        // Populate section name
        const $toSectionLinks = this.nodes.$data.find( '#mw-diff-ntitle3 .autocomment a' );
        if ( utils.isEmpty( this.article.get( 'section' ) ) && $toSectionLinks.length > 0 ) {
            articleValues.section = utils.getComponentFromUrl( 'hash', $toSectionLinks.prop( 'href' ) );
        }

        // Get undo links to check if user can edit the page
        const $editLinks = this.nodes.$data.find( '.mw-diff-undo a, .mw-rollback-link a' );
        if ( $editLinks.length > 0 ) {
            this.configManager.set( 'wgIsProbablyEditable', true );
        }

        // Set article values
        this.article.set( articleValues );

        // Save the title values to the mw.config
        this.configManager.setTitle( this.article.getMW( 'title' ) );

        /**
         * Save additional user options dependent of a page type.
         * FixMe: See T346252 for the details about Visual Diffs.
         * @type {Object}
         */
        if ( this.article.get( 'type' ) !== 'diff' ) {
            const veConfig = mw.config.get( 'wgVisualEditorConfig' );
            if (
                veConfig &&
                !Object.prototype.hasOwnProperty.call( veConfig.contentModels, this.configManager.get( 'wgPageContentModel' ) )
            ) {
                this.userOptionsManager.set( 'visualeditor-diffmode-historical', 'source' );
            }
        }
    }

    processDiffTable() {
        // Find diff table tools container and pre-toggle visibility
        this.nodes.$diffTablePrefix = this.nodes.$data.filter( '.mw-diff-table-prefix' );
        if ( this.article.get( 'type' ) !== 'diff' || !utils.defaults( 'showDiffTools' ) ) {
            this.nodes.$diffTablePrefix.addClass( 'instantDiffs-hidden' );
        }

        // Find table elements
        this.nodes.$table = this.nodes.$data.filter( 'table.diff' );

        // Find and hide the next / previous diff links, so the other scripts can use them later
        this.nodes.$prev = this.nodes.$table
            .find( '#differences-prevlink' )
            .attr( 'data-instantdiffs-link', 'none' )
            .addClass( 'instantDiffs-hidden' );

        this.nodes.$next = this.nodes.$table
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

        // Hide unsupported or unnecessary element
        this.nodes.$data
            .filter( '.mw-revslider-container, .mw-diff-revision-history-links,  #mw-oldid' )
            .addClass( 'instantDiffs-hidden' );

        // Collect links that will be available in the navigation:
        // * For a revision, add the ability to navigate to the very first revision of the article;
        // * For a diff, we show only a comparison between two revisions,
        // * so there will be no link to navigate to a comparison between nothing and revision.
        this.links.prev = this.article.get( 'type' ) === 'revision'
            ? utils.isValidID( this.configManager.get( 'wgDiffOldId' ) )
            : this.nodes.$prev.attr( 'href' );
        this.links.next = this.nodes.$next.attr( 'href' );
    }

    processRevision() {
        this.nodes.$diffTitle = this.nodes.$data.filter( '.diff-currentversion-title' );

        // Show or hide diff info table in the revision view
        utilsPage.processRevisionDiffTable( this.nodes.$table );

        // Hide unsupported or unnecessary element
        this.nodes.$data
            .find( '.mw-diff-slot-header, .mw-slot-header' )
            .addClass( 'instantDiffs-hidden' );
    }

    processFlaggedRevs() {
        // Find FlaggedRevs table info and insert before the diff table to fix the elements flow
        this.nodes.$frDiffHeader = this.nodes.$data
            .filter( '#mw-fr-diff-headeritems' )
            .insertBefore( this.nodes.$table );

        // Find and hide the "All unpatrolled diffs" link, so the other scripts can use it later
        this.nodes.$unpatrolled = this.nodes.$frDiffHeader
            .find( '.fr-diff-to-stable a' )
            .attr( 'data-instantdiffs-link', 'none' )
            .addClass( 'instantDiffs-hidden' );

        if ( this.article.get( 'type' ) === 'diff' ) {
            this.links.unpatrolled = this.nodes.$unpatrolled.attr( 'href' );
        }

        // Show or hide diff info table in the revision view
        if ( this.article.get( 'type' ) === 'revision' ) {
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

    /******* RESTORE FUNCTIONALITY *******/

    restoreFunctionalityEmbed() {
        if ( this.error ) return;

        // Restore rollback and patrol links scripts
        executeModuleScript( 'mediawiki.misc-authed-curate' );

        // Restore rollback link
        utilsPage.restoreRollbackLink( this.nodes.$body );

        // Restore diff format toggle buttons
        const diffTablePrefixTools = [];

        if ( this.article.get( 'type' ) === 'diff' && utils.defaults( 'showDiffTools' ) ) {
            const hasInlineToggle = utilsPage.restoreInlineFormatToggle( this.nodes.$diffTablePrefix );
            if ( hasInlineToggle ) diffTablePrefixTools.push( hasInlineToggle );

            const hasVisualDiffs = utilsPage.restoreVisualDiffs( this.nodes.$diffTablePrefix );
            if ( hasVisualDiffs ) diffTablePrefixTools.push( hasVisualDiffs );
        }

        // Show diffTablePrefix if at least one tool was restored and visible
        if ( this.nodes.$diffTablePrefix?.length > 0 ) {
            const hasVisibleChild = this.nodes.$diffTablePrefix.children( ':visible' ).length > 0;
            this.nodes.$diffTablePrefix.toggleClass( 'instantDiffs-hidden', ( !hasVisibleChild || diffTablePrefixTools.length === 0 ) );
        }

        // Render warning about WikiLambda app limitations
        this.nodes.$wikiLambdaApp = this.nodes.$body.find( '#ext-wikilambda-app' );
        if ( this.nodes.$wikiLambdaApp.length > 0 ) {
            const $content = $( utils.msgDom( 'dialog-notice-wikilambda' ) );
            this.renderWarning( {
                $content,
                type: 'notice',
                container: this.nodes.$wikiLambdaApp,
                insertMethod: 'insertBefore',
            } );
        }
    }

    restoreFunctionalityWithDependencies() {
        if ( this.error ) return;

        // Restore WikiLambda app
        if ( this.nodes.$wikiLambdaApp.length > 0 ) {
            utilsPage.restoreWikiLambda( this.nodes.$wikiLambdaApp );
        }
    }

    /******* ACTIONS *******/

    /**
     * Fire hooks and events.
     */
    async fire() {
        // Restore functionally that requires elements appended in the DOM
        this.restoreFunctionalityEmbed();

        // Request page dependencies lazily, so visually it appears faster than actually
        if ( this.article.get( 'type' ) === 'revision' && !this.isDependenciesLoaded ) {
            await this.requestPage();
        }

        // Restore functionally that requires page dependencies
        this.restoreFunctionalityWithDependencies();

        // Fire parent hooks and events
        await super.fire();
    }
}

export default LocalPage;