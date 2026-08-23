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
	 * Creates the Review Form instance.
	 * @param {import('../../Page').Page.Any} page - a Page instance
	 */
	constructor( page ) {
		this.page = page;
		this.article = page.getArticle();

		const isReviewableArticle = !this.article.isForeign &&
			this.article.hasAction( 'review' ) &&
			this.article.get( 'type' ) === 'diff';
		const isReviewableRevision = this.article.get( 'deletedRevid' ) <= this.article.get( 'stableRevid' );

		if (
			!settings.get( 'enableReviewForm' ) ||
			!Site.hasSkinCached( 'apioutput' ) ||
			!isReviewableArticle ||
			!isReviewableRevision
		) {
			return;
		}

		// Lazy-import modules
		this.ReviewButton = require( './ReviewButton' ).default;

		this.render();
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
			onAttach: () => this.request(),
		} );
	}

	/**
	 * Requests the review form HTML.
	 * @returns {JQuery.jqXHR}
	 */
	request() {
		const articleParams = {
			action: 'view',
			useskin: 'apioutput',
			diffonly: 1,
		};
		const params = {
			url: id.local.mwEndPoint,
			dataType: 'html',
			data: $.extend( this.page.requestParams, articleParams ),
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

		// Find and append review form
		const $reviewForm = $nodes.find( '#mw-fr-reviewform' );
		if ( $reviewForm.length === 0 ) {
			return this.onError();
		}
		$reviewForm.addClass( 'instantDiffs-extension-flaggedRevs' );
		utils.addTargetToLinks( $reviewForm );

		// Group and wrap buttons inside the form
		const $buttonContainer = $( '<div>' ).addClass( 'fr-rating-buttons' );
		const $buttons = $reviewForm.find( '#mw-fr-submit-accept, #mw-fr-submit-reject, #mw-fr-submit-unaccept' );
		for ( const button of $buttons ) {
			const $button = $( button );
			$buttonContainer
				.insertBefore( $button )
				.append( $button );
		}

		// Embed form to the review button's popup and pop pending state
		this.reviewButton
			.setContent( $reviewForm )
			.setPending( false );

		// Restore review form JS code
		executeModuleScript( 'ext.flaggedRevs.review', 'review.js' );
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