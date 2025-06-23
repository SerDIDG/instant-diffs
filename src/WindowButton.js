import * as utils from './utils';

import Button from './Button';
import Window from './Window';

/**
 * Class representing a button that opens a Window dialog.
 * @augments {import('./Button').default}
 */
class WindowButton extends Button {
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
     * Open the Window dialog.
     */
    openDialog() {
        const options = {
            onOpen: () => this.onDialogOpen(),
            onClose: () => this.onDialogClose(),
        };

        const window = Window.getInstance( this, options );
        if ( !window ) return;

        this.pending( true );
        $.when( window.load() )
            .always( () => this.pending( false ) );
    }

    /**
     * Event that emits after the Window dialog opens.
     */
    onDialogOpen() {}

    /**
     * Event that emits after the Window dialog closes.
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

export default WindowButton;