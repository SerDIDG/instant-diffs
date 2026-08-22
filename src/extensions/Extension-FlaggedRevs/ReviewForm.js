import id from '../../id';
import * as utils from '../../utils';
import { executeModuleScript } from '../../utils-oojs';

import settings from '../../settings';
import Site from '../../Site';

/**
 * Class representing the review form.
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
	 * @type {Object<string,HTMLElement>}
	 */
	frElements = {};

	/**
	 * Creates a Review Form instance.
	 * @param {import('../../Page').Page.Any} page - a Page instance
	 */
	constructor( page ) {
		this.page = page;
		this.article = page.getArticle();

		const isValidPage = this.page.hasFlaggedRevs?.() ?? false;
		const isReviewableArticle = !this.article.isForeign &&
			this.article.hasAction( 'review' ) &&
			this.article.get( 'type' ) === 'diff';
		const isReviewableRevision = this.article.get( 'deletedRevid' ) <= this.article.get( 'stableRevid' );

		if (
			!settings.get( 'enableReviewForm' ) ||
			!Site.hasSkinCached( 'apioutput' ) ||
			!isValidPage ||
			!isReviewableArticle ||
			!isReviewableRevision
		) {
			return;
		}

		// Lazy-import modules
		this.ReviewButton = require( './ReviewButton' ).default;

		// Change id attributes for the FlaggedRevs elements on the page before render a review form.
		// Restores attributes to the origin states before the page is detached.
		this.prepareElements();
		this.page.on( 'beforeDetach', () => this.restoreElements() );

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

	/**
	 * Changes id attributes for the FlaggedRevs elements on the page.
	 * @private
	 */
	prepareElements() {
		const $container = $( '#mw-content-text' );
		if ( $container.length === 0 ) return;

		const $nodes = $container.find( '[id^="mw-fr-"]' );
		for ( const node of $nodes ) {
			const id = node.id;
			node.id = `instantDiffs-${ id }`;
			this.frElements[ id ] = node;
		}
	}

	/**
	 * Restores id attributes for the FlaggedRevs elements to the origin states before the page is detached.
	 * @private
	 */
	restoreElements() {
		for ( const [ id, node ] of Object.entries( this.frElements ) ) {
			node.id = id;
		}
	}
}

export default ReviewForm;