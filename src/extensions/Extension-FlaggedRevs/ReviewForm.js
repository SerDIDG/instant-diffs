import id from '../../id';
import * as utils from '../../utils';
import { executeModuleScript } from '../../utils-oojs';

import settings from '../../settings';

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

		if (
			!settings.get( 'enableReviewForm' ) ||
			this.article.isForeign ||
			this.article.get( 'type' ) !== 'diff' ||
			this.article.get( 'deletedRevid' ) > this.article.get( 'stableRevid' ) ||
			!this.article.hasAction( 'review' )
		) {
			return;
		}

		// Lazy-import modules
		this.ReviewButton = require( './ReviewButton' ).default;

		// Change id attributes for the FlaggedRevs elements on the page before render review form.
		// Restores attributes to the origin states before page detach.
		this.prepareElements();
		this.page.on( 'beforeDetach', () => this.restoreElements() );

		// Render popup button:
		// Show button immediately if FlaggedRevs elements persist on the page,
		// otherwise show button after a successful form HTML request.
		if ( this.page.hasFlaggedRevs() ) {
			this.render();
		}
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
	 * @param {string} data
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
		if ( !this.reviewButton ) {
			this.render();
		}
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
	 * Restores id attributes for the FlaggedRevs elements to the origin states before page detach.
	 * @private
	 */
	restoreElements() {
		for ( const [ id, node ] of Object.entries( this.frElements ) ) {
			node.id = id;
		}
	}
}

export default ReviewForm;