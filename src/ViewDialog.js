import * as utils from './utils';
import { fixFloatedElementsIsolation, tweakUserOoUiClass } from './utils-oojs';

import DivLabelWidget from './DivLabelWidget';
import ViewProgressBar from './ViewProgrssBar';
import settings from './settings';

/**
 * Class representing a ViewDialog.
 * @augments OO.ui.MessageDialog
 */
class ViewDialog extends OO.ui.MessageDialog {
	static name = 'Instant Diffs Window';
	static size = 'instantDiffs';
	static actions = [
		{
			action: 'close',
			label: utils.msg( 'action-close' ),
			title: utils.msgHint( 'action-close', 'close' ),
		},
	];

	/**
	 * Create a ViewDialog instance.
	 */
	constructor() {
		super( {
			classes: [ 'instantDiffs-view' ],
		} );
	}

	initialize() {
		super.initialize();

		// By default, the whole message is wrapped in a <label> element.
		// We don't want that behavior and revert it.
		this.message.$element.remove();
		this.message = new DivLabelWidget();
		this.text.$element.append( this.message.$element );

		// Set content scroll element as primary focusable element
		this.$content.removeAttr( 'tabindex' );
		this.container.$element.attr( 'tabindex', '-1' );

		// Close the dialog when clicking outside it
		if ( settings.get( 'closeOutside' ) ) {
			this.$clickOverlay = $( '<div>' )
				.on( 'click', () => this.close() )
				.addClass( 'instantDiffs-view-overlay' )
				.appendTo( this.$element );
		}

		// Render progress bar loader
		this.progressBar = new ViewProgressBar();
		this.$content.prepend( this.progressBar.$element );

		return this;
	}

	/******* SETUP PROCESS *******/

	getSetupProcess( data ) {
		return super.getSetupProcess( data ).next( () => {
			// Make floatable elements accessible
			fixFloatedElementsIsolation();

			// Set a vertical scroll position to the top of the content
			this.container.$element.scrollTop( 0 );

			// Restore focus on the content
			this.focus();
		} );
	}

	onDialogKeyDown( event ) {
		super.onDialogKeyDown( event );

		// Add key events for the keyboard hotkeys
		if ( utils.isActiveElement() ) return;

		this.emit( 'hotkey', event );
	}

	getBodyHeight() {
		return 'auto';
	}

	/******* UPDATE PROCESS *******/

	update( data ) {
		return this.getUpdateProcess( data ).execute();
	}

	getUpdateProcess( data ) {
		return new OO.ui.Process().next( () => {
			// Hide progress bar
			this.toggleProgress( false );

			// Set content
			this.title.setLabel(
				data.title !== undefined ? data.title : this.constructor.static.title,
			);
			this.message.setLabel(
				data.message !== undefined ? data.message : this.constructor.static.message,
			);

			// Set a vertical scroll position to the top of the content
			this.container.$element.scrollTop( 0 );

			// Toggle content visibility
			this.toggleVisibility( true );

			// Restore focus on the content
			this.focus();
		} );
	}

	/******* TEARDOWN PROCESS *******/

	getTeardownProcess( data ) {
		return super.getTeardownProcess( data ).next( () => {
			// Hide progress bar
			this.toggleProgress( false );

			// Toggle content visibility
			this.toggleVisibility( false );
		} );
	}

	/******* ACTIONS *******/

	focus( focusLast ) {
		if ( focusLast ) {
			super.focus( focusLast );
		} else {
			// Focus scroll element so user can immediately interact with a content without pressing another tab
			this.container.$element.trigger( 'focus' );
		}
		return this;
	}

	toggleVisibility( value ) {
		this.message.toggleVisibility( value );
	}

	toggleProgress( ...args ) {
		this.progressBar.toggleVisibility( ...args );
	}
}

tweakUserOoUiClass( ViewDialog );

export default ViewDialog;