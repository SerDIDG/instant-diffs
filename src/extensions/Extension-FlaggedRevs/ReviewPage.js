import ReviewForm from './ReviewForm';
import settings from '../../settings';

/**
 * Class representing the Review Page.
 */
class ReviewPage {
	/**
	 * @type {import('../../Page').Page.Any}
	 */
	page;

	/**
	 * @type {import('../../Article').default}
	 */
	article;

	/**
	 * @type {Object}
	 */
	nodes = {};

	/**
	 * @type {Object<string,HTMLElement>}
	 */
	frElements = {};

	/**
	 * @type {import('./ReviewForm').default}
	 */
	reviewForm;

	/**
	 * Creates the Review Page instance.
	 * @param {import('../../Page').Page.Any} page - a Page instance
	 */
	constructor( page ) {
		this.page = page;
		this.article = page.getArticle();

		if ( this.article.isForeign ) return;

		// Change id attributes for the FlaggedRevs elements on the current page before render.
		// Restores attributes to the origin states before the page is detached.
		this.prepareElements();
		this.page.on( 'beforeDetach', () => this.restoreElements() );

		this.process();
		this.render();
	}

	process() {
		// Find FlaggedRevs table info and insert before the diff table to fix the element flow
		this.nodes.$diffHeader = this.page.getBody()
			.find( '#mw-fr-diff-headeritems' )
			.insertBefore( this.page.getDiffTable() );

		// Find and hide the "All unpatrolled diffs" link, so the other scripts can use it later
		this.nodes.$pendingChangesLink = this.nodes.$diffHeader
			.find( '.fr-diff-to-stable a' )
			.attr( 'data-instantdiffs-link', 'none' )
			.addClass( 'instantDiffs-hidden' );

		// ToDo: move button rendering from Navigation to this class
		this.page.addNavigationLink( 'pendingChanges', this.nodes.$pendingChangesLink.attr( 'href' ) );

		// Show or hide diff info table in the revision view
		if ( this.article.get( 'type' ) === 'revision' ) {
			if ( settings.get( 'showRevisionInfo' ) ) {
				// Hide the left side of the table and left only related to the revision info
				this.nodes.$diffHeader
					.find( '.fr-diff-ratings td:nth-child(2n-1)' )
					.addClass( 'instantDiffs-hidden' );
			} else {
				this.nodes.$diffHeader
					.addClass( 'instantDiffs-hidden' );
			}
		}

		// Hide unsupported or unnecessary element
		this.page.getBody()
			.find( '.fr-diff-to-stable, #mw-fr-diff-dataform, #mw-fr-reviewform' )
			.addClass( 'instantDiffs-hidden' );
	}

	render() {
		this.reviewForm = new ReviewForm( this );
	}

	/******* HELPERS *******/

	/**
	 * Changes id attributes for the FlaggedRevs elements on the page.
	 * @private
	 */
	prepareElements() {
		const $container = $( '#mw-content-text, #mw-data-after-content' );
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

	/******* ACTIONS *******/

	/**
	 * Checks if the page has a FlaggedRevs diff header.
	 * @returns {boolean}
	 */
	hasDiffHeader() {
		return this.nodes.$diffHeader?.length > 0;
	}

	/**
	 * Get the Page instance.
	 * @returns {import('../../Page').Page.Any} a Page instance
	 */
	getPage() {
		return this.page;
	}

	/**
	 * Get the Article instance.
	 * @returns {import('../../Article').default} an Article instance
	 */
	getArticle() {
		return this.article;
	}
}

export default ReviewPage;