import id from './id';
import * as utils from './utils';

import Navigation from './Navigation';

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
        'thanks-confirmation-required': true,
        wgDiffOldId: null,
        wgDiffNewId: null,
    };

    /**
     * @type {object}
     */
    nodes = {};

    /**
     * @type {object}
     */
    links = {};

    /**
     * @type {import('./Navigation').default}
     */
    navigation;

    /**
     * @type {boolean}
     */
    isLoading = false;

    /**
     * Create a diff instance.
     * @param {object} page a page object
     * @param {object} [options] configuration options
     */
    constructor( page, options ) {
        this.page = { ...page };

        this.options = {
            type: 'diff',
            typeVariant: null,
            initiatorDiff: null,
            initiatorDialog: null,
            ...options,
        };

        this.pageParams = {
            action: 'render',
            diffonly: this.options.type === 'diff' ? 1 : 0,
            unhide: utils.defaults( 'unHideDiffs' ) ? 1 : 0,
            uselang: id.local.language,
        };

        // Validate page object
        if ( [ 0, '0', 'current' ].includes( this.page.diff ) ) {
            this.page.diff = 'cur';
        }
        if ( !utils.isValidDir( this.page.direction ) ) {
            this.page.direction = 'prev';
        }
        this.page = utils.extendPage( this.page );
    }

    load() {
        if ( this.isLoading ) return;

        if ( this.options.type === 'revision' ) {
            this.requestPageDependencies();
        }

        return this.request();
    }

    /******* REQUESTS *******/

    requestPageDependencies() {
        const params = {
            action: 'parse',
            prop: [ 'modules', 'jsconfigvars' ],
            disablelimitreport: 1,
            redirects: 1,
            format: 'json',
            formatversion: 2,
            uselang: id.local.language,
        };

        // FixMe: oldid can be for the previous revision (in cases when direction = next)
        if ( !utils.isEmpty( this.page.oldid ) ) {
            params.oldid = this.page.oldid;
        } else if ( !utils.isEmpty( this.page.curid ) ) {
            params.pageid = this.page.curid;
        }

        return id.local.mwApi
            .get( params )
            .then( this.onRequestPageDependenciesDone.bind( this ) )
            .fail( this.onRequestPageDependenciesError.bind( this ) );
    }

    onRequestPageDependenciesError( error, data ) {
        const params = {
            type: 'dependencies',
        };
        if ( data?.error ) {
            params.code = data.error.code;
            params.message = data.error.info;
        } else {
            params.message = error;
        }
        utils.notifyError( 'error-dependencies-parse', this.page, params, true );
    }

    onRequestPageDependenciesDone( data ) {
        // Render error if the parse request is completely failed
        const parse = data?.parse;
        if ( !parse ) {
            return this.onRequestPageDependenciesError( null, data );
        }

        // Get page dependencies
        let dependencies = [ ...parse.modulestyles, ...parse.modulescripts, ...parse.modules ];

        // Get dependencies by type
        const typeDependencies = id.config.dependencies[ this.options.type ];
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

        mw.config.set( parse.jsconfigvars );
        mw.loader.load( utils.getDependencies( dependencies ) );
    }

    request() {
        this.isLoading = true;
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

        return $.ajax( params )
            .done( this.onRequestDone.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
    }

    onRequestError( data ) {
        this.isLoading = false;

        this.error = {
            type: this.options.type,
            code: this.options.type === 'revision' && !utils.isEmpty( this.page.curid ) ? 'curid' : 'generic',
        };

        if ( data?.error ) {
            this.error.code = data.error.code;
            this.error.message = data.error.info;
        }
        utils.notifyError( `error-${ this.error.type }-${ this.error.code }`, this.page, this.error );

        this.render();
        mw.hook( `${ id.config.prefix }.diff.renderError` ).fire( this );
        mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
    }

    onRequestDone( data ) {
        this.isLoading = false;
        this.data = data;

        if ( !this.data ) {
            return this.onRequestError();
        }

        this.render();
        mw.hook( `${ id.config.prefix }.diff.renderSuccess` ).fire( this );
        mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
    }

    /******* RENDER *******/

    render() {
        const classes = [
            'instantDiffs-dialog-content',
            `instantDiffs-dialog-content--${ this.options.type }`,
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
            .addClass( 'instantDiffs-dialog-tools' )
            .appendTo( this.nodes.$container );

        this.nodes.$body = $( '<div>' )
            .addClass( 'instantDiffs-dialog-body' )
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

        // Collect missing data from the diff table before manipulations
        this.collectData();

        // Process diff table
        this.renderDiffTable();

        // Hide unsupported or unnecessary apps and element
        this.nodes.$wikiLambdaApp = this.nodes.$data
            .filter( '#ext-wikilambda-app' )
            .addClass( 'instantDiffs-hidden' );

        if ( this.nodes.$wikiLambdaApp.length > 0 ) {
            const $message = $( `<p>${ utils.msg( 'unsupported-wikilambda' ) }</p>` );
            this.renderWarning( $message );
        }

        // Set additional config variables
        mw.config.set( this.mwConfg );
    }

    collectData() {
        const $fromLinks = this.nodes.$data.find( '#mw-diff-otitle1 strong > a, #mw-diff-otitle4 > a' );
        const $toLinks = this.nodes.$data.find( '#mw-diff-ntitle1 strong > a, #mw-diff-ntitle4 > a' );

        // Get diff and oldid values
        // FixMe: request via api action=revisions
        if ( $fromLinks.length > 0 ) {
            const oldid = utils.getOldidFromUrl( $fromLinks.prop( 'href' ) );
            if ( utils.isValidID( oldid ) ) {
                this.mwConfg.wgDiffOldId = oldid;
            }
        }
        if ( $toLinks.length > 0 ) {
            const diff = utils.getOldidFromUrl( $toLinks.prop( 'href' ) );
            if ( utils.isValidID( diff ) ) {
                this.mwConfg.wgDiffNewId = diff;
                this.mwConfg.wgRevisionId = diff;

                // Set actual revision id for the copy actions, etc.
                if ( this.options.typeVariant !== 'page' ) {
                    this.page.revid = diff;
                }

                // Replace diff when its values = cur
                if ( this.page.diff === 'cur' ) {
                    this.page.diff = diff;
                }
            }
        }

        // Get page title
        const $links = $toLinks.add( $fromLinks );
        if ( utils.isEmpty( this.page.title ) && $links.length > 0 ) {
            const title = utils.getTitleFromUrl( $links.prop( 'href' ) ) || $links.prop( 'title' );
            this.page = utils.extendPage( this.page, { title } );
        }

        // Populate section name
        const $toSectionLinks = this.nodes.$data.find( '#mw-diff-ntitle3 .autocomment a' );
        if ( utils.isEmpty( this.page.section ) && $toSectionLinks.length > 0 ) {
            const section = utils.getHashFromUrl( $toSectionLinks.prop( 'href' ) );
            this.page = utils.extendPage( this.page, { section } );
        }
    }

    renderDiffTable() {
        // Hide unsupported or unnecessary element
        this.nodes.$data
            .filter( '.mw-revslider-container, .mw-diff-revision-history-links, .mw-diff-table-prefix, #mw-oldid' )
            .addClass( 'instantDiffs-hidden' );
        this.nodes.$data
            .find( '.fr-diff-to-stable, #mw-fr-diff-dataform' )
            .addClass( 'instantDiffs-hidden' );

        // Find table elements
        this.nodes.$frDiff = this.nodes.$data.filter( '#mw-fr-diff-headeritems' );
        this.nodes.$table = this.nodes.$data.filter( 'table.diff' );

        // Find and detach the all unpatrolled diffs link
        this.nodes.$pendingLink = this.nodes.$frDiff
            .find( '.fr-diff-to-stable a' )
            .detach();
        if ( this.options.type === 'diff' ) {
            this.links.$pending = this.nodes.$pendingLink;
        }

        // Find and detach the next / previous diff links
        this.links.$prev = this.nodes.$table
            .find( '#differences-prevlink' )
            .detach();
        this.links.$next = this.nodes.$table
            .find( '#differences-nextlink' )
            .detach();

        // Clear whitespaces after detaching links
        const leftTitle4 = this.nodes.$table.find( '#mw-diff-otitle4' );
        if ( leftTitle4.length > 0 ) {
            leftTitle4.text( leftTitle4.text().trim() );
        }
        const rightTitle4 = this.nodes.$table.find( '#mw-diff-ntitle4' );
        if ( rightTitle4.length > 0 ) {
            rightTitle4.text( rightTitle4.text().trim() );
        }

        // Show or hide diff info table in the revisions
        if ( this.options.type === 'revision' ) {
            if ( utils.defaults( 'showRevisionInfo' ) ) {
                // Hide the left side of the table and left only related to the revision info
                this.nodes.$frDiff.find( '.fr-diff-ratings td:nth-child(2n-1)' ).addClass( 'instantDiffs-hidden' );
                this.nodes.$table.find( 'td:is(.diff-otitle, .diff-side-deleted)' ).addClass( 'instantDiffs-hidden' );
                this.nodes.$table.find( 'td:is(.diff-ntitle, .diff-side-added)' ).attr( 'colspan', '4' );

                // Hide comparison lines
                this.nodes.$table.find( 'tr:not([class])' ).addClass( 'instantDiffs-hidden' );
            } else {
                this.nodes.$frDiff.addClass( 'instantDiffs-hidden' );
                this.nodes.$table.addClass( 'instantDiffs-hidden' );
            }
        }
    }

    renderError() {
        const $message = $( `<p>${ utils.msg( 'error-revision-missing' ) }</p>` );
        if ( this.error?.message ) {
            $message.add( `<p>${ this.error.message }</p>` );
        }
        this.renderWarning( $message );
    }

    renderWarning( $content ) {
        const $box = utils.renderBox( { $content, type: 'warning' } );
        utils.embed( $box, this.nodes.$body );
    }

    renderNavigation() {
        this.navigation = new Navigation( this, this.page, this.pageParams, {
            type: this.options.type,
            typeVariant: this.options.typeVariant,
            links: this.links,
        } );
        this.navigation.embed( this.nodes.$container, 'prependTo' );
    }

    processLinksTaget() {
        if ( !utils.defaults( 'openInNewTab' ) ) return;
        const $links = this.nodes.$container.find( 'a:not(.mw-thanks-thank-link, .jquery-confirmable-element)' );
        $links.each( ( i, node ) => node.setAttribute( 'target', '_blank' ) );
    }

    /******* ACTIONS *******/

    fire() {
        // Fire diff table hook
        if (
            this.options.type !== 'revision' ||
            ( this.options.type === 'revision' && utils.defaults( 'showRevisionInfo' ) )
        ) {
            const $diffTable = this.getDiffTable();
            if ( $diffTable?.length > 0 ) {
                mw.hook( 'wikipage.diff' ).fire( $diffTable );
            }
        }

        // Fire general content hook
        const $container = this.getContainer();
        if ( $container?.length > 0 ) {
            mw.hook( 'wikipage.content' ).fire( $container );
        }

        // Replace link target attributes after the hooks have fired
        this.processLinksTaget();
    }

    focus() {
        this.options.initiatorDialog?.focus();
    }

    redraw( params ) {
        this.navigation.redraw( params );
    }

    getType() {
        return this.options.type;
    }

    getTypeVariant() {
        return this.options.typeVariant;
    }

    getPage() {
        return this.page;
    }

    getPageTitleText() {
        if ( this.error ) return utils.msg( 'title-not-found' );
        if ( utils.isEmpty( this.page.title ) ) return utils.msg( 'title-empty' );
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

    getOverlay() {
        return this.options.initiatorDialog?.getOverlay();
    }

    getInitiatorDiff() {
        return this.options.initiatorDiff;
    }

    detach() {
        mw.hook( `${ id.config.prefix }.diff.beforeDetach` ).fire( this );
        this.navigation.detach();
        this.nodes.$container.detach();
    }
}

export default Diff;