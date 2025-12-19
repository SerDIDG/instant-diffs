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
const { isEmpty, getProject } = require( './utils.mjs' );

const args = minimist( process.argv.slice( 2 ) );
const warning = ( text ) => console.log( chalk.yellowBright( text ) );

// Project config
const project = getProject( process.env.PROJECT );
if ( !project ) {
	warning( 'Please provide a valid PROJECT environment variable.' );
	process.exit( 1 );
}

// Deploy config
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

	credentials = {};

	siteName;

	editSummary;

	async deploy() {
		if ( !isGitWorkDirClean() ) {
			log( 'red', '[WARN] Git working directory is not clean.' );
		}
		await this.getCredentials();
		await this.getDeployTargets();
		await this.getApi();
		await this.login();
		await this.makeEditSummary();
		await this.savePages();
	}

	async getCredentials() {
		this.credentials = { ...project.credentials };

		if ( isEmpty( this.credentials.apiUrl ) && !isEmpty( project.server ) ) {
			this.credentials.apiUrl = `${ project.server }${ project.scriptPath }/api.php`;
		}
	}

	async getDeployTargets() {
		// Push main files to the deployment targets
		const files = args.dev ? deployConfig.dev : deployConfig.build;
		files.forEach( file => {
			this.deployTargets.push( {
				file: `${ project.dir }/${ file }`,
				target: project.target.replace( '$name', file ),
			} );
		} );

		// Push i18n files to the deployment targets
		if ( project.i18nDeploy ) {
			const dir = `${ project.dir }/${ project.name }-i18n`;
			const languages = await this.readDir( dir );
			languages.forEach( file => {
				this.deployTargets.push( {
					file: `${ dir }/${ file }`,
					target: `${ project.i18nProcessed }${ file }`,
				} );
			} );
		}
	}

	async getApi() {
		this.api = new Mwn( this.credentials );
		try {
			this.api.initOAuth();
			this.usingOAuth = true;
		} catch ( e ) {
			if ( !this.credentials.username ) {
				this.credentials.username = await input( '> Enter username' );
			}
			if ( !this.credentials.password ) {
				this.credentials.password = await input( '> Enter bot password', 'password' );
			}
		}

		if ( !this.credentials.apiUrl ) {
			if ( Object.keys( this.credentials ).length ) {
				log( 'yellow', 'Tip: you can avoid this prompt by setting the server as well in env.json' );
			}
			const site = await input( '> Enter server (eg. en.wikipedia.org)' );
			const scriptPath = await input( '> Enter script path (eg. /w)' );
			this.credentials.apiUrl = `https://${ site }${ scriptPath }/api.php`;
		}

		this.api.setOptions( this.credentials );
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
		this.editSummary = `[${ sha }] [v${ project.version }]: Updated from repository.`;
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

new Deploy().deploy();