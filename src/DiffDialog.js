import * as utils from './utils';

/**
 * Construct a custom LabelWidget.
 */
function DiffLabel() {
    DiffLabel.super.call( this, {
        classes: [ 'oo-ui-DiffDialog-message' ],
    } );
}

OO.inheritClass( DiffLabel, OO.ui.LabelWidget );

DiffLabel.static.tagName = 'div';

/**
 * Construct a custom MessageDialog.
 */
export function DiffDialog( dialog ) {
    this.dialog = dialog;

    DiffDialog.super.call( this, {
        classes: [ 'instantDiffs-dialog' ],
    } );
}

OO.inheritClass( DiffDialog, OO.ui.MessageDialog );

DiffDialog.static.name = 'Instant Diffs Dialog';
DiffDialog.static.size = 'instantDiffs';
DiffDialog.static.actions = [
    {
        action: 'close',
        label: utils.msg( 'close' ),
    },
];

DiffDialog.prototype.initialize = function () {
    // Parent method
    DiffDialog.super.prototype.initialize.apply( this, arguments );

    // By default, the whole message is wrapped in a <label> element.
    // We don't want that behavior and revert it.
    this.message.$element.remove();
    this.message = new DiffLabel();
    this.text.$element.append( this.message.$element );

    // Close the dialog when clicking outside of it
    this.$clickOverlay = $( '<div>' )
        .on( 'click', () => this.close() )
        .addClass( 'instantDiffs-dialog-overlay' )
        .appendTo( this.$element );

    // Set a content scroll event
    this.container.$element.on( 'scroll', this.onScroll.bind( this ) );
};

DiffDialog.prototype.getSetupProcess = function ( data ) {
    data = data || {};

    // Parent method
    return DiffDialog.super.prototype.getSetupProcess.call( this, data )
        .next( function () {
            // Set a vertical scroll position to the top of the content
            this.container.$element.scrollTop( 0 );
        }, this );
};

DiffDialog.prototype.getUpdateProcess = function ( data ) {
    data = data || {};

    return new OO.ui.Process()
        .next( function () {
            this.title.setLabel(
                data.title !== undefined ? data.title : this.constructor.static.title,
            );
            this.message.setLabel(
                data.message !== undefined ? data.message : this.constructor.static.message,
            );

            // Set focus on the dialog to restore emitting close event by pressing esc key
            this.focus();

            // Set a vertical scroll position to the top of the content
            this.container.$element.scrollTop( 0 );
        }, this );
};

DiffDialog.prototype.update = function ( data ) {
    return this.getUpdateProcess( data ).execute();
};

DiffDialog.prototype.focus = function () {
    this.$content.trigger( 'focus' );
};

DiffDialog.prototype.onScroll = function ( event ) {
    this.dialog.onScroll( event );
};