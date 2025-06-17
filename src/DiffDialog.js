import * as utils from './utils';

import DivLabelWidget from './DivLabelWidget';

/**
 * Class representing a DiffDialog.
 * @augments OO.ui.MessageDialog
 */
class DiffDialog extends OO.ui.MessageDialog {
    static name = 'Instant Diffs Dialog';
    static size = 'instantDiffs';
    static actions = [
        {
            action: 'close',
            label: utils.msg( 'action-close' ),
        },
    ];

    /**
     * @type {import('./Dialog').default}
     */
    dialog;

    /**
     * Create a DiffDialog instance.
     * @param {import('./Dialog').default} dialog a Dialog instance
     */
    constructor( dialog ) {
        super( {
            classes: [ 'instantDiffs-dialog' ],
        } );

        this.dialog = dialog;
    }

    initialize( ...args ) {
        super.initialize( ...args );

        // By default, the whole message is wrapped in a <label> element.
        // We don't want that behavior and revert it.
        this.message.$element.remove();
        this.message = new DivLabelWidget();
        this.text.$element.append( this.message.$element );

        // Close the dialog when clicking outside of it
        this.$clickOverlay = $( '<div>' )
            .on( 'click', () => this.close() )
            .addClass( 'instantDiffs-dialog-overlay' )
            .appendTo( this.$element );

        // Set a content scroll event
        this.container.$element.on( 'scroll', this.onScroll.bind( this ) );
    }

    getSetupProcess( data ) {
        return super.getSetupProcess( data )
            .next( () => {
                // Set a vertical scroll position to the top of the content
                this.container.$element.scrollTop( 0 );
            } );
    }

    update( data ) {
        return this.getUpdateProcess( data ).execute();
    }

    getUpdateProcess( data ) {
        return new OO.ui.Process()
            .next( () => {
                this.title.setLabel(
                    data.title !== undefined ? data.title : this.constructor.static.title,
                );
                this.message.setLabel(
                    data.message !== undefined ? data.message : this.constructor.static.message,
                );

                // Restore focus trap inside the dialog
                this.focus();

                // Set a vertical scroll position to the top of the content
                this.container.$element.scrollTop( 0 );
            } );
    }

    focus( ...args ) {
        super.focus?.( ...args );

        this.$content.trigger( 'focus' );
    }

    onScroll( event ) {
        this.dialog.onScroll( event );
    }

    getContainerElement() {
        return this.container.$element;
    }
}

utils.tweakUserOoUiClass( DiffDialog );

export default DiffDialog;