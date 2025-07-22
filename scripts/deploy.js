/**
 * Partially copied from:
 * {@link https://github.com/wikimedia-gadgets/twinkle-starter/blob/master/scripts/deploy.js}
 * (MIT Licence)
 */

const fs = require( 'fs/promises' );
const { Mwn } = require( 'mwn' );
const { execSync } = require( 'child_process' );
const prompts = require( 'prompts' );
const chalk = require( 'chalk' );
const minimist = require( 'minimist' );
const pkg = require( '../package.json' );

const deployConfig = {
    outdir: 'dist/',
    i18n: 'instantDiffs-i18n/',
    target: 'User:Serhio Magpie/',
    build: [
        'instantDiffs.css',
        'instantDiffs.js',
        'instantDiffs.js.LEGAL.txt',
        'instantDiffs-i18n.json',
    ],
    dev: [
        'instantDiffs.test.css',
        'instantDiffs.test.js',
    ],
};

class Deploy {
    deployTargets = [];

    config = {};

    siteName;

    editSummary;

    async deploy() {
        if ( !isGitWorkDirClean() ) {
            log( 'red', '[WARN] Git working directory is not clean.' );
        }
        this.config = this.loadConfig();
        await this.getDeployTargets();
        await this.getApi();
        await this.login();
        await this.makeEditSummary();
        await this.savePages();
    }

    loadConfig() {
        try {
            return require( __dirname + '/credentials.json' );
        } catch ( e ) {
            log( 'red', 'No credentials.json file found.' );
            return {};
        }
    }

    async getDeployTargets() {
        // Push main files to the deployment targets
        const files = args.dev ? deployConfig.dev : deployConfig.build;
        files.forEach( file => {
            this.deployTargets.push( {
                file: `${ deployConfig.outdir }${ file }`,
                target: `${ deployConfig.target }${ file }`,
            } );
        } );

        // Push i18n files to the deployment targets
        if ( deployConfig.build ) {
            const i18nDir = `${ deployConfig.outdir }${ deployConfig.i18n }`;
            const languages = await this.readDir( i18nDir );
            languages.forEach( file => {
                this.deployTargets.push( {
                    file: `${ i18nDir }${ file }`,
                    target: `${ deployConfig.target }${ deployConfig.i18n }${ file }`,
                } );
            } );
        }
    }

    async getApi() {
        this.api = new Mwn( this.config );
        try {
            this.api.initOAuth();
            this.usingOAuth = true;
        } catch ( e ) {
            if ( !this.config.username ) {
                this.config.username = await input( '> Enter username' );
            }
            if ( !this.config.password ) {
                this.config.password = await input( '> Enter bot password', 'password' );
            }
        }
        if ( args.testwiki ) {
            this.config.apiUrl = `https://test.wikipedia.org/w/api.php`;
        } else {
            if ( !this.config.apiUrl ) {
                if ( Object.keys( this.config ).length ) {
                    log( 'yellow', 'Tip: you can avoid this prompt by setting the apiUrl as well in credentials.json' );
                }
                const site = await input( '> Enter sitename (eg. en.wikipedia.org)' );
                this.config.apiUrl = `https://${ site }/w/api.php`;
            }
        }
        this.api.setOptions( this.config );
    }

    async login() {
        this.siteName = this.api.options.apiUrl.replace( /^https:\/\//, '' ).replace( /\/.*/, '' );
        log( 'yellow', '--- Logging in ...' );
        if ( this.usingOAuth ) {
            await this.api.getTokensAndSiteInfo();
        } else {
            await this.api.login();
        }
    }

    // TODO: read last saved commit hash and use that to construct a meaningful summary
    async makeEditSummary() {
        const sha = execSync( 'git rev-parse --short HEAD' ).toString( 'utf8' ).trim();
        const version = args.dev ? pkg.version : pkg.version.split( '+' ).shift();
        this.editSummary = `[${ sha }] [v${ version }]: Updated from repository.`;
    }

    async readFile( filepath ) {
        return ( await fs.readFile( __dirname + '/../' + filepath ) ).toString();
    }

    async readDir( path ) {
        return ( await fs.readdir( __dirname + '/../' + path ) );
    }

    async savePages() {
        await input( `> Press [Enter] to start deploying to ${ this.siteName } or [ctrl + C] to cancel` );

        log( 'yellow', '--- starting deployment ---' );

        for await ( const { file, target } of this.deployTargets ) {
            const fileText = await this.readFile( file );
            try {
                const response = await this.api.save( target, fileText, this.editSummary );
                if ( response && response.nochange ) {
                    log( 'yellow', `━ No change saving ${ file } to ${ target } on ${ this.siteName }` );
                } else {
                    log( 'green', `✔ Successfully saved ${ file } to ${ target } on ${ this.siteName }` );
                }
            } catch ( error ) {
                log( 'red', `✘ Failed to save ${ file } to ${ target } on ${ this.siteName }` );
                logError( error );
            }
        }
        log( 'yellow', '--- end of deployment ---' );
    }
}

function isGitWorkDirClean() {
    try {
        execSync( 'git diff-index --quiet HEAD --' );
        return true;
    } catch ( e ) {
        return false;
    }
}

async function input( message, type = 'text', initial = '' ) {
    const name = String( Math.random() );
    return ( await prompts( { type, name, message, initial } ) )[ name ];
}

function logError( error ) {
    error = error || {};
    console.log( ( error.info || 'Unknown error' ) + '\n', error.response || error );
}

function log( color, ...args ) {
    console.log( chalk[ color ]( ...args ) );
}

const args = minimist( process.argv.slice( 2 ) );
new Deploy().deploy();