import { tweakUserOoUiClass } from './utils-oojs';

/**
 * Class representing a custom LabelWidget with a div tag name.
 * @augments OO.ui.LabelWidget
 */
class DivLabelWidget extends OO.ui.LabelWidget {
	static tagName = 'div';

	constructor() {
		super( {
			classes: [ 'oo-ui-messageDialog-message', 'is-transparent' ],
		} );
	}

	toggleVisibility( value ) {
		this.$element.toggleClass( 'is-transparent', !value );
	}
}

tweakUserOoUiClass( DivLabelWidget );

export default DivLabelWidget;