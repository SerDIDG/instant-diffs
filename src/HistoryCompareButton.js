import id from './id';
import * as utils from './utils';

import ViewButton from './ViewButton';

/**
 * Class representing a button that opens a View dialog on the history article.
 * @augments {import('./ViewButton').default}
 */
class HistoryCompareButton extends ViewButton {
    /**
     * @type {Object}
     */
    nodes = {};

    /**
     * Open the View dialog.
     */
    openDialog() {
        this.nodes.$oldid = $( '#mw-history-compare input[name="oldid"]:checked' );
        this.nodes.$oldidLine = this.nodes.$oldid.closest( 'li' );

        this.nodes.$diff = $( '#mw-history-compare input[name="diff"]:checked' );
        this.nodes.$diffLine = this.nodes.$diff.closest( 'li' );

        this.article.set( {
            type: 'diff',
            title: id.local.mwTitleText,
            oldid: this.nodes.$oldid.val(),
            diff: this.nodes.$diff.val(),
        } );

        super.openDialog();
    }

    /**
     * Event that emits after the View dialog opens.
     */
    onDialogOpen() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.nodes.$oldidLine.addClass( 'instantDiffs-line--highlight' );
        this.nodes.$diffLine.addClass( 'instantDiffs-line--highlight' );
        super.onDialogOpen();
    }

    /**
     * Event that emits after the View dialog closes.
     */
    onDialogClose() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.nodes.$oldidLine.removeClass( 'instantDiffs-line--highlight' );
        this.nodes.$diffLine.removeClass( 'instantDiffs-line--highlight' );
        super.onDialogClose();
    }
}

export default HistoryCompareButton;