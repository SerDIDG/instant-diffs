# Instant Diffs ![lic](https://img.shields.io/github/license/SerDIDG/instant-diffs)
<img align="right" width="128" alt="Logo" src="https://raw.githubusercontent.com/SerDIDG/instant-diffs/main/assets/Logo.svg" />

**Instant Diffs** (**ID**) is a free [open-source](https://en.wikipedia.org/wiki/Open-source_software) JavaScript tool that enhances [MediaWiki](https://www.mediawiki.org) diff and revision links with interactive previews. Instead of navigating to a separate page, users can view, compare, and interact with diffs directly in context, loaded on demand in the overlay dialog via [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)).

The gadget works across all standard MediaWiki interface pages where diffs and revision links appear, including local and global watchlists, local and global user contributions, recent changes, logs, new pages and page history, as well as in user-generated content such as talk pages and project pages.

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
| `rateLimit` | `number` | `0` | [API rate limit](https://www.mediawiki.org/wiki/API:Ratelimit) in requests per minute. Set to `0` for no rate limiting                                                                                                                            |
| `retries` | `number` | `0` | Number of retry attempts for each failed individual request                                                                                                                                                                                        |
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

### Automated Deployment (GitHub Actions)
Two workflows build and deploy the gadget from CI.

Because `env.json` is not committed, its contents must be provided as a repository secret named `ENV_JSON`. Add it under **Settings → Secrets and variables → Actions → New repository secret** and paste the full contents of your local `env.json`. Both workflows write this secret to `env.json` before building.

#### Deploy
The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow runs in two ways:

* **Automatically** when a GitHub **release is published** — performs a full production deploy to the `mediawiki` project (`npm run deploy`). Only full releases trigger it; prereleases are skipped.
* **Manually** via **Actions → Deploy → Run workflow**, with two inputs:
  * `project` — the configuration key from `env.json` to deploy (e.g. `mediawiki`, `testwiki`). Defaults to `mediawiki`.
  * `mode` — the deploy mode (defaults to `prod`):
    * `prod` — a full production deploy (`npm run deploy`)
    * `dev` — a quick development deploy that enables debugging and skips external i18n (`npm run deploy-dev`)

#### Deploy i18n
The [`.github/workflows/deploy-i18n.yml`](.github/workflows/deploy-i18n.yml) workflow deploys only the internationalization files (`npm run deploy-i18n`). It runs in two ways:

* **Automatically** when localisation updates from [translatewiki.net](https://translatewiki.net/wiki/Translating:Instant_Diffs) are pushed to `i18n/` on the `main` branch — deploys i18n to the `mediawiki` project.
* **Manually** via **Actions → Deploy i18n → Run workflow**, with a `project` input (the `env.json` configuration key, defaults to `mediawiki`).

i18n deployment still honors each project's `i18nDeploy` setting — if a project has it disabled, nothing is deployed for it.

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

---

<p align="center">
  <a href="https://stand-with-ukraine.pp.ua">
    <img src="https://raw.githubusercontent.com/SerDIDG/instant-diffs/main/assets/Outline of Ukraine.svg" alt="Ukraine" width="128"/>
    <br>
    <b>Support Ukraine</b>
  </a>
</p>