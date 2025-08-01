import id from './id';
import { config, local, timers } from './config';
import * as utils from './utils';
import { mixEventEmitterInObject } from './utils-oojs';

import './styles/app.less';

import Api from './Api';
import Article from './Article';
import Button from './Button';
import Link from './Link';
import Page from './Page';
import LocalPage from './LocalPage';
import GlobalPage from './GlobalPage';
import ViewButton from './ViewButton';
import HistoryCompareButton from './HistoryCompareButton';
import Watch from './Watch';
import view from './View';
import settings from './Settings';

import './styles/skins.less';

/******* PAGE SPECIFIC ADJUSTMENTS *******/

function applyPageAdjustments() {
    if ( id.isPageAdjustmentsApplied || !utils.isAllowed() ) return;

    id.isPageAdjustmentsApplied = true;

    // Add a status to the body tag
    document.body.classList.add( 'instantDiffs-enabled' );

    // Change Lists
    if ( id.config.changeLists.includes( id.local.mwCanonicalSpecialPageName ) ) {
        return processChangelistPage();
    }

    // User Contributions
    if ( id.config.contributionLists.includes( id.local.mwCanonicalSpecialPageName ) ) {
        return processContributionsPage();
    }

    // GlobalWatchlist Extension
    if ( id.local.mwCanonicalSpecialPageName === 'GlobalWatchlist' ) {
        return processGlobalWatchlistPage();
    }

    // History
    if ( id.local.mwAction === 'history' ) {
        return processHistoryPage();
    }
}

function processChangelistPage() {
    // Add an instantDiffs-line CSS class
    $( '.mw-changeslist-line' ).addClass( 'instantDiffs-line' );
}

function processContributionsPage() {
    // Fill empty links
    const $contributionsLines = $( '.mw-contributions-list .mw-changeslist-links:not(.mw-pager-tools) > span:first-child' );
    $contributionsLines.each( ( i, node ) => {
        const $node = $( node );
        if ( $node.find( 'a' ).length === 0 ) {
            $node.wrapInner( utils.renderPlaceholder() );
        }
    } );

    // GlobalContributions Extension
    if ( id.local.mwCanonicalSpecialPageName === 'GlobalContributions' ) {
        processGlobalContributionsPage();
    }
}

function processGlobalContributionsPage() {
    // Fix relative links in the edit comments
    // ToDo: remove after bug is fixed (T398108)
    const $contributionsLines = $( '.mw-contributions-list li' );
    $contributionsLines.each( ( i, node ) => {
        const $node = $( node );
        const $link = $node.find( 'a.mw-changeslist-date, a.mw-changeslist-history' );
        if ( $link.length === 0 ) return;

        try {
            const url = new URL( $link.prop( 'href' ) );
            utils.addBaseToLinks( $node, url.origin );
        } catch {}
    } );
}

function processGlobalWatchlistPage() {
    // ToDo: remove mutation observer after hooks are implemented (T275159)
    const container = document.getElementById( 'ext-globalwatchlist-watchlistsfeed' );
    id.local.mutationObserver.observe( container, {
        childList: true,
    } );
}

function processHistoryPage() {
    // Add an instantDiffs-line CSS class that adds spaces between selector checkboxes
    const $revisionLines = $( '#pagehistory > li, #pagehistory .mw-contributions-list > li' )
        .addClass( 'instantDiffs-line--history' );

    // Add a compare button only if the number of lines is greater than 1
    if ( $revisionLines.length <= 1 ) return;

    // Fill empty links
    $revisionLines.each( ( i, node ) => {
        const $container = $( node );
        const $cur = $container.find( '.mw-history-histlinks > span:first-child' );
        const $prev = $container.find( '.mw-history-histlinks > span:last-child' );
        if ( $cur.find( 'a' ).length === 0 ) {
            $cur.wrapInner( utils.renderPlaceholder() );
        }
        if ( $prev.find( 'a' ).length === 0 ) {
            $prev.wrapInner( utils.renderPlaceholder() );
        }
    } );

    // Dynamic revision selector
    const $revisionSelector = $( '.mw-history-compareselectedversions' );
    $revisionSelector.each( ( i, node ) => {
        const $container = $( node );
        const $button = $container.find( '.mw-history-compareselectedversions-button' );

        new HistoryCompareButton( {
            label: utils.msg( 'compare-label', id.config.labels.diff ),
            title: utils.msg( 'compare-title', utils.msg( 'script-name' ) ),
            classes: [ 'mw-ui-button', 'cdx-button', 'instantDiffs-button--compare' ],
            insertMethod: 'insertAfter',
            container: $button,
        } );

        $( '<span>' )
            .text( ' ' )
            .addClass( 'instantDiffs-spacer' )
            .insertAfter( $button );
    } );
}

/******* PREPARE ******/

function prepare( require ) {
    // Save exported modules to the ID singleton
    id.local.require = require;

    // Hide the links panel to prevent blinking before the main stylesheet is applied
    mw.util.addCSS( '.instantDiffs-panel { display:none; }' );

    // Mixin OO.EventEmitter to the classes after the OOJS dependencies loaded
    view.mixin();
    settings.mixin();
    mixEventEmitterInObject( view );
    mixEventEmitterInObject( settings );
    OO.mixinClass( Button, OO.EventEmitter );
    OO.mixinClass( Page, OO.EventEmitter );

    // Prepare locale variables
    id.local.mwIsAnon = mw.user?.isAnon?.() ?? true;
    id.local.mwEndPoint = `${ location.origin }${ mw.config.get( 'wgScript' ) }`;
    id.local.mwEndPointUrl = new URL( id.local.mwEndPoint );
    id.local.mwAction = mw.config.get( 'wgAction' );
    id.local.mwArticlePath = (/** @type {string} */ mw.config.get( 'wgArticlePath' ) ).replace( '$1', '' );
    id.local.mwCanonicalSpecialPageName = mw.config.get( 'wgCanonicalSpecialPageName' );
    id.local.mwTitle = new mw.Title( /** @type {string} */ mw.config.get( 'wgRelevantPageName' ) );
    id.local.mwTitleText = id.local.mwTitle.getPrefixedText();

    // Predict a mobile server name and add it to the mw.config
    const mobileServer = utils.getMobileServer();
    mw.config.set( 'wgMobileServer', mobileServer );
    mw.config.set( 'wgMobileServerName', utils.getComponentFromUrl( 'hostname', mobileServer ) );

    // Get hostnames (including predicted mobile variants) used to assemble the link selector
    id.local.mwServers = [ mw.config.get( 'wgServer' ), mw.config.get( 'wgMobileServer' ) ]
        .filter( value => !utils.isEmpty( value ) )
        .map( utils.getHref );
    id.local.mwServerNames = [ mw.config.get( 'wgServerName' ), mw.config.get( 'wgMobileServerName' ) ]
        .filter( value => !utils.isEmpty( value ) );

    // Save the current version number to the local storage
    id.local.lastVesrion = mw.storage.get( `${ id.config.prefix }-version` );
    mw.storage.set( `${ id.config.prefix }-version`, id.config.version );

    // Init dom mutation observer
    id.local.mutationObserver = new MutationObserver( observeMutations );

    // Init links Intersection Observer
    id.local.interactionObserver = new IntersectionObserver( observeInteractions, {
        threshold: 0,
        rootMargin: utils.defaults( 'debug' ) ? '0px 0px 0px 0px' : '33% 0px 33% 0px',
    } );

    // Init unload events
    window.addEventListener( 'beforeunload', unload );

    // Get other dependencies
    return Promise.allSettled( [
        Api.getSpecialPages(),
        getSiteInfo(),
        ...getMessages(),
    ] );
}

async function getSiteInfo() {
    const { general } = await Api.getSiteInfo( [ 'general' ] ) || {};
    if ( !utils.isEmptyObject( general ) ) {
        // Add a mobile server name to the mw.config
        if ( !utils.isEmpty( general.mobileserver ) ) {
            mw.config.set( 'wgMobileServer', general.mobileserver );
            mw.config.set( 'wgMobileServerName', general.mobileservername );
        }

        // Get hostnames (including mobile variants) used to assemble the link selector
        id.local.mwServers = [ general.server, general.mobileserver ]
            .filter( value => !utils.isEmpty( value ) )
            .map( utils.getHref );
        id.local.mwServerNames = [ general.servername, general.mobileservername ]
            .filter( value => !utils.isEmpty( value ) );
    }
}

function getMessages() {
    /**
     * @type {string}
     */
    const userLanguage = mw.config.get( 'wgUserLanguage' );

    return [ 'en', userLanguage ]
        .filter( ( value, index, self ) => {
            return self.indexOf( value ) === index && !id.i18n[ value ];
        } )
        .map( lang => {
            const path = id.config.dependencies.messages.replace( '$lang', lang );
            return mw.loader.getScript( utils.origin( path ) );
        } );
}

function assembleLinkSelector() {
    // Assemble RegExp for testing for mwArticlePath
    id.local.articlePathRegExp = new RegExp(
        id.config.articlePathRegExp.replaceAll( '$1', id.local.mwArticlePath ),
    );

    // Start assemble links selector
    const linkSelector = [];
    id.config.linkSelector.forEach( item => {
        if ( /\$1/.test( item ) ) {
            id.local.mwServers.forEach( server => {
                linkSelector.push(
                    item.replaceAll( '$1', server ),
                );
            } );
        } else {
            linkSelector.push( item );
        }
    } );

    // Assemble a link selector for the special pages
    for ( const [ name, local ] of Object.entries( Api.specialPagesLocal ) ) {
        id.local.specialPagesLocalPrefixed[ name ] = new mw.Title( local ).getPrefixedDb();
        id.local.specialPagesAliases[ name ] = utils.getSpecialPageAliases( Api.specialPagesLocal, name );
        id.local.specialPagesAliasesPrefixed[ name ] = utils.getSpecialPageAliases( id.local.specialPagesLocalPrefixed, name );

        id.local.specialPagesAliases[ name ].forEach( title => {
            linkSelector.push(
                id.config.specialPagesSelector.replaceAll( '$1', title ),
            );
        } );
    }

    // Assemble RegExp for testing page titles in the links
    const specialPagesAliasesPrefixed = Object.values( id.local.specialPagesAliasesPrefixed ).flat().join( '|' );
    id.local.specialPagesPathRegExp = new RegExp(
        id.config.specialPagesPathRegExp
            .replaceAll( '$1', id.local.mwArticlePath )
            .replaceAll( '$2', specialPagesAliasesPrefixed ),
    );
    id.local.specialPagesSearchRegExp = new RegExp(
        id.config.specialPagesSearchRegExp.replaceAll( '$1', specialPagesAliasesPrefixed ),
    );

    // Join a link selector assembled results
    id.local.linkSelector = linkSelector.join( ',' );
}

/******* BOOTSTRAP *******/

function app() {
    // Merge default options with user defined options
    const settingOptions = { ...config.settings, ...id.settings };
    const defaultOptions = { ...config.defaults, ...id.defaults, ...utils.getQueryDefaults() };

    // Prevent multiple instances of the script from running.
    // However, if a new instance is replacing a standalone instance,
    // ensure it updates the config and starts processing content.
    if ( id.isRunning ) {
        // Replace standalone instance with newer non-standalone instance
        id.isReplaced = handleReplace( settingOptions, defaultOptions );

        utils.notifyError( id.isReplaced ? 'error-prepare-replaced' : 'error-prepare-version', {
            type: 'version',
            message: `loaded: ${ id.config.version }, concurrent: ${ config.version }`,
        }, null, true );
        return;
    }

    // Initialize application state
    id.isRunning = true;

    // Export to global scope
    id.config = config;
    id.local = local;
    id.local.settings = settingOptions;
    id.local.defaults = defaultOptions;
    id.timers = timers;
    id.utils = utils;
    id.modules = {
        Api,
        Article,
        Link,
        Button,
        ViewButton,
        HistoryCompareButton,
        Page,
        LocalPage,
        GlobalPage,
        Watch,
        view,
        settings,
    };

    // Track on run start time
    id.timers.run = mw.now();

    // Bundle english language strings
    require( `../${ id.config.outdir }/instantDiffs-i18n/en.js` );

    // Pre-process english language strings
    utils.processMessages();

    // Bundle extensions
    require( './extensions.js' );

    // Load dependencies and prepare variables
    load();
}

function load() {
    mw.loader.load( utils.origin( id.config.dependencies.styles ), 'text/css' );
    mw.loader.using( id.config.dependencies.main )
        .then( prepare )
        .then( () => $( ready ) )
        .fail( error => {
            utils.notifyError( 'error-prepare-generic', {
                type: 'prepare',
                message: error?.message,
            } );
        } );
}

async function ready() {
    await utils.processDefaults();
    utils.processMessages();

    // Check if script is enabled on mobile skin (Minerva)
    if ( mw.config.get( 'skin' ) === 'minerva' && !utils.defaults( 'enableMobile' ) ) {
        utils.notifyError( 'error-prepare-mobile', { type: 'mobile' }, null, true );
        return;
    }

    // Perform page-specific adjustments after preparation and call the ready state
    id.isReady = true;
    assembleLinkSelector();
    applyPageAdjustments();

    // Track on ready time
    id.timers.ready = mw.now();

    // Fire the ready state hook
    mw.hook( `${ id.config.prefix }.ready` ).fire( id );

    // Add process hook listeners
    mw.hook( 'wikipage.content' ).add( processContent );
    mw.hook( `${ id.config.prefix }.process` ).add( process );
    mw.hook( `${ id.config.prefix }.replace` ).add( processReplace );
}

function processContent( $context ) {
    // Check the including / excluding rules only for the 'wikipage.content' hook
    if ( !$context || !utils.isAllowed() ) return;

    // Process all page links including system messages on the first run
    id.isFirstRun = !id.isRunCompleted;
    if ( id.isFirstRun ) {
        id.isRunCompleted = true;
        $context = utils.getBodyContentNode();
    }

    // Process links
    process( $context );

    // Log timers for the first run
    if ( utils.defaults( 'logTimers' ) && id.isFirstRun ) {
        utils.logTimer( 'ready time', id.timers.run, id.timers.ready );
        utils.logTimer( 'total time', id.timers.run, id.timers.processEnd );
    }
}

function process( $context ) {
    if ( !$context ) return;

    // Track on process start time
    id.timers.processStart = mw.now();

    // Get all links using the assembled selector and skip those already processed
    const links = Array.from( Link.findLinks( $context ) )
        .filter( ( node ) => !Link.hasLink( node ) )
        .map( ( node ) => new Link( node ) );

    // Track on process end time
    id.timers.processEnd = mw.now();

    // Log timers for the process
    if ( utils.defaults( 'logTimers' ) && links.length > 0 ) {
        utils.log( 'info', `links processed: ${ links.length }` );
        utils.logTimer( 'process time', id.timers.processStart, id.timers.processEnd );
    }

    // Fire the process end hook
    mw.hook( `${ id.config.prefix }.processed` ).fire( links );
}

function handleReplace( settingOptions, defaultOptions ) {
    if ( id.utils.defaults( 'standalone' ) && !defaultOptions.standalone ) {
        // Call an internal hook to modify settings of the original instance.
        // We want to use original instance because each new one will construct
        // a new set of the modules with a new context.
        mw.hook( `${ id.config.prefix }.replace` ).fire( settingOptions, defaultOptions );
        return true;
    }
    return false;
}

async function processReplace( settingOptions, defaultOptions ) {
    if ( !settingOptions || !defaultOptions ) return;

    id.local.settings = settingOptions;
    id.local.defaults = defaultOptions;

    if ( id.isReady ) {
        await utils.processDefaults();

        // Reset time loggers
        id.timers.run = mw.now();
        id.timers.ready = mw.now();

        // Start processing content
        applyPageAdjustments();
        processContent( utils.getBodyContentNode() );
    }
}

function observeInteractions( entries ) {
    entries.forEach( entry => {
        if ( !entry.isIntersecting ) return;

        const link = Link.getLink( entry.target );
        if ( link ) {
            link.onIntersect();
        }
    } );
}

function observeMutations( entries ) {
    entries.forEach( entry => {
        if ( entry.addedNodes.length > 0 ) {
            mw.hook( `${ id.config.prefix }.process` ).fire( $( entry.target ) );
        }
    } );
}

function unload() {
    id.isUnloading = true;
    id.local.mutationObserver?.disconnect();
    id.local.interactionObserver?.disconnect();
}

app();