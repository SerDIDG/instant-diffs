import id from './id';
import * as utils from './utils';

import Button from './Button';
import Dialog from './Dialog';

/**
 * Class representing a button that opens a diff dialog.
 * @augments {import('./Button').default}
 */
class DialogButton extends Button {
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
            ariaHaspopup: true,
            handler: () => this.openDialog(),
        } );
    }

    /**
     * Open the Diff Dialog.
     */
    openDialog() {
        const options = {
            onOpen: () => this.onDialogOpen(),
            onClose: () => this.onDialogClose(),
        };

        const dialog = Dialog.getInstance( this, options );
        if ( !dialog ) return;

        this.pending( true );
        $.when( dialog.load() )
            .always( () => this.pending( false ) );
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
     * Get page.
     * @returns {object}
     */
    getPage() {
        // Validate page object
        this.page = utils.validatePage( this.page );
        this.page = utils.extendPage( this.page );

        return this.page;
    }
}

export default DialogButton;