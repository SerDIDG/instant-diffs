import Article from './Article';
import Button from './Button';
import view from './View';

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
     * Create a dialog button.
     * @param {Object} [options] configuration options
     */
    constructor( options ) {
        super( {
            ...options,
            ariaHaspopup: true,
            handler: () => this.openDialog(),
        } );

        this.article = new Article();
    }

    /**
     * Open the View dialog.
     */
    openDialog() {
        const options = {
            onOpen: () => this.onDialogOpen(),
            onClose: () => this.onDialogClose(),
        };
        const isReady = view.setup( this, options );
        if ( !isReady ) return;

        this.onDialogRequest();
        $.when( view.load() )
            .always( () => this.onDialogLoad() );
    }

    /**
     * Event that emits before the View dialog loads.
     */
    onDialogRequest() {
        this.pending( true );
    }

    /**
     * Event that emits after the View dialog loads.
     */
    onDialogLoad() {
        this.pending( false );
    }

    /**
     * Event that emits after the View dialog opens.
     */
    onDialogOpen() {}

    /**
     * Event that emits after the View dialog closes.
     */
    onDialogClose() {}

    /**
     * Get the Article instance.
     * @returns {import('./Article').default}
     */
    getArticle() {
        return this.article;
    }
}

export default ViewButton;