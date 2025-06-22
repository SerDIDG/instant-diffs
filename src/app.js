import id from './id';
import { config, local, timers } from './config';
import * as utils from './utils';

import './styles/app.less';

import Button from './Button';
import Link from './Link';
import Diff from './Diff';
import Dialog from './Dialog';
import DialogButton from './DialogButton';
import HistoryCompareButton from './HistoryCompareButton';

import './styles/skins.less';

/******* PAGE SPECIFIC ADJUSTMENTS *******/

function applyPageSpecificAdjustments() {
    if ( !utils.isAllowed() ) return;

    // Change Lists
    if ( id.config.changeLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) ) ) {
        return processChangelistPage();
    }

    // User Contributions
    if ( id.config.contributionLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) ) ) {
        return processContributionsPage();
    }

    // History
    if ( mw.config.get( 'wgAction' ) === 'history' ) {
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

function prepare() {
    // Hide the links panel to prevent blinking before the main stylesheet is applied
    mw.util.addCSS( '.instantDiffs-panel { display:none; }' );

    // Prepare locale variables
    id.local.mwIsAnon = mw.user?.isAnon?.() ?? true;
    id.local.mwEndPoint = `${ location.origin }${ mw.config.get( 'wgScript' ) }`;
    id.local.mwEndPointUrl = new URL( id.local.mwEndPoint );
    id.local.mwApi = new mw.Api();
    id.local.mwArticlePath = mw.config.get( 'wgArticlePath' ).replace( '$1', '' );
    id.local.titleText = new mw.Title( mw.config.get( 'wgPageName' ) ).getPrefixedText();

    // Get hostnames (including mobile variants) used to assemble the link selector
    id.local.mwServers.push( mw.config.get( 'wgServer' ) );
    const mobileServer = utils.getMobileServer();
    if ( mobileServer ) {
        id.local.mwServers.push( mobileServer );
    }

    // Init links Intersection Observer
    id.local.observer = new IntersectionObserver( observe, {
        threshold: 0,
        rootMargin: utils.defaults( 'debug' ) ? '0px 0px 0px 0px' : '33% 0px 33% 0px',
    } );

    // Init unload events
    window.addEventListener( 'beforeunload', unload );

    // Get other dependencies
    return Promise.allSettled( [
        getLocalizedTitles(),
        ...getMessages(),
    ] );
}

function getLocalizedTitles() {
    // Convert to the key value format
    id.config.specialPages.forEach( name => {
        id.local.specialPages[ name ] = name;
    } );

    // Try to get cached specialPages from local storage
    id.local.specialPagesLocal = mw.storage.getObject( `${ id.config.prefix }-specialPagesLocal` );
    if (
        id.local.specialPagesLocal &&
        Object.keys( id.local.specialPagesLocal ).length === Object.keys( id.local.specialPages ).length
    ) {
        return true;
    }

    // Request localized specialPages
    const params = {
        action: 'query',
        titles: id.config.specialPages,
        format: 'json',
        formatversion: 2,
        uselang: mw.config.get( 'wgContentLanguage' ),
    };
    return id.local.mwApi
        .get( params )
        .then( onRequestLocalizedTitlesDone );
}

function onRequestLocalizedTitlesDone( data ) {
    if ( !data?.query?.pages ) return;

    id.local.specialPagesLocal = {};

    // Fallback for names of special pages
    for ( const [ key, value ] of Object.entries( id.local.specialPages ) ) {
        id.local.specialPagesLocal[ key ] = value;
    }

    // Localized names of special pages
    if ( data.query.normalized ) {
        data.query.normalized.forEach( item => {
            id.local.specialPagesLocal[ item.from ] = item.to;
        } );
    }

    mw.storage.setObject( `${ id.config.prefix }-specialPagesLocal`, id.local.specialPagesLocal );
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
            return mw.loader.getScript( utils.getOrigin( path ) );
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
    for ( const [ name, local ] of Object.entries( id.local.specialPagesLocal ) ) {
        id.local.specialPagesLocalPrefixed[ name ] = new mw.Title( local ).getPrefixedDb();
        id.local.specialPagesAliases[ name ] = utils.getSpecialPageAliases( id.local.specialPagesLocal, name );
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
    // Prevent multiple instances of the script from running
    if ( id.isRunning ) {
        utils.notifyError( 'error-prepare-version', null, {
            type: 'version',
            message: `loaded: ${ id.config.version }, concurrent: ${ config.version }`,
        }, true );
        return;
    }

    id.isRunning = true;

    // Export to global scope
    id.utils = utils;
    id.config = config;
    id.local = local;
    id.timers = timers;
    id.api = { Button, DialogButton, HistoryCompareButton, Dialog, Diff, Link };
    id.settings ||= {};
    id.settings = { ...id.config.settings, ...id.settings };
    id.defaults ||= {};
    id.defaults = { ...id.config.defaults, ...id.defaults };

    // Track on run start time
    id.timers.run = Date.now();

    // Bundle english language strings
    require( `../${ id.config.outdir }/instantDiffs-i18n/en.js` );

    // Pre-process english language strings
    utils.processMessages();

    // Bundle extensions
    require( './extensions.js' );

    // Load dependencies and prepare variables
    mw.loader.load( utils.getOrigin( id.config.dependencies.styles ), 'text/css' );
    mw.loader.using( id.config.dependencies.main )
        .then( prepare )
        .then( ready )
        .fail( error => {
            utils.notifyError( 'error-prepare-generic', null, {
                type: 'prepare',
                message: error?.message,
            } );
        } );
}

function ready() {
    utils.processDefaults();
    utils.processMessages();

    // Check if the script is enabled on the mobile skin (Minerva)
    if ( mw.config.get( 'skin' ) === 'minerva' && !utils.defaults( 'enableMobile' ) ) {
        utils.notifyError( 'error-prepare-mobile', null, { type: 'mobile' }, true );
        return;
    }

    // Perform page-specific adjustments after preparation and call the ready state
    id.isReady = true;
    document.body.classList.add( 'instantDiffs-enabled' );
    assembleLinkSelector();
    applyPageSpecificAdjustments();

    // Track on ready time
    id.timers.ready = Date.now();

    // Fire the ready state hook
    mw.hook( `${ id.config.prefix }.ready` ).fire( id );

    // Add process hook listeners
    mw.hook( 'wikipage.content' ).add( processContent );
    mw.hook( `${ id.config.prefix }.process` ).add( process );
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
    id.timers.processStart = Date.now();

    // Get all links using the assembled selector and skip those already processed
    const links = Array.from( utils.getLinks( $context ) )
        .filter( ( node ) => !id.local.links.has( node ) )
        .map( ( node ) => new Link( node ) );

    // Track on process end time
    id.timers.processEnd = Date.now();

    // Log timers for the process
    if ( utils.defaults( 'logTimers' ) && links.length > 0 ) {
        utils.log( 'info', `links processed: ${ links.length }` );
        utils.logTimer( 'process time', id.timers.processStart, id.timers.processEnd );
    }

    // Fire the process end hook
    mw.hook( `${ id.config.prefix }.processed` ).fire( links );
}

function observe( entries ) {
    entries.forEach( entry => {
        if ( !entry.isIntersecting ) return;

        const link = id.local.links.get( entry.target );
        if ( link ) {
            link.onIntersect();
        }
    } );
}

function unload() {
    id.isUnloading = true;
    id.local.observer?.disconnect();
}

app();