import id from './id';
import * as utils from './utils';
import * as utilsLink from './utils-link';

import Api from './Api';
import Article from './Article';
import Button from './Button';
import view from './view';
import settings from './settings';

import './styles/links.less';

const { h, ht } = utils;

/**
 * Class representing a link.
 */
class Link {
	/**
	 * @type {typeof utilsLink}
	 */
	static utils = utilsLink;

	/**
	 * @type {Map}
	 */
	static stack = new Map();

	/**
	 * Find links in the provided context.
	 * @param {JQuery} [$container]
	 * @returns {JQuery<Element>}
	 */
	static findLinks( $container ) {
		if ( typeof $container === 'undefined' ) {
			$container = utils.getBodyContentNode();
		}
		return $container.find( id.local.linkSelector );
	}

	/**
	 * Add a link to the stack.
	 * @param {HTMLAnchorElement} node
	 * @param {import('./Link').default} link
	 */
	static addLink( node, link ) {
		this.stack.set( node, link.isValid ? link : false );
	}

	/**
	 * Get a link from the stack.
	 * @param {HTMLAnchorElement} node
	 * @returns {import('./Link').default}
	 */
	static getLink( node ) {
		return this.stack.get( node );
	}

	/**
	 * Check is a link in the stack.
	 * @param {HTMLAnchorElement} node
	 * @returns {boolean}
	 */
	static hasLink( node ) {
		return this.stack.has( node );
	}

	/**
	 * Get all links from the stack.
	 * @return {MapIterator<import('./Link').default>}
	 */
	static getLinks() {
		return this.stack.values();
	}

	/**
	 * @type {HTMLAnchorElement}
	 */
	node;

	/**
	 * @type {Object}
	 */
	options = {};

	/**
	 * @type {import('./Article').default}
	 */
	article;

	/**
	 * @type {Object}
	 */
	nodes = {};

	/**
	 * @type {Object}
	 */
	mw = {
		hasLink: false,
		hasLine: false,
	};

	/**
	 * @type {Object}
	 */
	manual = {
		behavior: 'basic',
		options: {},
	};

	/**
	 * @type {Object}
	 */
	actions = {};

	/**
	 * @type {Object}
	 */
	extensions = {};

	/**
	 * @type {boolean}
	 */
	isValid = false;

	/**
	 * @type {boolean}
	 */
	isForeign = false;

	/**
	 * @type {boolean}
	 */
	isLoading = false;

	/**
	 * @type {boolean}
	 */
	isLoaded = false;

	/**
	 * @type {boolean}
	 */
	isProcessed = false;

	/**
	 * @type {boolean}
	 */
	hasRequest = false;

	/**
	 * Create a link instance.
	 * @param {HTMLAnchorElement} node a link node
	 * @param {Object} [options] configuration options
	 * @param {string} [options.behavior]
	 * @param {string} [options.insertAfter]
	 * @param {boolean} [options.showLink]
	 * @param {boolean} [options.showPageLink]
	 * @param {boolean} [options.showAltTitle] show an original title instead of processed
	 * @param {import('./Link').default} [options.initiatorLink] a Link instance
	 * @param {import('./Page').default} [options.initiatorPage] a Page instance
	 * @param {View} [options.initiatorView] a View instance
	 * @param {Function} [options.onRequest] a callback
	 * @param {Function} [options.onLoad] a callback
	 * @param {Function} [options.onOpen] a callback
	 * @param {Function} [options.onClose] a callback
	 */
	constructor( node, options ) {
		this.node = node;
		this.options = {
			behavior: 'basic',                                          // request | basic | event | none
			insertMethod: 'insertAfter',
			showLink: settings.get( 'showLink' ),
			showPageLink: settings.get( 'showPageLink' ),
			showAltTitle: false,
			initiatorLink: null,
			initiatorPage: null,
			initiatorView: null,
			onRequest: () => {},
			onLoad: () => {},
			onOpen: () => {},
			onClose: () => {},
			...options,
		};

		// Check if a link was opened from the View dialog
		if ( view.isContains( this.node ) ) {
			this.options.initiatorView = view;
			this.options.initiatorPage = view.getPage();
		}

		// Start link processing
		this.process();

		// Add a link instance to the stack
		Link.addLink( this.node, this );

		// Start render process if link is a valid diff or a revision link
		if ( this.isValid ) {
			this.render();
		}
	}

	process() {
		this.href = this.node.href;
		if ( utils.isEmpty( this.href ) ) return;

		// Validate url
		const urlParts = {};
		try {
			this.url = new URL( this.href );
			urlParts.title = this.url.searchParams.get( 'title' );
			urlParts.pathname = decodeURIComponent( this.url.pathname );
			urlParts.pathnameNormalized = urlParts.pathname.replace( new RegExp( id.local.mwArticlePath ), '' );
		} catch {
			return;
		}

		// Exclude links with specific action parameters
		if ( id.config.exclude.linkActions.includes( this.url.searchParams.get( 'action' ) ) ) return;

		// Get article values
		let articleValues = {
			hostname: this.url.hostname,
		};

		if ( id.local.specialPagesLinksSearchRegExp.test( urlParts.title ) ) {
			// Get components from splitting url title
			articleValues = { ...articleValues, ...utilsLink.getSplitSpecialUrl( urlParts.title ) };
		} else if ( id.local.specialPagesLinksPathRegExp.test( urlParts.pathname ) ) {
			// Get components from splitting url pathname
			articleValues = { ...articleValues, ...utilsLink.getSplitSpecialUrl( urlParts.pathnameNormalized ) };
		} else {
			// Get components from url search parameters
			[ 'title', 'curid', 'oldid', 'diff', 'direction', 'page1', 'rev1', 'page2', 'rev2' ].forEach( name => {
				articleValues[ name ] = this.url.searchParams.get( name );
			} );

			// As a last resort, get the page title from url pathname
			if ( utils.isEmpty( articleValues.title ) && id.local.articlePathRegExp.test( urlParts.pathname ) ) {
				articleValues.title = urlParts.pathnameNormalized;
			}
		}

		// Construct the Article instance
		this.article = new Article( articleValues );
		this.isValid = this.article.isValid;
		this.isForeign = this.article.isForeign;
	}

	render() {
		// Check if a link generated by MediaWiki or contributed by a user,
		// and process related options.
		this.processMWOptions();

		// Process options from the data attributes.
		this.processManualOptions();

		// Post-validate options
		this.postValidateOptions();

		// Populate the page title from the watchlist line entry for the edge cases.
		// Link minifiers like [[:ru:User:Stjn/minilink.js]] often remove titles from the links.
		if ( utils.isEmpty( this.article.get( 'title' ) ) && this.mw.hasLine ) {
			this.article.set( { title: this.mw.title } );
		}

		// Render by behavior
		switch ( this.options.behavior ) {
			// Add an event on the existing link.
			case 'event':
				this.renderEvent();
				break;

			// Render actions for the MediaWiki's link.
			case 'basic':
				this.renderBasic();
				break;

			// Render actions lazily for the user-contributed links.
			case 'request':
				this.renderRequest();
				break;
		}
	}

	processMWOptions() {
		// Check if a link contributed by a user.
		this.mw.isContent = utilsLink.isMWLink( this.node, id.config.mwLinkContent );
		if ( this.mw.isContent ) {
			this.options.behavior = 'request';
		}

		// Check if a link is generated by a MediaWiki itself.
		// Make this check after the check for a user-contributed link,
		// because there can be transcluded contributions lists into the content.
		this.mw.hasLink = utilsLink.isMWLink( this.node, id.config.mwLink );
		if ( this.mw.hasLink ) {
			this.options.behavior = 'basic';

			this.mw.isDiffOnly = utilsLink.isMWLink( this.node, id.config.mwLinkDiffOnly );

			this.mw.isPrepend = utilsLink.isMWLink( this.node, id.config.mwLinkPrepend );
			if ( this.mw.isPrepend ) {
				this.options.insertMethod = 'insertBefore';
			}

			this.mw.isAltTitle = utilsLink.isMWLink( this.node, id.config.mwLinkAltTitle );
			if ( this.mw.isAltTitle ) {
				this.options.showAltTitle = true;
			}

			this.mw.line = utilsLink.getMWLine( this.node );
			if ( this.mw.line ) {
				this.mw.hasLine = true;
				this.mw.title = utilsLink.getMWLineTitle( this.mw.line );
				this.mw.line.classList.add( 'instantDiffs-line' );
			}

			// Check if a link contributed by a user is in a commit message, etc.
			this.mw.isContentInside = utilsLink.isMWLink( this.node, id.config.mwLinkContentInside );
			if ( this.mw.isContentInside ) {
				this.options.behavior = 'request';
			}
		}
	}

	processManualOptions() {
		// Get options that were manually added to the "data-instantdiffs-options" attribute
		this.manual.options = this.node.dataset.instantdiffsOptions;
		if ( !utils.isEmpty( this.manual.options ) ) {
			try {
				this.manual.options = JSON.parse( this.manual.options );
				this.options = { ...this.options, ...this.manual.options };
			} catch ( error ) {
				const errorParams = {
					type: 'link',
					message: error?.message || error,
				};
				utils.notifyError( 'error-link-options', errorParams, null, true );
			}
		}

		// Check if a link was marked manually by the "data-instantdiffs-link" attribute
		this.manual.behavior = this.node.dataset.instantdiffsLink;
		if ( !utils.isEmpty( this.manual.behavior ) ) {
			this.options.behavior = this.manual.behavior;
		}
	}

	postValidateOptions() {
		// Convert deprecated behaviors
		const behaviorTable = {
			link: 'event',
			default: 'request',
		};
		if ( behaviorTable[ this.options.behavior ] ) {
			this.options.behavior = behaviorTable[ this.options.behavior ];
		}
		if ( ![ 'request', 'basic', 'event', 'none' ].includes( this.options.behavior ) ) {
			this.options.behavior = 'basic';
		}

		// Check conditions for rendering a page link action
		this.options.showPageLink &&= this.options.behavior === 'request';
	}

	/******* OBSERVER *******/

	observe() {
		if ( this.isObserved ) return;
		this.isObserved = true;
		id.local.interactionObserver.observe( this.node );
	}

	unobserve() {
		if ( !this.isObserved ) return;
		this.isObserved = false;
		id.local.interactionObserver.unobserve( this.node );
	}

	onIntersect() {
		if ( this.isLoading || this.isLoaded || !this.isObserved ) return;
		this.unobserve();
		this.request();
	}

	/******* REQUESTS *******/

	renderRequest() {
		this.hasRequest = this.isValid;

		if ( this.hasRequest ) {
			this.toggleSpinner( true );
			this.observe();
		} else {
			this.toggleSpinner( false );
			this.isLoaded = true;
			this.isProcessed = false;
			this.unobserve();
		}
	}

	request() {
		const type = this.article.get( 'type' );
		const typeVariant = this.article.get( 'typeVariant' );

		if ( type === 'revision' ) {
			return this.requestRevision();
		}
		if ( type === 'diff' ) {
			if ( typeVariant === 'comparePages' ) {
				return this.requestCompare();
			}
			return this.requestDiff();
		}
	}

	/******* REQUEST REVISION *******/

	requestRevision() {
		if ( this.isLoading ) return;

		this.isLoading = true;
		this.error = null;

		const params = {
			action: 'query',
			prop: 'revisions',
			rvprop: [ 'ids', 'timestamp', 'comment', 'content' ],
			rvslots: 'main',
			rvsection: 0,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
		};

		if ( !utils.isEmpty( this.article.get( 'oldid' ) ) ) {
			params.revids = this.article.get( 'oldid' );
		} else if ( !utils.isEmpty( this.article.get( 'curid' ) ) ) {
			params.pageids = this.article.get( 'curid' );
		}

		return Api.get( params, this.article.get( 'hostname' ) )
			.then( this.onRequestRevisionDone )
			.fail( this.onRequestRevisionError );
	}

	onRequestRevisionError = ( error, data ) => {
		this.isLoading = false;

		this.error = {
			type: 'revision',
			code: !utils.isEmpty( this.article.get( 'curid' ) ) ? 'curid' : 'generic',
		};

		if ( data?.error ) {
			this.error.code = data.error.code;
			this.error.message = data.error.info;
		} else {
			this.error.message = error;
			utils.notifyError( `error-revision-${ this.error.code }`, this.error, this.article, true );
		}

		this.renderError();
	};

	onRequestRevisionDone = ( data ) => {
		this.isLoading = false;

		// Render error if the query request is completely failed
		const query = data?.query;
		if ( !query || ( !query.badrevids && !query.badpageids && !query.pages ) ) {
			return this.onRequestRevisionError( null, data );
		}

		// Get a page for the query request
		const page = query.pages?.[ 0 ];
		const revision = page?.revisions?.[ 0 ];

		// Check for a specific error code
		const error = { type: 'revision' };
		if ( query.badrevids ) {
			error.code = 'badrevids';
		} else if ( query.badpageids ) {
			error.code = 'badpageids';
		} else if ( !page || page.missing || !revision ) {
			error.code = 'missing';
		} else if ( page.invalid ) {
			error.code = 'invalid';
			error.info = page.invalidreason;
		}

		// Render error if exist
		if ( error.code ) {
			this.error = error;
			return this.renderError();
		}

		this.revision = revision;

		// Set article values
		this.article.set( {
			title: page.title,
			section: utils.getRevisionSection( this.revision ),
		} );
		this.article.isHidden = utils.isRevisionHidden( this.revision );

		this.renderSuccess();
	};

	/******* REQUEST DIFF *******/

	requestDiff() {
		if ( this.isLoading ) return;

		this.isLoading = true;
		this.error = null;

		const params = {
			action: 'compare',
			prop: [ 'title', 'ids', 'timestamp', 'comment' ],
			fromrev: utils.isValidID( this.article.get( 'oldid' ) ) ? this.article.get( 'oldid' ) : undefined,
			fromtitle: !utils.isEmpty( this.article.get( 'title' ) ) ? this.article.get( 'title' ) : undefined,
			torev: utils.isValidID( this.article.get( 'diff' ) ) ? this.article.get( 'diff' ) : undefined,
			torelative: utils.isValidDir( this.article.get( 'diff' ) ) ? this.article.get( 'diff' ) : undefined,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
		};
		return Api.get( params, this.article.get( 'hostname' ) )
			.then( this.onRequestDiffDone )
			.fail( this.onRequestDiffError );
	}

	onRequestDiffError = ( error, data ) => {
		this.isLoading = false;

		this.error = {
			type: 'diff',
		};

		if ( data?.error ) {
			this.error.code = data.error.code;
			this.error.message = data.error.info;
		} else {
			this.error.message = error;
			utils.notifyError( 'error-diff-generic', this.error, this.article, true );
		}

		this.renderError();
	};

	onRequestDiffDone = ( data ) => {
		this.isLoading = false;

		// Render error if the compare request is completely failed
		this.compare = data?.compare;
		if ( !this.compare ) {
			return this.onRequestDiffError( null, data );
		}

		// Set article values
		this.article.set( {
			title: utils.getCompareTitle( this.compare ),
			section: utils.getCompareSection( this.compare ),
		} );
		this.article.isHidden = utils.isCompareHidden( this.compare );

		this.renderSuccess();
	};

	/******* REQUEST COMPARE *******/

	requestCompare() {
		if ( this.isLoading ) return;

		this.isLoading = true;
		this.error = null;

		const values = this.article.getValues();
		const params = {
			action: 'compare',
			prop: [ 'title', 'ids', 'timestamp', 'comment' ],
			fromrev: utils.isValidID( values.rev1 ) ? values.rev1 : undefined,
			fromtitle: !utils.isEmpty( values.page1 ) ? values.page1 : undefined,
			torev: utils.isValidID( values.rev2 ) ? values.rev2 : undefined,
			totitle: !utils.isEmpty( values.page2 ) ? values.page2 : undefined,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
		};
		return Api.get( params, this.article.get( 'hostname' ) )
			.then( this.onRequestCompareDone )
			.fail( this.onRequestCompareError );
	}

	onRequestCompareError = ( error, data ) => {
		this.isLoading = false;

		this.error = {
			type: 'diff',
		};

		if ( data?.error ) {
			this.error.code = data.error.code;
			this.error.message = data.error.info;
		} else {
			this.error.message = error;
			utils.notifyError( 'error-diff-generic', this.error, this.article, true );
		}

		this.renderError();
	};

	onRequestCompareDone = ( data ) => {
		this.isLoading = false;

		// Render error if the compare request is completely failed
		this.compare = data?.compare;
		if ( !this.compare ) {
			return this.onRequestCompareError( null, data );
		}

		// Set article values
		this.article.set( {
			oldid: this.compare.fromrevid,
			diff: this.compare.torevid,
			page1: this.compare.fromtitle,
			page2: this.compare.totitle,
			title: utils.getCompareTitle( this.compare ),
			section: utils.getCompareSection( this.compare ),
		} );
		this.article.isHidden = utils.isCompareHidden( this.compare );

		this.renderSuccess();
	};

	/******* RENDER *******/

	renderEvent() {
		if ( !this.isValid ) return;

		this.actions.action = new Button( {
			node: this.node,
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
		} );

		this.renderSuccess();
	}

	renderBasic() {
		if ( !this.isValid || ( this.mw.isDiffOnly && this.article.get( 'type' ) !== 'diff' ) ) return;

		this.renderSuccess();
	}

	renderError() {
		this.isLoaded = true;
		this.isProcessed = false;
		this.toggleSpinner( false );

		// Render actions panel
		if ( this.options.behavior !== 'event' ) {
			this.renderWrapper();

			let messageName;
			if ( this.error.type ) {
				messageName = `error-${ this.error.type }-${ this.error.code || 'generic' }`;
				if ( !utils.isMessageExists( messageName ) ) {
					messageName = `error-${ this.error.type }-generic`;
				}
			}

			this.nodes.error = h( 'span', {
					class: [ 'item', 'error', 'error-info' ],
					title: utils.getErrorMessage( messageName, this.error, this.article ),
				},
				ht( utils.getLabel( 'error' ) ),
			);
			this.nodes.inner.append( this.nodes.error );

			this.embed( this.node, this.options.insertMethod );
		}

		mw.hook( `${ id.config.prefix }.link.renderError` ).fire( this );
	}

	renderSuccess() {
		this.isLoaded = true;
		this.isProcessed = true;
		this.toggleSpinner( false );

		// Render actions panel
		if ( this.options.behavior !== 'event' ) {
			this.renderWrapper();

			this.renderLinkAction();
			if ( this.options.showPageLink ) {
				this.renderPageAction();
			}

			this.embed( this.node, this.options.insertMethod );
		}

		mw.hook( `${ id.config.prefix }.link.renderSuccess` ).fire( this );
	}

	renderWrapper() {
		this.nodes.container = this.nodes.inner = h( 'span', { class: [ 'instantDiffs-panel', 'nowrap', 'noprint' ] } );
	}

	renderAction( params ) {
		params = {
			tag: 'a',
			label: null,
			title: null,
			href: null,
			target: utils.getTarget( this.options.initiatorView ),
			handler: null,
			classes: [],
			modifiers: [],
			container: this.nodes.inner,
			...params,
		};

		params.classes = [ 'item', 'text', 'instantDiffs-action', ...params.classes ];
		params.modifiers.forEach( modifier => params.classes.push( `instantDiffs-action--${ modifier }` ) );

		return new Button( params );
	}

	getLinkTitle( title ) {
		// Get an original title from the link
		if ( this.options.showAltTitle && !utils.isEmpty( this.node.title ) ) {
			return this.node.title;
		}

		// Indicate about hidden revisions
		if ( this.article.isHidden ) {
			title = `${ title }-hidden`;
		}

		return utils.msg( title );
	}

	renderLinkAction() {
		const type = this.article.get( 'typeVariant' ) === 'comparePages' ? 'compare-pages' : this.article.get( 'type' );
		const title = this.getLinkTitle( `${ type }-title` );

		if ( !this.options.showLink ) {
			return this.mutateLinkAction( title );
		}

		const classes = [];
		if ( this.article.isHidden ) {
			classes.push( 'error', 'error-admin' );
		}

		this.actions.action = this.renderAction( {
			label: utils.getLabel( this.article.get( 'type' ) ),
			title: title,
			classes: classes,
			modifiers: [ this.article.get( 'type' ) ],
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
		} );
	}

	mutateLinkAction( title ) {
		const classes = [ 'instantDiffs-link', `instantDiffs-link--${ this.article.get( 'type' ) }`, `is-${ this.options.insertMethod }` ];
		if ( this.article.isHidden ) {
			classes.push( 'instantDiffs-link--error' );
		}

		this.node.classList.remove( 'external' );
		this.node.classList.add( ...classes );
		this.node.dataset.instantdiffsLink = this.options.behavior;

		this.actions.action = new Button( {
			node: this.node,
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
			altTitle: title,
			useAltKey: true,
		} );
	}

	renderPageAction() {
		this.actions.page = this.renderAction( {
			label: utils.getLabel( 'page' ),
			//title: utils.msg( 'page-title' ),
			title: this.article.get( 'titleTextSection' ) || this.article.get( 'titleText' ),
			href: this.article.get( 'href' ),
			modifiers: [ 'page' ],
		} );
	}

	/******* DIALOG *******/

	openDialog() {
		const options = {
			initiatorPage: this.options.initiatorPage,
			onOpen: () => this.onDialogOpen(),
			onClose: () => this.onDialogClose(),
		};
		const isReady = view.setup( this, options );
		if ( !isReady ) return;

		this.onDialogRequest();
		return $.when( view.load() )
			.always( () => this.onDialogLoad() );
	}

	/**
	 * Event that emits before the View dialog loads.
	 */
	onDialogRequest() {
		this.toggleLoader( true );

		if ( utils.isFunction( this.options.onRequest ) ) {
			this.options.onRequest( this );
		}
	}

	/**
	 * Event that emits after the View dialog loads.
	 */
	onDialogLoad() {
		this.toggleLoader( false );

		if ( utils.isFunction( this.options.onLoad ) ) {
			this.options.onLoad( this );
		}
	}

	/**
	 * Event that emits after the View dialog opens.
	 */
	onDialogOpen() {
		if ( this.mw.hasLine && settings.get( 'highlightLine' ) ) {
			this.mw.line.classList.add( 'instantDiffs-line--highlight' );
		}

		if ( utils.isFunction( this.options.onOpen ) ) {
			this.options.onOpen( this );
		}

		if ( this.options.initiatorLink instanceof Link ) {
			this.options.initiatorLink.onDialogOpen();
		}
	}

	/**
	 * Event that emits after the View dialog closes.
	 */
	onDialogClose() {
		if ( this.mw.hasLine ) {
			if ( settings.get( 'highlightLine' ) ) {
				this.mw.line.classList.remove( 'instantDiffs-line--highlight' );
			}
			if (
				settings.get( 'markWatchedLine' ) &&
				id.config.changeLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) )
			) {
				this.mw.line.classList.remove( ...id.config.mwLine.unseen );
				this.mw.line.classList.add( ...id.config.mwLine.seen );
			}
		}

		if ( utils.isFunction( this.options.onClose ) ) {
			this.options.onClose( this );
		}

		if ( this.options.initiatorLink instanceof Link ) {
			this.options.initiatorLink.onDialogClose();
		}
	}

	/******* ACTIONS *******/

	/**
	 * Toggle a pending loader cursor visibility.
	 * @param {boolean} value
	 */
	toggleLoader( value ) {
		if ( this.actions.action ) {
			this.actions.action.pending( value );
		} else {
			this.node.classList.toggle( 'instantDiffs-link--pending', value );
		}
	}

	/**
	 * Toggle a spinner loader visibility.
	 * @param {boolean} value
	 */
	toggleSpinner( value ) {
		const classes = utils.getPlaceholderClasses( [ 'loader', this.article.get( 'type' ) ] );

		if ( value ) {
			this.node.classList.add( ...classes );
		} else {
			this.node.classList.remove( ...classes );
		}
	}

	/**
	 * Append a link's panel bar to the specified node.
	 * @param {Element} container
	 * @param {string} [insertMethod]
	 */
	embed( container, insertMethod ) {
		utils.embed( this.nodes.container, container, insertMethod );
	}

	/**
	 * Get a link's panel bar node.
	 * @returns {Element}
	 */
	getContainer() {
		return this.nodes.container;
	}

	/**
	 * Get a link's node.
	 * @returns {HTMLAnchorElement}
	 */
	getNode() {
		return this.node;
	}

	/**
	 * Get the initiator Link instance.
	 * @returns {import('./Link').default}
	 */
	getInitiatorLink() {
		return this.options.initiatorLink || this;
	}

	/**
	 * Get the Article instance.
	 * @returns {import('./Article').default}
	 */
	getArticle() {
		return this.article;
	}

	/**
	 * Get mw object.
	 * @returns {Object}
	 */
	getMW() {
		return this.mw;
	}
}

export default Link;