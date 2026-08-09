import id from './id';
import * as utils from './utils';
import * as utilsPage from './utils-page';
import { executeModuleScript } from './utils-oojs';

import Site from './Site';
import Page from './Page';
import settings from './settings';

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
	 * @type {Object}
	 */
	articleParams = {};

	/**
	 * Get a promise array for the main load request.
	 * @return {(Promise|JQuery.jqXHR|JQuery.Promise|mw.Api.AbortablePromise)[]}
	 */
	getLoadPromises() {
		const promises = super.getLoadPromises();

		// Try to load page dependencies in parallel to the main request:
		// * for the revision view we need to know actual revision id;
		// * for the page view we need to know page id.
		const values = this.article.getValues();
		if (
			values.type === 'revision' && (
				( values.typeVariant === 'revision' && utils.isValidID( values.revid ) ) ||
				( values.typeVariant === 'page' && utils.isValidID( values.curid ) )
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
			prop: [ 'revid', 'modules', 'jsconfigvars', 'categorieshtml' ],
			disablelimitreport: 1,
			redirects: 1,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
			useskin: mw.config.get( 'skin' ),
		};

		const oldid = this.configManager.get( 'wgDiffNewId' ) || this.article.get( 'revid' );
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

	/**
	 * Event that emits after the page request failed.
	 * @private
	 */
	onRequestPageError = ( message, data, params ) => {
		const errorParams = {
			message,
			type: 'dependencies',
			tag: 'page',
			article: this.article,
			silent: true,
		};
		if ( data?.error ) {
			errorParams.code = data.error.code;
			errorParams.message = data.error.info;
		}
		const type = params.oldid ? 'revid' : 'curid';
		utils.notifyError( `error-dependencies-${ type }`, errorParams );
	};

	/**
	 * Event that emits after the page request successive.
	 * @private
	 */
	onRequestPageDone = ( data, params ) => {
		// Render error if the parse request is completely failed
		this.pageParse = data?.parse;
		if ( !this.pageParse ) {
			return this.onRequestPageError( null, data, params );
		}

		// Get values for mw.config
		this.configManager.setValues( {
			wgArticleId: this.pageParse.pageid,
			wgRevisionId: Math.max( this.article.get( 'revid' ), this.pageParse.revid ),
			...this.pageParse.jsconfigvars,
		} );

		// Set article values
		this.article.setValues( {
			curid: this.configManager.get( 'wgArticleId' ),
			revid: this.configManager.get( 'wgRevisionId' ),
		} );

		// Set additional config variables
		this.setConfigs();

		// Append categories
		this.processCategories();

		// Get page dependencies
		this.requestDependencies( this.pageParse );
	};

	/******* REQUESTS *******/

	/**
	 * Request process to get diff HTML content.
	 * @returns {JQuery.jqXHR}
	 */
	requestProcess() {
		// Check if there are no errors,
		// otherwise terminate.
		if ( this.error ) return $.Deferred().resolve().promise();

		const values = this.article.getValues();
		this.requestParams = {
			title: !utils.isEmpty( values.title ) ? values.title : undefined,
			curid: !utils.isEmpty( values.curid ) ? values.curid : undefined,
			oldid: !utils.isEmpty( values.oldid ) ? values.oldid : undefined,
			diff: !utils.isEmpty( values.diff )
				? values.diff : utils.inArray( [ 'prev', 'next' ], values.direction )
					? values.direction : 'prev',
		};

		this.articleParams = {
			action: 'render',
			diffonly: values.type === 'diff' ? 1 : 0,
			unhide: settings.get( 'unHideDiffs' ) ? 1 : 0,
			uselang: id.local.userLanguage,
		};
		if (
			settings.get( 'enableDetailedPages' ) &&
			Site.hasSkinCached( 'apioutput' ) &&
			values.type === 'revision' &&
			id.config.detailedPageNamespaces.includes( this.article.getTitle().getNamespaceId() )
		) {
			this.article.isDetailed = true;
			this.articleParams.action = 'view';
			this.articleParams.useskin = 'apioutput';
		}

		const params = {
			url: id.local.mwEndPoint,
			dataType: 'html',
			data: $.extend( this.requestParams, this.articleParams ),
		};
		return this.requestManager.ajax( params );
	}

	/******* RENDER *******/

	async renderContentSuccess() {
		// Parse and append all data coming from the endpoint
		this.nodes.data = $.parseHTML( this.data );
		this.nodes.$data = this.getNodesData().appendTo( this.nodes.$body );

		// Collect missing data from the diff table before manipulations
		this.collectData();

		// Set additional config variables
		this.setConfigs();

		// Prepend content warnings
		this.processWarnings();

		// Process diff table
		this.processDiffTable();
		this.processFlaggedRevs();

		// Process revision
		if ( this.article.get( 'type' ) === 'revision' ) {
			this.processRevision();
		}

		// Process diff mobile footer
		this.processMobileFooter();

		// Call a parent method that wraps a process
		await super.renderContentSuccess();
	}

	getNodesData() {
		const $nodes = $( this.nodes.data );
		const $contentText = $nodes.find( '#mw-content-text' );
		if ( this.article.isDetailed && $contentText.length > 0 ) {
			return $contentText.children();
		}
		return $nodes;
	}

	collectData() {
		const articleValues = {};
		const configValues = {};

		// Get title, diff and oldid values
		const $fromLinks = this.nodes.$body.find( '#mw-diff-otitle1 strong > a, #differences-prevlink' );
		if ( $fromLinks.length > 0 ) {
			const href = $fromLinks.prop( 'href' );
			articleValues.deletedHref = href;

			const oldid = Number( utils.getParamFromUrl( 'oldid', href ) );
			if ( utils.isValidID( oldid ) ) {
				articleValues.deletedRevid = oldid;
				configValues.wgDiffOldId = oldid;
			}

			const title = utils.getTitleFromUrl( href ) || $fromLinks.prop( 'title' );
			if ( !utils.isEmpty( title ) ) {
				articleValues.deletedTitle = title;
				articleValues.page1 = title;
				articleValues.title = title;
			}
		}

		const $toLinks = this.nodes.$body.find( '#mw-diff-ntitle1 strong > a, #differences-nextlink' );
		if ( $toLinks.length > 0 ) {
			const href = $toLinks.prop( 'href' );
			articleValues.addedHref = href;

			const oldid = Number( utils.getParamFromUrl( 'oldid', href ) );
			if ( utils.isValidID( oldid ) ) {
				articleValues.addedRevid = oldid;
				articleValues.revid = oldid;
				configValues.wgDiffNewId = oldid;
				configValues.wgRevisionId = oldid;

				// Replace diff when its values = cur
				if ( this.article.get( 'diff' ) === 'cur' ) {
					articleValues.diff = oldid;
				}
			}

			const title = utils.getTitleFromUrl( href ) || $toLinks.prop( 'title' );
			if ( !utils.isEmpty( title ) ) {
				articleValues.addedTitle = title;
				articleValues.page2 = title;
				articleValues.title = title;
			}
		}

		// Validate titles
		if ( articleValues.page1 === articleValues.page2 ) {
			delete articleValues.page1;
			delete articleValues.page2;
		}

		// Populate username
		const $userLink = this.nodes.$body.find( '#mw-diff-ntitle2 .mw-userlink' );
		if ( $userLink.length > 0 ) {
			articleValues.userhidden = $userLink.hasClass( 'history-deleted' );
			if ( !articleValues.userhidden ) {
				articleValues.user = $userLink.text();
			}
		}

		// Populate timestamps
		const $toTimestamp = this.nodes.$body.find( '#mw-diff-ntitle1 .mw-diff-timestamp' );
		if ( $toTimestamp.length > 0 ) {
			articleValues.timestamp = $toTimestamp.attr( 'data-timestamp' );
		}

		// Populate section name
		const $toSectionLinks = this.nodes.$body.find( '#mw-diff-ntitle3 .autocomment a' );
		if ( utils.isEmpty( this.article.get( 'section' ) ) && $toSectionLinks.length > 0 ) {
			articleValues.section = utils.getComponentFromUrl( 'hash', $toSectionLinks.prop( 'href' ) );
		}

		// Get undo links to check if the user can edit the page
		const $editLinks = this.nodes.$body.find( '.mw-diff-undo a, .mw-rollback-link a' );
		if ( $editLinks.length > 0 ) {
			articleValues.editable = true;
			configValues.wgIsProbablyEditable = true;
			configValues.wgRelevantPageIsProbablyEditable = true;
		}

		// Set article and config values
		this.article.set( articleValues );
		this.configManager.setValues( configValues );
		this.configManager.setTitle( this.article.getTitle() );

		// Save additional user options dependent of a page type.
		// FixMe: See T346252 for the details about Visual Diffs.
		if (
			this.article.get( 'type' ) !== 'diff' &&
			!utilsPage.isVisualDiffsAvailable( this.configManager.get( 'wgPageContentModel' ) )
		) {
			this.userOptionsManager.set( 'visualeditor-diffmode-historical', 'source' );
		}
	}

	processWarnings() {
		this.nodes.$body
			.find( '.cdx-message' )
			.prependTo( this.nodes.$body );

		// Render a warning when revision was not found
		if ( this.pageInfo?.error ) {
			const $emptyMessage = this.nodes.$body.find( '> p' );
			if ( $emptyMessage.length > 0 ) {
				this.renderWarning( {
					$content: $emptyMessage,
				} );
			}
		}
	}

	processDiffTable() {
		// Find diff table tools container and pre-toggle visibility
		this.nodes.$diffTablePrefix = this.nodes.$body.find( '.mw-diff-table-prefix' );
		if ( this.article.get( 'type' ) !== 'diff' || !settings.get( 'showDiffTools' ) ) {
			this.nodes.$diffTablePrefix.addClass( 'instantDiffs-hidden' );
		}

		// Find table elements
		this.nodes.$table = this.nodes.$body.find( 'table.diff' );

		// Find and hide the next / previous diff links, so the other scripts can use them later
		this.nodes.$prev = this.nodes.$table
			.find( '#differences-prevlink' )
			.attr( 'data-instantdiffs-link', 'none' )
			.addClass( 'instantDiffs-hidden' );

		this.nodes.$next = this.nodes.$table
			.find( '#differences-nextlink' )
			.attr( 'data-instantdiffs-link', 'none' )
			.addClass( 'instantDiffs-hidden' );

		// Clear whitespaces after detaching navigation links
		const leftTitle4 = this.nodes.$table.find( '#mw-diff-otitle4' );
		utils.clearWhitespaces( leftTitle4 );

		const rightTitle4 = this.nodes.$table.find( '#mw-diff-ntitle4' );
		utils.clearWhitespaces( rightTitle4 );

		// Hide unsupported or unnecessary element
		this.nodes.$body
			.find( '.mw-revslider-container, .mw-diff-revision-history-links,  #mw-oldid' )
			.addClass( 'instantDiffs-hidden' );

		// Collect links that will be available in the navigation
		this.links.prev = utils.isValidID( this.configManager.get( 'wgDiffOldId' ) );
		this.links.next = this.nodes.$next.attr( 'href' );
	}

	processRevision() {
		this.nodes.$diffTitle = this.nodes.$body.find( '.diff-currentversion-title' );

		// Show or hide mobile diff footer
		if ( !settings.get( 'showRevisionInfo' ) ) {
			this.nodes.$diffMobileFooter.addClass( 'instantDiffs-hidden' );
		}

		// Show or hide diff info table in the revision view
		utilsPage.processRevisionDiffTable( this.nodes.$table );

		// Append categories
		this.processCategories();

		// Hide unsupported or unnecessary element
		this.nodes.$body
			.find( '.mw-diff-slot-header, .mw-slot-header' )
			.addClass( 'instantDiffs-hidden' );
	}

	processFlaggedRevs() {
		// Find FlaggedRevs table info and insert before the diff table to fix the element flow
		this.nodes.$frDiffHeader = this.nodes.$body
			.find( '#mw-fr-diff-headeritems' )
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
			if ( settings.get( 'showRevisionInfo' ) ) {
				// Hide the left side of the table and left only related to the revision info
				this.nodes.$frDiffHeader.find( '.fr-diff-ratings td:nth-child(2n-1)' ).addClass( 'instantDiffs-hidden' );
			} else {
				this.nodes.$frDiffHeader.addClass( 'instantDiffs-hidden' );
			}
		}

		// Hide unsupported or unnecessary element
		this.nodes.$body
			.find( '.fr-diff-to-stable, #mw-fr-diff-dataform, #mw-fr-reviewform' )
			.addClass( 'instantDiffs-hidden' );
	}

	hasFlaggedRevs() {
		return this.nodes.$frDiffHeader?.length > 0;
	}

	processMobileFooter() {
		this.nodes.$diffMobileFooter = this.nodes.$body.find( '.mw-diff-mobile-footer' );
		if ( this.nodes.$diffMobileFooter.length === 0 ) return;

		// Append diff mobile footer to the bottom
		this.nodes.$diffMobileFooter.appendTo( this.nodes.$body );

		// @see {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/50449784d02a0a46297fdd040bdc02a3ca76688e/resources/src/mediawiki.diff/undoButtonToggle.js#8}
		const buttonClasses = 'cdx-button cdx-button--fake-button cdx-button--fake-button--enabled cdx-button--action-default';

		// Process button classes and visibility
		const buttonSelectors = [
			'.mw-diff-undo',
			'.mw-rollback-link',
		];

		const $buttons = this.nodes.$diffMobileFooter.find( buttonSelectors.join( ',' ) );
		if ( $buttons.length === 0 ) return;

		if ( id.local.mwIsAnon ) {
			$buttons.hide();
		} else {
			$buttons.children( 'a' ).addClass( buttonClasses );
		}
	}

	/**
	 * Restores functionally of extensions and scripts.
	 */
	processDiffTools() {
		if ( this.error ) return;

		// Restore rollback and patrol scripts
		executeModuleScript( 'mediawiki.misc-authed-curate' );
		utilsPage.restoreRollbackLink( this.nodes.$body );

		// Restore diff format toggle buttons
		if ( this.article.get( 'type' ) === 'diff' ) {
			const hasInlineToggle = utilsPage.restoreInlineFormatToggle( this.getDiffTools() );
			if ( hasInlineToggle ) this.registerDiffTool( { name: 'inlineFormatToggle' } );

			const hasVisualDiffs = utilsPage.restoreVisualDiffs( this.getDiffTools() );
			if ( hasVisualDiffs ) this.registerDiffTool( { name: 'visualDiffs' } );
		}

		this.checkDiffTools();
	}

	/******* ACTIONS *******/

	/**
	 * Fire hooks and events.
	 */
	async fire() {
		// Restore functionally of extensions and scripts
		this.processDiffTools();

		// Fire parent hooks and events
		await super.fire();
	}
}

export default LocalPage;