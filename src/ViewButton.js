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
            article: {},
            ...options,
            ariaHaspopup: true,
            handler: () => this.openDialog(),
        } );

        this.article = new Article( this.options.article );
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
        return $.when( view.load() )
            .always( () => this.onDialogLoad() );
    }

    /**
     * Event that emits before the View dialog loads.
     */
    onDialogRequest() {
        this.pending( true );
        this.emit( 'loading' );
    }

    /**
     * Event that emits after the View dialog loads.
     */
    onDialogLoad() {
        this.pending( false );
        this.emit( 'loaded' );
    }

    /**
     * Event that emits after the View dialog opens.
     */
    onDialogOpen() {
        this.emit( 'opened' );
    }

    /**
     * Event that emits after the View dialog closes.
     */
    onDialogClose() {
        this.emit( 'closed' );
    }

    /**
     * Get the Article instance.
     * @returns {import('./Article').default}
     */
    getArticle() {
        return this.article;
    }
}

export default ViewButton;