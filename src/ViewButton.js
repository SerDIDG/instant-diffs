import * as utils from './utils';

import Button from './Button';
import view from './View';

/**
 * Class representing a button that opens a View dialog.
 * @augments {import('./Button').default}
 */
class ViewButton extends Button {
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
     * Open the View dialog.
     */
    openDialog() {
        const options = {
            onOpen: () => this.onDialogOpen(),
            onClose: () => this.onDialogClose(),
        };
        const promise = view.setup( this, options );
        if ( !promise ) return;

        this.pending( true );
        $.when( promise )
            .always( () => this.pending( false ) );
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

export default ViewButton;