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

	/**
	 * @private
	 */
	getSetupProcess( data ) {
		return super.getSetupProcess( data ).next( () => {
			// Make floatable elements accessible
			fixFloatedElementsIsolation();

			// Set a vertical scroll position to the top of the content
			this.scrollContentTop( 0 );

			// Restore focus on the content
			this.focus();
		} );
	}

	/**
	 * @private
	 */
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

	/**
	 * @private
	 */
	getUpdateProcess( data ) {
		return new OO.ui.Process().next( () => {
			// Validate data
			data = {
				title: this.constructor.static.title,
				message: this.constructor.static.message,
				scrollTop: 0,
				...data,
			};

			// Hide the progress bar
			this.toggleProgress( false );

			// Set content
			this.title.setLabel( data.title );
			this.message.setLabel( data.message );

			// Set a vertical scroll position to the top of the content
			this.scrollContentTop(
				utils.isFunction( data.scrollTop ) ? data.scrollTop() : data.scrollTop,
			);

			// Toggle content visibility
			this.toggleVisibility( true );

			// Restore focus on the content
			this.focus();
		} );
	}

	/******* TEARDOWN PROCESS *******/

	/**
	 * @private
	 */
	getTeardownProcess( data ) {
		return super.getTeardownProcess( data ).next( () => {
			// Hide the progress bar
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
			// Focus scroll element so the user can immediately interact with a content without pressing another tab
			this.container.$element.trigger( 'focus' );
		}
		return this;
	}

	toggleVisibility( value ) {
		this.message.toggleVisibility( value );
		return this;
	}

	toggleProgress( ...args ) {
		this.progressBar.toggleVisibility( ...args );
		return this;
	}

	/**
	 * Scroll element offset top relative to the dialog content.
	 * @param {HTMLElement|JQuery<HTMLElement>} element
	 * @param {number} [offset=0]
	 * @return {number}
	 */
	getContentOffsetTop( element, offset = 0 ) {
		let position = 0;

		if ( utils.isElement( element ) || element instanceof jQuery ) {
			position = utils.getOffsetRelativeToContainer( element, this.container.$element )?.top;
		}

		if ( typeof position === 'number' ) {
			return position + offset;
		}
	}

	/**
	 * Set dialog content scroll padding top offset.
	 * @param {number} [position=0]
	 * @return {ViewDialog}
	 */
	setScrollOffsetTop( position = 0 ) {
		this.container.$element.css( '--instantDiffs-view-scroll-padding-top', `${ position }px` );
		return this;
	}

	/**
	 * Scroll dialog content to the specific position.
	 * @param {number|HTMLElement|JQuery<HTMLElement>} [elementOrPosition = 0]
	 * @param {number} [offset=0]
	 * @return {ViewDialog}
	 */
	scrollContentTop( elementOrPosition = 0, offset = 0 ) {
		let position = 0;

		if ( typeof elementOrPosition === 'number' ) {
			position = elementOrPosition;
		}

		if ( utils.isElement( elementOrPosition ) || elementOrPosition instanceof jQuery ) {
			position = utils.getOffsetRelativeToContainer( elementOrPosition, this.container.$element )?.top;
		}

		if ( typeof position === 'number' ) {
			this.container.$element.scrollTop( position + offset );
		}

		return this;
	}
}

tweakUserOoUiClass( ViewDialog );

export default ViewDialog;