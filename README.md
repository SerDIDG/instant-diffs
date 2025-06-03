# Instant Diffs
**Instant Diffs** (**ID**) is a JavaScript tool that enhances [MediaWiki](https://www.mediawiki.org) diff links with interactive functionality — dynamically loaded content via [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)) technology in dialog windows. These features are integrated not only into all core interface pages where revision diffs are linked but also into user-contributed content. The minimal required version of MediaWiki is [1.35](https://www.mediawiki.org/wiki/MediaWiki_1.35), but it is highly recommended to upgrade to at least [1.39](https://www.mediawiki.org/wiki/MediaWiki_1.39) LTS.

## Features
* Displays an action button (❖ for diffs or ✪ for revisions) after the link to open the Instant Diffs dialog. Otherwise, the click action is added directly to the link, but you can still open the link in the current tab by pressing Alt+Click.
* Displays an action button (➔) after the link to navigate to the page and section where the edit was made. If the [Convenient Discussions](https://www.mediawiki.org/wiki/Convenient_Discussions) script is installed, the button will also try to navigate to the corresponding comment.
* Provides a quick actions menu in the dialog, allowing you to copy the link or an [internal wiki link](https://www.mediawiki.org/wiki/Help:Links#Internal_links), go to the page, its history, or the discussion.
* Enables administrators to view hidden revisions directly in the dialog, without any additional steps. The <code>suppressrevision</code> [user right](https://www.mediawiki.org/wiki/Help:RevisionDelete) is required to access hidden revision content.
* Offers a wide range of customization settings that are saved globally across all [Wikimedia](https://meta.wikimedia.org/wiki/Wikimedia_movement) projects.

## See also
* [Documentation](https://www.mediawiki.org/wiki/Instant_Diffs)
* [Feedback](https://www.mediawiki.org/wiki/Talk:Instant_Diffs)