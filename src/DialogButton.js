import id from './id';

import Button from './Button';
import Dialog from './Dialog';

/**
 * Class representing a button that opens a diff dialog.
 * @extends {import('./Button').default}
 */
class DialogButton extends Button {
    /**
     * @type {string}
     */
    type;

    /**
     * @type {string}
     */
    typeVariant;

    /**
     * @type {object}
     */
    page = {};

    /**
     * Create a dialog button.
     * @param {object} [options] configuration options
     */
    constructor( options ) {
        super( {
            ...options,
            handler: () => this.openDialog(),
            ariaHaspopup: true,
        } );
    }

    /**
     * Open the Diff Dialog.
     */
    openDialog() {
        if ( id.local.dialog && id.local.dialog.isLoading ) return;

        const options = {
            onOpen: () => this.onDialogOpen(),
            onClose: () => this.onDialogClose(),
        };
        if ( !id.local.dialog ) {
            id.local.dialog = new Dialog( this, options );
        } else {
            id.local.dialog.process( this, options );
        }

        this.pending( true );
        $.when( id.local.dialog.load() ).always( () => this.pending( false ) );
    }

    /**
     * Event that emits after the Diff Dialog opens.
     */
    onDialogOpen() {}

    /**
     * Event that emits after the Diff Dialog closes.
     */
    onDialogClose() {}

    /**
     * Get type.
     * @returns {string}
     */
    getType() {
        return this.type;
    }

    /**
     * Get type variant.
     * @returns {string}
     */
    getTypeVariant() {
        return this.typeVariant;
    }

    /**
     * Get page.
     * @returns {object}
     */
    getPage() {
        return this.page;
    }
}

export default DialogButton;