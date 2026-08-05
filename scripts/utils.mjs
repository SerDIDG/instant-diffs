import path from 'path';
import { createRequire } from 'module';
import fs from 'fs/promises';
import minimist from 'minimist';
import { transform } from '@swc/core';

const require = createRequire( import.meta.url );
const args = minimist( process.argv.slice( 2 ) );

const env = require( '../env.json' );
const pkg = require( '../package.json' );

/******* COMMON *******/

/**
 * Checks if a string or an array is empty.
 * @param {*} value
 * @returns {boolean}
 */
export function isEmpty( value ) {
	return !value || value.length === 0;
}

/**
 * Checks if a value is a string.
 * @param {*} value
 * @returns {boolean}
 */
export function isString( value ) {
	return typeof value === 'string';
}

/**
 * Checks if a value is an array.
 * @param {*} value
 * @returns {boolean}
 */
export function isArray( value ) {
	return Array.isArray( value );
}

/******* STRINGS *******/

/**
 * Partially copied from:
 * @see {@link https://github.com/jwbth/convenient-discussions/blob/main/misc/utils.js}
 * @param {string} string
 * @return {string}
 */
export function replaceEntitiesInI18n( string ) {
	return string
		.replace( /&nbsp;/g, '\xa0' )
		.replace( /&#32;/g, ' ' )
		.replace( /&rlm;/g, '\u200f' )
		.replace( /&lrm;/g, '\u200e' );
}

/**
 * Partially copied from:
 * @see {@link https://github.com/jwbth/convenient-discussions/blob/main/misc/utils.js}
 */
export function hideText( text, regexp, hidden ) {
	return text.replace( regexp, ( s ) => '\x01' + hidden.push( s ) + '\x02' );
}

/**
 * Partially copied from:
 * @see {@link https://github.com/jwbth/convenient-discussions/blob/main/misc/utils.js}
 */
export function unhideText( text, hidden ) {
	while ( text.match( /\x01\d+\x02/ ) ) {
		text = text.replace( /\x01(\d+)\x02/g, ( s, num ) => hidden[ num - 1 ] );
	}
	return text;
}

/******* PROJECT SPECIFIC *******/

/**
 * Get and validate project configuration from env.json.
 * @param {string} name - Project name in the env.json
 * @return {Record|undefined}
 */
export function getProject( name ) {
	const project = env[ name ];
	if ( !project ) return;

	project.version = args.dev ? pkg.version : pkg.version.split( '+' ).shift();
	project.author = pkg.author.name;
	project.license = pkg.license;
	project.homepage = pkg.homepage;

	project.postfix = args.dev ? '.test' : '';
	project.fileName = `${ project.name }${ project.postfix }`;
	project.target = project.target.replace( '$name', project.fileName );

	project.i18n = project.i18n.replace( '$name', project.name );
	project.i18nDeploy = !args.dev && ( project.i18nDeploy ?? true );

	const i18nBundle = ( Array.isArray( project.i18nBundle ) ? project.i18nBundle : [] )
		.map( s => s.trim() )
		.filter( Boolean );
	project.i18nBundle = [ ...new Set( [ 'en', ...i18nBundle ] ) ];

	project.legalDeploy = project.legalDeploy ?? true;

	project.rateLimit ||= 0;
	project.retries ||= 0;

	project.credentials ||= {};
	project.esbuild ||= {};

	return project;
}

/******* BUILD SPECIFIC *******/

export function createEs5Plugin( target ) {
	const isEs5 = (
		( isString( target ) && target === 'es5' ) ||
		( isArray( target ) && target.includes( 'es5' ) )
	);

	return {
		name: 'swc-es5-plugin',
		setup( build ) {
			if ( !isEs5 ) return;

			build.initialOptions.target = 'esnext';
			build.initialOptions.write = false;

			// Config
			let banner = '(function(){';
			let footer = '})();';

			const transformConfig = {
				isModule: true,
				module: {
					type: 'commonjs',
				},
				jsc: {
					target: 'es5',
					parser: { syntax: 'ecmascript' },
				},
			};

			if ( build.initialOptions.minify ) {
				build.initialOptions.minify = false;

				banner = build.initialOptions.banner.js + '\n' + banner;
				footer = footer + '\n' + build.initialOptions.footer.js;

				transformConfig.minify = true;
				transformConfig.jsc.minify = {
					compress: true,
					mangle: true,
					format: {
						wrapIife: true,
					},
				};
			}

			// Process
			build.onEnd( async ( result ) => {
				if ( result.errors.length > 0 || !result.outputFiles ) return;

				for ( const file of result.outputFiles ) {
					if ( file.path.endsWith( '.js' ) ) {
						const transformed = await transform( file.text, transformConfig );
						file.contents = Buffer.from( banner + transformed.code + footer );
					}

					try {
						await fs.mkdir( path.dirname( file.path ), { recursive: true } );
						await fs.writeFile( file.path, file.contents );
					} catch ( writeError ) {
						console.error( `[swc-es5-plugin] Failed to write ${ file.path }:`, writeError );
					}
				}
			} );
		},
	};
}