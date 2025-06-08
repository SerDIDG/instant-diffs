import $ from 'jquery';

import id from './id';

import Button from './Button';
import Dialog from './Dialog';

class DialogButton {
    options = {};
    page = {};
    button;

    constructor( options ) {
        this.options = $.extend( {}, options, {
            handler: this.openDialog.bind( this ),
            ariaHaspopup: true,
        } );
        this.button = new Button( this.options );
    }

    openDialog() {
        if ( id.local.dialog && id.local.dialog.isLoading ) return;

        const options = {
            onOpen: this.onDialogOpen.bind( this ),
            onClose: this.onDialogClose.bind( this ),
        };
        if ( !id.local.dialog ) {
            id.local.dialog = new Dialog( this, options );
        } else {
            id.local.dialog.process( this, options );
        }

        this.toggleLoader( true );
        $.when( id.local.dialog.load() ).always( () => this.toggleLoader( false ) );
    }

    toggleLoader( value ) {
        this.button.pending( value );
    }

    embed( container, insertMethod ) {
        this.button.embed( container, insertMethod );
    }

    onDialogOpen() {}

    onDialogClose() {}

    getPage() {}

    getType() {}

    getTypeVariant() {}
}

export default DialogButton;