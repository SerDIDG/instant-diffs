import $ from 'jquery';

import id from './id';

import Button from './Button';
import Dialog from './Dialog';

class DialogButton extends Button {
    page = {};
    type;
    typeVariant;

    constructor( options ) {
        super( {
            ...options,
            handler: () => this.openDialog(),
            ariaHaspopup: true,
        } );
    }

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

    onDialogOpen() {}

    onDialogClose() {}

    getPage() {
        return this.page;
    }

    getType() {
        return this.type;
    }

    getTypeVariant() {
        return this.typeVariant;
    }
}

export default DialogButton;