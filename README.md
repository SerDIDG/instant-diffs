# Instant Diffs ![lic](https://img.shields.io/github/license/SerDIDG/instant-diffs)
<img align="right" width="128" alt="Logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Instant_Diffs_logo.svg/256px-Instant_Diffs_logo.svg.png" />

**Instant Diffs** (**ID**) is a JavaScript tool that enhances [MediaWiki](https://www.mediawiki.org) diff links with interactive functionality — dynamically loaded content via [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)) technology in dialog windows. It enables users to interact with diffs and revisions directly within the page, rather than being redirected to a separate page. These features are integrated not only into all core interface pages where revision diffs are linked, like local and global watchlists, user contributions, recent changes and new pages, but also into user-contributed content. The minimal required version of MediaWiki is [1.35](https://www.mediawiki.org/wiki/MediaWiki_1.35), but it is strongly recommended to upgrade to at least [1.43](https://www.mediawiki.org/wiki/MediaWiki_1.43) LTS.

## Features
* Displays an action button (❖ for diffs or ✪ for revisions) after the link to open the Instant Diffs dialog. By default, the click action is added directly to the link, but you can still open the link in the current tab using `Alt+Click`.
* Displays an action button (➔) after the link to navigate to the page and section where the edit was made. If the [Convenient Discussions](https://www.mediawiki.org/wiki/Convenient_Discussions) script is installed, the button will also try to navigate to the corresponding comment.
* Allows quick switching between a revision view and its comparison (diff) with another revision.
* Provides a quick actions menu in the dialog, allowing you to copy the link or an [internal wiki link](https://www.mediawiki.org/wiki/Help:Links#Internal_links), navigate to the page, its history, or discussion, and add or remove the page from the watchlist.
* Enables viewing diffs and revisions from foreign interwikis in the [GlobalContributions](https://www.mediawiki.org/wiki/Extension:GlobalContributions), [GlobalWatchlist](https://www.mediawiki.org/wiki/Extension:GlobalWatchlist) and in edits from [Wikidata](https://meta.wikimedia.org/wiki/Wikidata).
* Supports keyboard shortcuts for navigation between diffs and between links on the page in the Instant Diffs dialog window.
  * `Arrow Left` - previous diff or revision in the history;
  * `Arrow Right` - next diff or revision in the history;
  * `Ctrl+Arrow Left` - previous link on the page;
  * `Ctrl+Arrow Right` - next link on the page;
  * `Ctrl+Arrow Up` - switch between revision view and its comparison;
  * `Ctrl+Arrow Down` - toggle visibility of the actions menu.
* Allows sending thanks, patrolling, and rolling back (with confirmation prompts enabled) directly from the dialog.
* Enables administrators to view hidden revisions directly in the dialog without any additional steps. The <code>suppressrevision</code> [user right](https://www.mediawiki.org/wiki/Help:RevisionDelete) is required to access hidden revision content.
* Fully adapts to mobile devices, especially optimized for the [Minerva](https://www.mediawiki.org/wiki/Skin:Minerva_Neue) skin.
* Offers a wide range of customization settings that are saved globally across all [Wikimedia](https://meta.wikimedia.org/wiki/Wikimedia_movement) projects.

## Development
Install [Node.js](https://nodejs.org/en/download) and package dependencies:
```
npm install
```

Make a copy of the environment variables file, configure your project, and fill in all necessary fields:

*Unix:*
```
cp env.json.example env.json
```

*Windows (PowerShell):*
```
Copy-Item env.json.example env.json
```

### Configuration Parameters
The `env.json` file contains configuration objects for different deployment environments. Each configuration object (e.g., `testwiki`, `mediawiki`) supports the following parameters:

| Parameter | Type | Default | Description                                                                                                                                                                                                                                        |
|-----------|------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `dir` | `string` | *required* | Directory containing the built files (e.g. `dist`)                                                                                                                                                                                                       |
| `name` | `string` | *required* | Base name of the script (e.g. `instantDiffs`)                                                                                                                                                                                                      |
| `server` | `string` | *required* | MediaWiki server URL (e.g., `https://www.mediawiki.org`)                                                                                                                                                                                           |
| `scriptPath` | `string` | *required* | MediaWiki script path (e.g., `/w`)                                                                                                                                                                                                                 |
| `target` | `string` | *required* | Target page on the wiki where the script will be deployed. Use the `$name` placeholder for the script name (e.g., `MediaWiki:Gadget-$name`)                                                                                                        |
| `i18n` | `string` | *required* | Target path for internationalization files. Use the `$name` placeholder for the script name (e.g., `MediaWiki:Gadget-$name-i18n/`)                                                                                                                 |
| `i18nDeploy` | `boolean` | `true` | Whether to deploy external language files. Automatically set to `false` in development mode (`--dev` flag)                                                                                                                                         |
| `i18nBundle` | `string[]` | `["en"]` | Array of language codes to bundle with the main script. English (`en`) is always included even if not specified                                                                                                                                    |
| `legalDeploy` | `boolean` | `true` | Whether to deploy legal notice files                                                                                                                                                                                                               |
| `credentials` | `object` | `{}` | Authentication credentials for [siddharthvp/mwn](https://github.com/siddharthvp/mwn) library (Interface [`MwnOptions`](https://mwn.toolforge.org/docs/api/interfaces/MwnOptions.html)). Typically includes `username`, `password`, and `userAgent` |
| `esbuild` | `object` | `{}` | Optional build configuration for [esbuild](https://esbuild.github.io/api/#build). Passed to the `esbuild.build()` function (e.g., `{ "target": "es2016" }`)                                                                                        |

### Deployment Commands
To start a local development server (uses the `local` project configuration from `env.json`):
```
npm run start:local
```

Or specify a custom project configuration name:
```
cross-env PROJECT=local npm run start
```

To deploy to a wiki, specify the project configuration name (e.g., `mediawiki`):
```
cross-env PROJECT=mediawiki npm run deploy
```

## Define a gadget
If you deploy the script as a gadget, remember to define the gadget in your wiki's `MediaWiki:Gadgets-definition` page with a configuration like this:
```
* instantDiffs [ResourceLoader | dependencies=site, mediawiki.api, mediawiki.util, mediawiki.storage, mediawiki.notification, mediawiki.Title, oojs] | instantDiffs.js | instantDiffs.css
```

If you want to preload a language other than English, link the language file to the end of the definition, for example:
```
instantDiffs.js | instantDiffs.css | instantDiffs-i18n/uk.js
```

## See also
* [Documentation](https://www.mediawiki.org/wiki/Instant_Diffs)
* [News](https://www.mediawiki.org/wiki/Instant_Diffs/News)
* [Feedback](https://www.mediawiki.org/wiki/Talk:Instant_Diffs)
* [Developer guide](https://www.mediawiki.org/wiki/Instant_Diffs/API)
* [Translations](https://translatewiki.net/wiki/Translating:Instant_Diffs)