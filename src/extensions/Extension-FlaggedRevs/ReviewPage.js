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
	 * @type {MutationObserver}
	 */
	observer;

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

		this.process();
		this.render();

		this.page.on( 'beforeDetach', () => this.detach() );
	}

	/**
	 * Processes the FlaggedRevs elements on the page: fixes the element flow, collects rating
	 * data, hides unsupported elements, and reroutes the pending changes link.
	 */
	process() {
		// Find FlaggedRevs table info and insert before the diff table to fix the element flow
		this.nodes.$diffHeader = this.page.getBody()
			.find( '#mw-fr-diff-headeritems' )
			.insertBefore( this.page.getDiffTable() );

		// Find FlaggedRevs ratings and collect data
		this.processRatings();

		// Find and hide the "All unpatrolled diffs" link, so the other scripts can use it later
		this.processPendingChangesLink();

		// Show or hide diff info table in the revision view
		if ( this.article.get( 'type' ) === 'revision' ) {
			if ( settings.get( 'showRevisionInfo' ) ) {
				// Hide the left side of the table and left only related to the revision info
				this.nodes.$diffHeaderRemoved.addClass( 'instantDiffs-hidden' );
			} else {
				this.nodes.$diffHeader.addClass( 'instantDiffs-hidden' );
			}
		}

		// Hide unsupported or unnecessary element
		this.page.getBody()
			.find( '.fr-diff-to-stable, #mw-fr-diff-dataform' )
			.addClass( 'instantDiffs-hidden' );
	}

	/**
	 * Finds the FlaggedRevs diff rating cells and stores the review status on the Article instance.
	 */
	processRatings() {
		const articleValues = {};

		this.nodes.$diffHeaderRatings = this.nodes.$diffHeader
			.find( '.fr-diff-ratings td' );

		if ( this.nodes.$diffHeaderRatings.length === 2 ) {
			this.nodes.$diffHeaderRemoved = this.nodes.$diffHeaderRatings.first();
			this.nodes.$diffHeaderAdded = this.nodes.$diffHeaderRatings.last();
		} else {
			this.nodes.$diffHeaderRemoved = $();
			this.nodes.$diffHeaderAdded = this.nodes.$diffHeaderRatings.first();
		}

		articleValues.deletedFlaggedRevsReviewed = this.nodes.$diffHeaderAdded
			.has( 'span.flaggedrevs-color-0' ).length > 0;
		articleValues.addedFlaggedRevsReviewed = this.nodes.$diffHeaderAdded
			.has( 'span.flaggedrevs-color-1' ).length > 0;

		// Set article alues
		this.article.setValues( articleValues );
	}

	/**
	 * Hides the "All unpatrolled diffs" link and adds it to the Page's navigation links.
	 */
	processPendingChangesLink() {
		this.nodes.$pendingChangesLink = this.nodes.$diffHeader
			.find( '.fr-diff-to-stable a' )
			.attr( 'data-instantdiffs-link', 'none' )
			.addClass( 'instantDiffs-hidden' );

		// ToDo: move button rendering from Navigation to this class
		this.page.addNavigationLink( 'pendingChanges', this.nodes.$pendingChangesLink.attr( 'href' ) );
	}

	/**
	 * Constructs the Review Form and registers the DOM observer once the page is ready.
	 */
	render() {
		this.reviewForm = new ReviewForm( this );

		// Wait until the page is ready to register observers
		this.page.when( 'ready', () => this.ready() );
	}

	/**
	 * Registers a mutation observer to catch when FlaggedRevs updates its nodes.
	 */
	ready() {
		// Observe DOM changes to catch when FlaggedRevs updates its nodes
		// after the review form is submitted.
		this.observer = new MutationObserver( this.onObserve );
		this.observer.observe( this.page.getBody().get( 0 ), {
			subtree: true,
			childList: true,
		} );
	}

	/**
	 * Event that emits on observer DOM changes.
	 * @param {MutationRecord[]} mutationList
	 * @private
	 */
	onObserve = ( mutationList ) => {
		for ( const mutation of mutationList ) {
			if ( mutation.target?.id !== 'mw-fr-diff-headeritems' ) continue;

			this.process();
			this.reviewForm.update();
		}
	};

	/**
	 * Detaches the Review Page instance.
	 */
	detach() {
		this.observer?.disconnect();
		this.restoreElements();
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