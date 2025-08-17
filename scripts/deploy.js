/**
 * Partially copied from:
 * @see {@link https://github.com/wikimedia-gadgets/twinkle-starter/blob/master/scripts/deploy.js}
 * (MIT Licence)
 */

const fs = require( 'fs/promises' );
const { Mwn } = require( 'mwn' );
const { execSync } = require( 'child_process' );
const prompts = require( 'prompts' );
const chalk = require( 'chalk' );
const minimist = require( 'minimist' );
const pkg = require( '../package.json' );

// Project config
const env = require( '../env.json' );
const project = env[ process.env.PROJECT ];

const deployConfig = {
    build: [
        `${ project.name }.css`,
        `${ project.name }.js`,
        `${ project.name }.js.LEGAL.txt`,
        `${ project.name }-i18n.json`,
    ],
    dev: [
        `${ project.name }.test.css`,
        `${ project.name }.test.js`,
        `${ project.name }.test.js.LEGAL.txt`,
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
                file: `${ project.dir }/${ file }`,
                target: `${ project.target }${ file }`,
            } );
        } );

        // Push i18n files to the deployment targets
        if ( !args.dev ) {
            const dir = `${ project.dir }/${ project.name }-i18n`;
            const languages = await this.readDir( dir );
            languages.forEach( file => {
                this.deployTargets.push( {
                    file: `${ dir }/${ file }`,
                    target: `${ project.i18n }${ file }`,
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

        if ( !this.config.apiUrl ) {
            if ( Object.keys( this.config ).length ) {
                log( 'yellow', 'Tip: you can avoid this prompt by setting the apiUrl as well in credentials.json' );
            }
            const site = await input( '> Enter sitename (eg. en.wikipedia.org)' );
            this.config.apiUrl = `https://${ site }/w/api.php`;
        } else {

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

    // ToDo: read last saved commit hash and use that to construct a meaningful summary
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
        const action = await input( `> Press [Enter] to start deploying to ${ this.siteName } or [ctrl + C] to cancel` );

        if ( action === undefined ) {
            log( 'yellow', '--- Terminated ---' );
            return;
        }

        log( 'yellow', '--- Starting deployment ---' );

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
        log( 'yellow', '--- End of deployment ---' );
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