import id from '../../id';
import * as utils from '../../utils';
import { executeModuleScript } from '../../utils-oojs';

import ReviewButton from './ReviewButton';

/**
 * Class representing the review form.
 */
class ReviewForm {
	/**
	 * @type {import('../../Page').Page.Any}
	 */
	page;

	/**
	 * @type {import('../../Article').default}
	 */
	article;

	/**
	 * @type {ReviewButton}
	 */
	button;

	/**
	 * Creates a Review Form instance.
	 * @param {import('../../Page').Page.Any} page - a Page instance
	 */
	constructor( page ) {
		this.page = page;
		this.article = page.getArticle();

		if (
			this.article.isForeign ||
			this.article.get( 'type' ) !== 'diff' ||
			this.article.get( 'deletedRevid' ) > this.article.get( 'stableRevid' ) ||
			!this.article.hasAction( 'review' )
		) {
			return;
		}

		this.render();
	}

	render() {
		// Render popup button
		this.button = new ReviewButton();

		// Register diff tool
		this.page.registerDiffTool( {
			name: 'flaggedRevsButton',
			node: this.button.$element,
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

		// Embed form to the button popup and pop pending state
		utils.addTargetToLinks( $reviewForm );
		this.button
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