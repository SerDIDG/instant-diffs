import $ from 'jquery';

import id from './id';
import * as utils from './utils';

import DialogButton from './DialogButton';

/**
 * Class representing a button that opens a diff dialog on the history page.
 * @extends {import('./DialogButton').default}
 */
class HistoryCompareButton extends DialogButton {
    /**
     * @type {string}
     */
    type = 'diff';

    /**
     * @type {string}
     */
    typeVariant = 'compare';

    /**
     * Event that emits after the Diff Dialog opens.
     */
    onDialogOpen() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.page.$oldidLine.addClass( 'instantDiffs-line--highlight' );
        this.page.$diffLine.addClass( 'instantDiffs-line--highlight' );
    }

    /**
     * Event that emits after the Diff Dialog closes.
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