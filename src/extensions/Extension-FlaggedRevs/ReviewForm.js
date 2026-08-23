import id from '../../id';
import * as utils from '../../utils';
import { executeModuleScript } from '../../utils-oojs';

import Site from '../../Site';
import settings from '../../settings';

/**
 * Class representing the Review Form.
 */
class ReviewForm {
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
	 * @type(JQuery<HTMLElement>)
	 */
	$reviewForm;

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
			this.article.get( 'deletedRevid' ) <= this.article.get( 'stableRevid' )
		);
	}

	/**
	 * Renders popup button and registers diff tool.
	 */
	render() {
		this.reviewButton = new this.ReviewButton();

		// Register diff tool
		this.page.registerDiffTool( {
			name: 'flaggedRevsButton',
			node: this.reviewButton.$element,
			onAttach: () => this.process(),
		} );
	}

	/**
	 * Processes the review form if available, or requests review form HTML.
	 */
	process() {
		this.$reviewForm = this.page.getBody().find( '#mw-fr-reviewform' );
		if ( this.$reviewForm.length > 0 ) {
			return this.processForm();
		}

		this.request();
	}

	/**
	 * Processes the review form HTML.
	 */
	processForm() {
		this.$reviewForm
			.addClass( 'instantDiffs-extension-flaggedRevs' )
			.removeClass( 'instantDiffs-hidden' );

		utils.addTargetToLinks( this.$reviewForm );

		// Group and wrap buttons inside the form
		const $buttonContainer = $( '<div>' ).addClass( 'fr-rating-buttons' );
		const $buttons = this.$reviewForm.find( '#mw-fr-submit-accept, #mw-fr-submit-reject, #mw-fr-submit-unaccept' );
		for ( const button of $buttons ) {
			const $button = $( button );
			$buttonContainer
				.insertBefore( $button )
				.append( $button );
		}

		this.page.when( 'ready', () => this.ready() );
	}

	/**
	 * Attaches the review form to the review button's popup and fires the extension scripts.
	 * Fires when the page is ready.
	 */
	ready() {
		// Attach form to the review button's popup and pop pending state
		this.reviewButton
			.setContent( this.$reviewForm )
			.setPending( false );

		// Restore review form JS code
		executeModuleScript( 'ext.flaggedRevs.review', 'review.js' );
	}

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
		this.$reviewForm = $nodes.find( '#mw-fr-reviewform' );
		if ( this.$reviewForm.length === 0 ) {
			return this.onError();
		}
		this.processForm();
	};

	/**
	 * Event that emits after the request failed.
	 * @private
	 */
	onError = () => {
		this.page.detachDiffTool( 'flaggedRevsButton' );
	};
}

export default ReviewForm;