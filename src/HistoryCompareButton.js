import id from './id';
import * as utils from './utils';

import ViewButton from './ViewButton';

/**
 * Class representing a button that opens a View dialog on the history page.
 * @augments {import('./ViewButton').default}
 */
class HistoryCompareButton extends ViewButton {
    /**
     * Event that emits after the View dialog opens.
     */
    onDialogOpen() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.page.$oldidLine.addClass( 'instantDiffs-line--highlight' );
        this.page.$diffLine.addClass( 'instantDiffs-line--highlight' );
    }

    /**
     * Event that emits after the View dialog closes.
     */
    onDialogClose() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.page.$oldidLine.removeClass( 'instantDiffs-line--highlight' );
        this.page.$diffLine.removeClass( 'instantDiffs-line--highlight' );
    }

    /**
     * Get page.
     * @returns {object}
     */
    getPage() {
        this.page.type = 'diff';
        this.page.title = id.local.titleText;

        this.page.$oldid = $( '#mw-history-compare input[name="oldid"]:checked' );
        this.page.$oldidLine = this.page.$oldid.closest( 'li' );
        this.page.oldid = this.page.$oldid.val();

        this.page.$diff = $( '#mw-history-compare input[name="diff"]:checked' );
        this.page.$diffLine = this.page.$diff.closest( 'li' );
        this.page.diff = this.page.$diff.val();

        return super.getPage();
    }
}

export default HistoryCompareButton;