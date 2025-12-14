import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';

import settings from './settings';

/**
 * Class representing a custom PopupButtonWidget for the navigation menu.
 * @augments OO.ui.PopupButtonWidget
 */
class MenuActionsButton extends OO.ui.PopupButtonWidget {
	/**
	 * Create a MenuActionsButton instance.
	 * @param {OO.ui.PopupButtonWidget.ConfigOptions} [options] - A PopupButtonWidget configuration options
	 */
	constructor( options ) {
		// Validate options
		options = utils.optionsMerge( {
			icon: 'menu',
			label: utils.msg( 'goto-actions' ),
			title: utils.msgHint( 'goto-actions', 'actions', settings.get( 'enableHotkeys' ) ),
			invisibleLabel: true,
			popup: {
				classes: [
					'instantDiffs-buttons-popup',
					settings.get( 'showMenuIcons' ) ? 'has-icons' : null,
				],
				width: 'auto',
				padded: false,
				anchor: false,
				align: 'backwards',
				autoClose: true,
			},
		}, options );

		// Call parent class constructor
		super( options );
	}

	/**
	 * Execute a click handler on the button element.
	 * @returns {MenuActionsButton}
	 */
	execHandler() {
		this.$button.get( 0 ).click();

		return this;
	}

	/**
	 * Toggle a popup state.
	 * @param {boolean} value
	 * @returns {MenuActionsButton}
	 */
	togglePopup( value ) {
		this.getPopup().toggle( value );

		return this;
	}

	/**
	 * Toggle a buttons pending state that shows a loading cursor.
	 * @param {boolean} value
	 * @returns {MenuActionsButton}
	 */
	pending( value ) {
		this.$button.toggleClass( 'instantDiffs-link--pending', value );

		return this;
	}
}

tweakUserOoUiClass( MenuActionsButton );

export default MenuActionsButton;