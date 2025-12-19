import minimist from 'minimist';
import chalk from 'chalk';
import * as esbuild from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import { lessLoader } from 'esbuild-plugin-less';
import { getProject } from './scripts/utils.mjs';

const args = minimist( process.argv.slice( 2 ) );
const warning = ( text ) => console.log( chalk.yellowBright( text ) );

// Project config
const project = getProject( process.env.PROJECT );
if ( !project ) {
	warning( 'Please provide a valid PROJECT environment variable.' );
	process.exit( 1 );
}

// String to replace in the files
const strings = {
	include: /\.js$/,
	__outname__: project.name,
	__outdir__: project.dir,
	__version__: project.version,
	__origin__: 'https://www.mediawiki.org',
	__server__: project.server,
	__styles__: `${ project.scriptPath }/index.php?title=${ project.target }.css&action=raw&ctype=text/css`,
	__messages__: `${ project.scriptPath }/index.php?title=${ project.i18n }$lang.js&action=raw&ctype=text/javascript`,
	__debug__: process.argv.includes( '--start' ),
};

if ( args.start ) {
	strings.__styles__ = `${ project.target }.css`;
	strings.__messages__ = `${ project.i18n }$lang.js`;
}

// Prepend a banner and a footer
const banner = `/**
 * Instant Diffs
 *
 * Version: ${ project.version }
 * Author: ${ project.author }
 * Licenses: ${ project.license }
 * Documentation: ${ project.homepage }
 *
 * For license information please see: https://www.mediawiki.org/wiki/User:Serhio_Magpie/instantDiffs.js.LEGAL.txt
 */
 /* <nowiki> */`;

const footer = `/* </nowiki> */`;

// Build a config
const config = {
	logLevel: 'info',
	entryPoints: [ 'src/app.js' ],
	bundle: true,
	treeShaking: true,
	outfile: `${ project.dir }/${ project.name }${ project.postfix }.js`,
	format: 'iife',
	banner: {
		js: banner,
		css: banner,
	},
	footer: {
		js: footer,
		css: footer,
	},
	plugins: [
		replace( strings ),
		lessLoader(),
	],
};

// Build process
if ( args.build ) {
	await esbuild
		.build( {
			...config,
			minify: true,
			sourcemap: false,
			legalComments: 'external',
			...project.esbuild,
		} );
}

// Serve process
if ( args.start ) {
	await esbuild
		.context( {
			...config,
			minify: false,
			sourcemap: true,
			...project.esbuild,
		} )
		.then( async ( ctx ) => {
			await ctx.watch();
			await ctx.serve( {
				servedir: project.dir,
				onRequest: ( { remoteAddress, method, path, status, timeInMS } ) => {
					console.info( remoteAddress, status, `"${ method } ${ path }" [${ timeInMS }ms]` );
				},
			} );
		} )
		.catch( ( e ) => {
			warning( e );
			process.exit( 1 );
		} );
}
