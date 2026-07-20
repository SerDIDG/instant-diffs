import id from './id';
import { config, local, timers } from './config';
import * as utils from './utils';
import { mixEventEmitterInObject } from './utils-oojs';
import { getQueryDefaults, getSchemaDefaults, getSchemaSettings } from './utils-settings';

import './styles/app.less';

import Api from './Api';
import Site from './Site';
import Article from './Article';
import Button from './Button';
import Link from './Link';
import Page from './Page';
import LocalPage from './LocalPage';
import GlobalPage from './GlobalPage';
import ViewButton from './ViewButton';
import HistoryCompareButton from './HistoryCompareButton';
import Watch from './Watch';
import view from './view';
import settings from './settings';

import './styles/skins.less';

/******* PREPARE ******/

/**
 * Prepare the application after dependencies are loaded.
 * Initializes OOJS mixins, locale variables, observers, and fetches site info.
 * @param {Function} require - Module require function
 * @return {Promise<PromiseSettledResult<any>[]>} Promise that resolves when all preparations complete
 */
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
	id.local.mwServer = mw.config.get( 'wgServer' );
	id.local.mwServerName = mw.config.get( 'wgServerName' );

	// Predict a mobile server name and add it to the mw.config
	const mobileServer = utils.getMobileServer();
	mw.config.set( 'wgMobileServer', mobileServer );
	mw.config.set( 'wgMobileServerName', utils.getComponentFromUrl( 'hostname', mobileServer ) );

	// Get hostnames (including predicted mobile variants) used to assemble the link selector
	const mwServers = [ id.local.mwServer, mw.config.get( 'wgMobileServer' ) ]
		.filter( value => !utils.isEmpty( value ) )
		.map( utils.getHref );
	id.local.mwServers = utils.arrayUnique( mwServers );

	const mwServerNames = [ id.local.mwServerName, mw.config.get( 'wgMobileServerName' ) ]
		.filter( value => !utils.isEmpty( value ) );
	id.local.mwServerNames = utils.arrayUnique( mwServerNames );

	// Save the current version number to the local storage
	id.local.lastVersion = mw.storage.get( `${ id.config.prefix }-version` );
	mw.storage.set( `${ id.config.prefix }-version`, id.config.version );

	// Init dom mutation observer
	id.local.mutationObserver = new MutationObserver( observeMutations );

	// Init links Intersection Observer
	id.local.interactionObserver = new IntersectionObserver( observeInteractions, {
		threshold: 0,
		rootMargin: settings.get( 'debug' ) ? '0px 0px 0px 0px' : '33% 0px 33% 0px',
	} );

	// Init page change events
	window.addEventListener( 'pageshow', refresh );
	window.addEventListener( 'beforeunload', unload );

	// Get other dependencies
	return Promise.allSettled( [
		Api.getSpecialPages(),
		getSiteInfo(),
		...getMessages(),
	] );
}

/**
 * Fetch site information from the MediaWiki API.
 * Updates mobile server configuration and server name lists.
 * @return {Promise<void>}
 */
async function getSiteInfo() {
	const { general } = await Site.getInfo() || {};
	if ( !utils.isEmptyObject( general ) ) {
		// Add a mobile server name to the mw.config
		// ToDo: mobile server name will be deprecated soon (T214998)
		if ( !utils.isEmpty( general.mobileserver ) ) {
			mw.config.set( 'wgMobileServer', general.mobileserver );
			mw.config.set( 'wgMobileServerName', general.mobileservername );
		}

		// Get hostnames (including mobile variants) used to assemble the link selector
		const mwServers = [ ...id.local.mwServers, general.server, general.mobileserver ]
			.filter( value => !utils.isEmpty( value ) )
			.map( utils.getHref );
		id.local.mwServers = utils.arrayUnique( mwServers );

		const mwServerNames = [ ...id.local.mwServerNames, general.servername, general.mobileservername ]
			.filter( value => !utils.isEmpty( value ) );
		id.local.mwServerNames = utils.arrayUnique( mwServerNames );
	}
}

/**
 * Load i18n message files for the user's language and English fallback.
 * Skips languages already present in the i18n cache.
 * @return {JQuery.Promise<any>[]} Promises for each language file being loaded, empty if all cached
 */
function getMessages() {
	/** @type {string} */
	const userLanguage = mw.config.get( 'wgUserLanguage' );

	return [ 'en', userLanguage ]
		.filter( ( value, index, self ) => {
			return self.indexOf( value ) === index && !id.i18n[ value ];
		} )
		.map( lang => {
			const path = (/** @type {string} */ id.config.dependencies.i18n ).replace( '$lang', lang );
			return mw.loader.getScript( utils.server( path ) );
		} );
}

/**
 * Assemble special page aliases and prefixed versions.
 * Creates optimized flat arrays for special page matching.
 */
function assembleSpecialPages() {
	for ( const [ name, local ] of Object.entries( Api.specialPagesLocal ) ) {
		id.local.specialPagesLocalPrefixed[ name ] = new mw.Title( local ).getPrefixedDb();
		id.local.specialPagesAliases[ name ] = utils.getSpecialPageAliases( Api.specialPagesLocal, name );
		id.local.specialPagesAliasesPrefixed[ name ] = utils.getSpecialPageAliases( id.local.specialPagesLocalPrefixed, name );
		id.local.specialPagesAliasesRegExp[ name ] = utils.getSpecialPageLinksRegExp( id.local.specialPagesAliasesPrefixed[ name ] );

		if ( id.config.specialPagesLinks.includes( name ) ) {
			id.local.specialPagesLinksAliases[ name ] = id.local.specialPagesAliases[ name ];
			id.local.specialPagesLinksAliasesPrefixed[ name ] = id.local.specialPagesAliasesPrefixed[ name ];
		}
	}

	// Assemble the flat versions of special pages aliases for optimization purposes
	id.local.specialPagesAliasesFlat = utils.arrayUnique(
		Object.values( id.local.specialPagesAliases ).flat(),
	);
	id.local.specialPagesAliasesPrefixedFlat = utils.arrayUnique(
		Object.values( id.local.specialPagesAliasesPrefixed ).flat(),
	);
	id.local.specialPagesLinksAliasesFlat = utils.arrayUnique(
		Object.values( id.local.specialPagesLinksAliases ).flat(),
	);
	id.local.specialPagesLinksAliasesPrefixedFlat = utils.arrayUnique(
		Object.values( id.local.specialPagesLinksAliasesPrefixed ).flat(),
	);

	// Assemble RegExp for testing for mwArticlePath
	const articlePathRuleset = id.config.articlePathRegExp.replaceAll( '$1', id.local.mwArticlePath );
	id.local.articlePathRegExp = new RegExp( articlePathRuleset );

	// Assemble RegExp for testing special page titles in the links
	id.local.specialPagesLinksFlatRegExp = utils.getSpecialPageLinksRegExp( id.local.specialPagesLinksAliasesPrefixedFlat );
}

/**
 * Assemble CSS selectors and RegExps for finding diff links.
 * Generates selectors based on server URLs and special page aliases.
 */
function assembleLinkSelector() {
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
	id.local.specialPagesLinksAliasesFlat.forEach( title => {
		linkSelector.push(
			id.config.specialPagesLinksSelector.replaceAll( '$1', title ),
		);
	} );

	// Join a link selector assembled results
	id.local.linkSelector = linkSelector.join( ',' );
}

/**
 * Apply page-specific adjustments based on the current MediaWiki page type.
 * Adds CSS classes and initializes page-specific processing.
 */
function applyPageAdjustments() {
	if ( id.isPageAdjustmentsApplied || !utils.isAllowed() ) return;

	id.isPageAdjustmentsApplied = true;

	// Track the page adjustments start time
	id.timers.pageAdjustmentsStart = mw.now();

	// Add a status to the body tag
	document.body.classList.add( 'instantDiffs-enabled' );

	// Fire the internal page adjustments hook
	mw.hook( `${ id.config.prefix }.pageAdjustments` ).fire( id );

	// Track the page adjustments end time
	id.timers.pageAdjustmentsEnd = mw.now();

	if ( settings.get( 'logTimers' ) ) {
		utils.logTimer( 'page adjustments time', id.timers.pageAdjustmentsStart, id.timers.pageAdjustmentsEnd );
	}
}

/******* BOOTSTRAP *******/

/**
 * Main application entry point.
 * Initializes configuration, checks for concurrent instances, and starts the loading process.
 */
function app() {
	// Prevent multiple instances of the script from running.
	// However, if a new instance is replacing a standalone instance,
	// ensure it updates the config and starts processing content.
	if ( id.isRunning ) {
		// Replace standalone instance with newer non-standalone instance
		id.isReplaced = handleReplace();

		utils.notifyError( id.isReplaced ? 'error-prepare-replaced' : 'error-prepare-version', {
			tag: 'app',
			message: `loaded: ${ id.config.version }, concurrent: ${ config.version }`,
			silent: true,
		} );
		return;
	}

	// Initialize application state
	id.isRunning = true;

	// Merge settings and defaults
	const { settingOptions, defaultOptions } = mergeSettings();

	// Export to global scope
	id.i18n ||= {};
	id.config = config;
	id.local = local;
	id.local.settings = settingOptions;
	id.local.defaults = defaultOptions;
	id.timers = timers;
	id.utils = utils;
	id.view = view;
	id.settings = settings;
	id.modules = {
		Api,
		Site,
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

	// Track run start time
	id.timers.run = mw.now();

	// Bundle language strings
	i18nBundle();

	// Pre-process language strings
	utils.processMessages();

	// Bundle extensions
	require( './extensions.js' );

	// Load dependencies and prepare variables
	load();
}

/**
 * Merge settings and defaults from the config and user-defined options.
 * @param {boolean} [replace=false] - Whether merging is part of an instance replacement; skips re-initializing user options
 * @returns {{ settingOptions: Record<string, boolean>, defaultOptions: Record<string, boolean> }}
 */
function mergeSettings( replace = false ) {
	// Merge base settings options with schema options
	config.settings = { ...getSchemaSettings(), ...config.settings };
	config.defaults = { ...getSchemaDefaults(), ...config.defaults };

	// Ensure id.user exists for the replacement path (old instances may not have it)
	id.user ||= {};

	// Move user-defined settings to id.user, freeing id.settings for the Settings instance
	if ( !replace ) {
		id.user.settings = id.settings || id.user.settings || {};
		id.user.defaults = id.defaults || id.user.defaults || {};
		delete id.settings;
		delete id.defaults;
	}

	// Merge config and user-defined options
	const settingOptions = { ...config.settings, ...id.user.settings };
	const defaultOptions = { ...config.defaults, ...id.user.defaults, ...getQueryDefaults() };

	return { settingOptions, defaultOptions };
}

/**
 * Load and bundle i18n language files.
 * Executes all language loaders from the bundled i18n file.
 */
function i18nBundle() {
	// Require the bundled language loaders
	const { loaders } = require( `../${ id.config.outdir }/${ id.config.outname }-i18n-bundle.js` );

	// Load language files
	for ( const load of Object.values( loaders ) ) {
		load();
	}
}

/**
 * Load external dependencies (styles and scripts).
 * Starts the preparation process once dependencies are loaded.
 */
function load() {
	mw.loader.load( utils.server( /** @type {string} */ id.config.dependencies.styles ), 'text/css' );
	mw.loader.using( id.config.dependencies.main )
		.then( prepare )
		.then( () => $( ready ) )
		.fail( error => {
			utils.notifyError( 'error-prepare-generic', {
				tag: 'app',
				message: error?.message,
			} );
		} );
}

/**
 * Called when the application is ready to process content.
 * Finalizes settings, assembles selectors, and sets up content processing hooks.
 * @return {Promise<void>}
 */
async function ready() {
	await settings.processDefaults();
	utils.processMessages();

	// Check if the script is enabled on mobile skin (Minerva)
	if ( mw.config.get( 'skin' ) === 'minerva' && !settings.get( 'enableMobile' ) ) {
		utils.notifyError( 'error-prepare-mobile', {
			tag: 'app',
			silent: true,
		} );
		return;
	}

	// Perform page-specific adjustments after preparation and call the ready state
	id.isReady = true;
	assembleSpecialPages();
	assembleLinkSelector();
	applyPageAdjustments();

	// Track ready time
	id.timers.ready = mw.now();

	// Fire the ready state hook
	mw.hook( `${ id.config.prefix }.ready` ).fire( id );

	// Add process hook listeners
	mw.hook( 'wikipage.content' ).add( processContent );
	mw.hook( `${ id.config.prefix }.process` ).add( process );
	mw.hook( `${ id.config.prefix }.replace` ).add( processReplace );
}

/**
 * Process content from the 'wikipage.content' hook.
 * Handles first run initialization and permission checks.
 * @param {JQuery<HTMLElement>} $context - jQuery context containing content to process
 */
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
	if ( settings.get( 'logTimers' ) && id.isFirstRun ) {
		utils.logTimer( 'ready time', id.timers.run, id.timers.ready );
		utils.logTimer( 'total time', id.timers.run, id.timers.processEnd );
	}
}

/**
 * Process links in the given context.
 * Finds unprocessed diff links, creates Link instances, and fires processing hooks.
 * @param {JQuery<HTMLElement>} $context - jQuery context to search for links
 */
function process( $context ) {
	if ( !$context ) return;

	// Track the process start time
	id.timers.processStart = mw.now();

	// Get all link nodes in the provided context that matched the selectors
	id.timers.findLinksStart = mw.now();
	const nodes = Link.findLinks( $context );
	id.timers.findLinksEnd = mw.now();

	// Get all unprocessed links and instantiate Link objects
	// Using for-of loop instead of .filter().map() to reduce iterations
	const links = [];
	const processedLinks = [];
	for ( const node of nodes ) {
		if ( Link.hasLink( node ) ) continue;

		const link = new Link( node );
		links.push( link );

		if ( link.isValid ) {
			processedLinks.push( link );
		}
	}

	// Track the process end time
	id.timers.processEnd = mw.now();

	// Log timers for the process
	if ( settings.get( 'logTimers' ) && links.length > 0 ) {
		utils.log( 'info', `links found: ${ links.length }` );
		utils.log( 'info', `links processed: ${ processedLinks.length }` );
		utils.logTimer( 'links selector time', id.timers.findLinksStart, id.timers.findLinksEnd );
		utils.logTimer( 'links process time', id.timers.processStart, id.timers.processEnd );
	}

	// Fire the process end hook
	mw.hook( `${ id.config.prefix }.processed` ).fire( processedLinks );
}

/**
 * Handle replacement of a standalone instance with a non-standalone instance.
 * @return {boolean} True if replacement occurred
 */
function handleReplace() {
	// Merge settings and defaults
	const { settingOptions, defaultOptions } = mergeSettings( true );

	// Use id.modules.settings (legacy alias for id.settings) to access the running instance
	if ( id.modules.settings.get( 'standalone' ) && !defaultOptions.standalone ) {
		// Call an internal hook to modify settings of the original instance.
		// We want to use the original instance because each new one will construct
		// a new set of the modules with a new context.
		mw.hook( `${ id.config.prefix }.replace` ).fire( settingOptions, defaultOptions );
		return true;
	}

	return false;
}

/**
 * Process configuration replacement for a running instance.
 * Updates settings and re-processes content with new configuration.
 * @param {Object} settingOptions - New setting options
 * @param {Object} defaultOptions - New default options
 * @return {Promise<void>}
 */
async function processReplace( settingOptions, defaultOptions ) {
	if ( !settingOptions || !defaultOptions ) return;

	id.local.settings = settingOptions;
	id.local.defaults = defaultOptions;

	if ( id.isReady ) {
		await settings.processDefaults();

		// Reset time loggers
		id.timers.run = mw.now();
		id.timers.ready = mw.now();

		// Start processing content
		applyPageAdjustments();
		processContent( utils.getBodyContentNode() );
	}
}

/**
 * IntersectionObserver callback to handle link visibility changes.
 * Triggers link intersection handlers when links enter the viewport.
 * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
 */
function observeInteractions( entries ) {
	if ( id.isUnloading ) return;

	entries.forEach( entry => {
		if ( !entry.isIntersecting ) return;

		const link = Link.getLink( entry.target );
		if ( link ) {
			link.intersect();
		}
	} );
}

/**
 * MutationObserver callback to handle DOM changes.
 * Processes newly added content for diff links.
 * @param {MutationRecord[]} entries - Array of mutation records
 */
function observeMutations( entries ) {
	if ( id.isUnloading ) return;

	entries.forEach( entry => {
		if ( entry.addedNodes.length > 0 ) {
			mw.hook( `${ id.config.prefix }.process` ).fire( $( entry.target ) );
		}
	} );
}

/**
 * Handle page refresh/restore from the browser cache (pageshow event).
 * Resets an unloading flag when the page is restored from bfcache.
 * @param {PageTransitionEvent} event - Page transition event
 */
function refresh( event ) {
	// Session was restored from the browser cache
	if ( event.persisted ) {
		id.isUnloading = false;
	}
}

/**
 * Handle page unload (beforeunload event).
 * Sets a flag to prevent processing during when the page is unloaded.
 */
function unload() {
	id.isUnloading = true;
}

app();