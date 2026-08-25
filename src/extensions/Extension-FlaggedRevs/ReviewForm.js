import id from '../../id';
import * as utils from '../../utils';
import { executeModuleScript } from '../../utils-oojs';

import settings from '../../settings';

/**
 * Class representing the Review Form.
 */
class ReviewForm {
	/**
	 * @type {string}
	 */
	static DIFF_TOOL_NAME = 'flaggedRevsButton';

	/**
	 * @type {Object<string,string>}
	 */
	static BUTTONS_MAP = {
		'$accept': '#mw-fr-submit-accept',
		'$reject': '#mw-fr-submit-reject',
		'$unaccept': '#mw-fr-submit-unaccept',
	};

	/**
	 * @type {typeof import('./ReviewButton').default}
	 */
	ReviewButton;

	/**
	 * @type {import('./ReviewPage').default}
	 */
	reviewPage;

	/**
	 * @type {import('../../Page').Page.Any}
	 */
	page;

	/**
	 * @type {import('../../Article').default}
	 */
	article;

	/**
	 * @type {import('./ReviewButton').default}
	 */
	reviewButton;

	/**
	 * @type {Object}
	 */
	nodes = {};

	/**
	 * Creates the Review Form instance.
	 * @param {import('./ReviewPage').default} reviewPage - a Review Page instance
	 */
	constructor( reviewPage ) {
		this.reviewPage = reviewPage;
		this.page = reviewPage.getPage();
		this.article = reviewPage.getArticle();

		if (
			!settings.get( 'enableReviewForm' ) ||
			!this.isReviewableArticle() ||
			!this.isReviewableRevision()
		) {
			return;
		}

		// Lazy-import modules
		this.ReviewButton = require( './ReviewButton' ).default;

		this.render();
	}

	/**
	 * Checks if the current article is reviewable.
	 * @returns {boolean}
	 */
	isReviewableArticle() {
		const namespaces = mw.config.get( 'wgFlaggedRevsParams' )?.namespaces ?? [];
		return (
			!this.article.isForeign &&
			this.article.hasAction( 'review' ) &&
			(
				this.reviewPage.hasDiffHeader() ||
				namespaces.includes( this.article.getTitle()?.getNamespaceId() )
			)
		);
	}

	/**
	 * Checks if the current revision is reviewable.
	 * @returns {boolean}
	 */
	isReviewableRevision() {
		return (
			this.article.get( 'type' ) === 'revision' ||
			this.article.get( 'deletedRevid' ) <= this.article.get( 'stableRevid' ) ||
			this.article.get( 'deletedReviwed' ) || this.article.get( 'addedReviwed' )
		);
	}

	/**
	 * Renders popup button and registers diff tool.
	 */
	render() {
		this.reviewButton = new this.ReviewButton();

		// Register diff tool
		this.page.registerDiffTool( {
			name: ReviewForm.DIFF_TOOL_NAME,
			node: this.reviewButton.$element,
			onAttach: () => this.process(),
		} );
	}

	/**
	 * Processes the review form if available, or requests review form HTML.
	 */
	process() {
		this.nodes.$reviewForm = this.page.getBody().find( '#mw-fr-reviewform' );
		if ( this.nodes.$reviewForm.length > 0 ) {
			return this.processForm();
		}

		this.request();
	}

	/**
	 * Processes the review form HTML.
	 */
	processForm() {
		// Attach form to the review button's popup
		this.reviewButton.setContent( this.nodes.$reviewForm );

		this.nodes.$reviewForm.addClass( 'instantDiffs-extension-flaggedRevs' );
		utils.addTargetToLinks( this.nodes.$reviewForm );

		// Group and wrap buttons inside the form
		this.nodes.$buttonContainer = $( '<div>' ).addClass( 'fr-rating-buttons' );
		for ( const [ name, selector ] of Object.entries( ReviewForm.BUTTONS_MAP ) ) {
			this.nodes[ name ] = this.nodes.$reviewForm.find( selector );
			this.nodes.$buttonContainer
				.insertBefore( this.nodes[ name ] )
				.append( this.nodes[ name ] );
		}

		// Wait until the page is ready to execute the module scripts
		this.page.when( 'ready', () => this.ready() );
	}

	/**
	 * Unblock the review button pending state and executes the module scripts.
	 * Fires when the page is ready.
	 */
	ready() {
		// Add click event that allows accepting revision by pressing Shift+Click
		this.reviewButton.setHandler( this.onReviewButtonClick );

		// Update review states
		this.update();

		// Execute the flaggedRevs module scripts
		executeModuleScript( 'ext.flaggedRevs.review', 'review.js' );
	}

	/**
	 * Updates the review button state.
	 */
	update() {
		this.reviewButton
			.setActive( this.article.get( 'addedFlaggedRevsReviewed' ) )
			.setPending( false );
	}

	/**
	 * Event that emits after the request successive.
	 * @param {import('./ReviewButton').default} button - a ReviewButton instance
	 * @param {MouseEvent|KeyboardEvent} event - an event object
	 * @private
	 */
	onReviewButtonClick = ( button, event ) => {
		if ( !event || !event.shiftKey || this.nodes.$accept.prop( 'disabled' ) ) return;
		this.nodes.$accept.trigger( 'click' );
	};

	/**
	 * Requests the review form HTML.
	 * @returns {JQuery.jqXHR}
	 */
	request() {
		const requestParams = { ...this.page.requestParams };
		if ( this.article.get( 'type' ) === 'revision' ) {
			delete requestParams[ 'diff' ];
		}
		const articleParams = {
			action: 'view',
			useskin: mw.config.get( 'skin' ),
			diffonly: 1,
		};
		const params = {
			url: id.local.mwEndPoint,
			dataType: 'html',
			data: $.extend( requestParams, articleParams ),
		};
		this.page.requestManager.ajax( params )
			.done( this.onSuccess )
			.fail( this.onError );
	}

	/**
	 * Event that emits after the request successive.
	 * @param {string} data - HTML string data
	 * @private
	 */
	onSuccess = ( data ) => {
		// Parse HTML response
		let $nodes;
		try {
			$nodes = $( $.parseHTML( data ) );
		} catch {
			return this.onError();
		}

		// Find and process review form
		this.nodes.$reviewForm = $nodes.find( '#mw-fr-reviewform' );
		if ( this.nodes.$reviewForm.length === 0 ) {
			return this.onError();
		}
		this.processForm();
	};

	/**
	 * Event that emits after the request failed.
	 * @private
	 */
	onError = () => {
		this.page.detachDiffTool( ReviewForm.DIFF_TOOL_NAME );
	};
}

export default ReviewForm;