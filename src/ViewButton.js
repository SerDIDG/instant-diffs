import Article from './Article';
import Button from './Button';
import view from './view';

/**
 * Class representing a button that opens a View dialog.
 * @augments {import('./Button').default}
 */
class ViewButton extends Button {
	/**
	 * @type {import('./Article').default}
	 */
	article;

	/**
	 * Creates a view button instance.
	 * @param {Object} [options] - Configuration options
	 */
	constructor( options ) {
		super( {
			article: {},
			...options,
			ariaHaspopup: true,
			handler: () => this.openDialog(),
		} );

		this.article = new Article( this.options.article );
	}

	/**
	 * Opens the View dialog to display the diff or revision.
	 * Sets up the dialog, triggers callbacks, and loads content.
	 * @returns {JQuery.Promise} Promise that resolves when dialog content loads
	 */
	openDialog() {
		const options = {
			onOpen: () => this.onDialogOpen(),
			onClose: () => this.onDialogClose(),
		};

		const isReady = view.setup( this, options );
		if ( !isReady ) return $.Deferred().resolve().promise();

		this.onDialogRequest();
		return $.when( view.load() )
			.always( () => this.onDialogLoad() );
	}

	/**
	 * Callback fired before the View dialog loads.
	 * Shows loading cursor.
	 * @private
	 */
	onDialogRequest() {
		this.pending( true );
		this.emit( 'loading' );
	}

	/**
	 * Callback fired after the View dialog loads.
	 * Hides loading cursor.
	 * @private
	 */
	onDialogLoad() {
		this.pending( false );
		this.emit( 'loaded' );
	}

	/**
	 * Callback fired after the View dialog opens.
	 * @private
	 */
	onDialogOpen() {
		this.emit( 'opened' );
	}

	/**
	 * Callback fired after the View dialog closes.
	 * @private
	 */
	onDialogClose() {
		this.emit( 'closed' );
	}

	/**
	 * Gets the associated Article instance.
	 * @returns {import('./Article').default} Article instance
	 */
	getArticle() {
		return this.article;
	}
}

export default ViewButton;