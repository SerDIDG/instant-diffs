/*
 * Authors: [[User:Serhio Magpie]]
 */

// <nowiki>

window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n.en = {
    'name': 'Instant Diffs',

    /*** LINKS ***/

    'diff-title': 'Difference between revisions',
    'diff-title-admin': 'Difference between revisions is hidden',
    'revision-title': 'Revision content',
    'revision-title-admin': 'Revision content is hidden',
    'compare': '$1',
    'compare-title': 'Compare selected revisions ($1)',
    'alt-click': '(Alt+Click: open the link)',

    /*** DIALOG ***/

    'save': 'Save',
    'cancel': 'Cancel',
    'close': 'Close',
    'reload': 'Reload',

    'title-empty': '[No title]',
    'title-not-found': '[Not found]',
    'unsupported-wikilambda': 'WikiLambda app is not currently supported.',

    /*** NAVIGATION ***/

    'goto-links': 'Links',
    'goto-snapshot-next': 'Next link on a page',
    'goto-snapshot-prev': 'Previous link on a page',
    'goto-view-diff': 'Show changes',
    'goto-view-revision': 'Show revision',
    'goto-view-pending': 'Pending changes',
    'goto-prev': 'Older',
    'goto-next': 'Newer',
    'goto-prev-diff': 'Older edit',
    'goto-next-diff': 'Newer edit',
    'goto-back-diff': 'Back',
    'goto-prev-revision': 'Older revision',
    'goto-next-revision': 'Newer revision',
    'goto-back-revision': 'Back',
    'goto-cd': 'Go to message',
    'goto-diff': 'Go to edit',
    'goto-revision': 'Go to revision',
    'goto-page': 'Go to page',
    'goto-history': 'View history',
    'goto-talkpage': 'Discussion',
    'goto-settings': 'Settings',

    /*** ACTIONS ***/

    'copy-link': 'Copy link',
    'copy-link-copied': 'The link has been copied to the clipboard.',
    'copy-link-error': 'Couldn\'t copy the link.',

    'copy-wikilink': 'Copy wikilink',
    'wikilink-page': 'page',
    'wikilink-diff': 'diff',
    'wikilink-revision': 'revision',
    'wikilink-example-title': 'Main Page',

    /*** SETTINGS ***/

    'settings-title': 'Instant Diffs Settings',
    'settings-saved': 'The settings have been saved successfully. Reload the page to apply them.',
    'settings-fieldset-links': 'Links',
    'settings-show-link': 'Show action link',
    'settings-show-link-help': 'Displays an action button (❖) after the link to open the Instant Diffs dialog. Otherwise, the click action is added directly to the link. You can still open the link in the current tab by pressing Alt+Click.',
    'settings-show-page-link': 'Show page link',
    'settings-show-page-link-help': 'Displays an action button (➔) after the link to navigate to the page and section where the edit was made. If the Convenient Discussions script is installed, the button will also try to navigate to the corresponding comment.',
    'settings-highlight-line': 'Highlight lines in Watchlists and similar lists when the Instant Diffs dialog opens from the related link.',
    'settings-mark-watched-line': 'Mark changes as visited in Watchlists when the Instant Diffs dialog opens from the related link.',
    'settings-fieldset-dialog': 'Dialog',
    'settings-unhide-diffs': 'Display hidden revision content and diff info without additional steps.',
    'settings-unhide-diffs-help': 'The "suppressrevision" user right is required to view revision content.',
    'settings-show-revision-info': 'Show change information when viewing a revision.',
    'settings-open-in-new-tab': 'Open links inside the Instant Diffs dialog in a new tab.',
    'settings-links-format': 'Link format for the copy action',
    'settings-links-format-full': 'Full url with a page title',
    'settings-links-format-minify': 'Minified url',
    'settings-wikilinks-format': 'Wikilink format for the copy action',
    'settings-wikilinks-format-link': 'Simple link in brackets',
    'settings-wikilinks-format-special': 'Internal wiki link',
    'settings-fieldset-general': 'General',
    'settings-enable-mobile': 'Enable Instant Diffs on the mobile skin (Minerva).',
    'settings-enable-mobile-help': 'To re-enable Instant Diffs, you will need to switch to a different skin.',
    'settings-show-menu-icons': 'Show icons in the Instant Diffs dialog dropdown menu.',
    'settings-notify-errors': 'Show popup alerts for critical errors.',

    /*** ERRORS ***/

    'error-wasted': 'wasted',
    'error-generic': 'Something went wrong: $4',
    'error-prepare-generic': 'Failed to prepare configuration: $4',
    'error-prepare-version': 'An instance of the script is already running: $4',
    'error-prepare-mobile': 'The script is disabled in the settings for the mobile skin (Minerva)',
    'error-revision-generic': 'Failed to load revision data "oldid=$1": $4',
    'error-revision-curid': 'Failed to load revision data "curid=$1": $4',
    'error-revision-badrevids': 'Revision not found',
    'error-revision-badpageids': 'Page not found',
    'error-revision-missing': 'Page not found',
    'error-revision-invalid': 'Page not found: $4',
    'error-diff-generic': 'Failed to load revision compare data "oldid=$1", "diff=$2": $4',
    'error-diff-missingcontent': 'Revision is hidden',
    'error-diff-nosuchrevid': 'Revision not found',
    'error-dependencies-generic': 'Failed to load dependencies: $4',
    'error-dependencies-parse': 'Failed to load page dependencies "$3": $4',
    'error-setting-request': 'Failed to load user options: $4',
    'error-setting-save': 'Failed to save user options',
};

// </nowiki>
