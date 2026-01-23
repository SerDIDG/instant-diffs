import minimist from 'minimist';
import { createRequire } from 'module';

const require = createRequire( import.meta.url );

const env = require( '../env.json' );
const pkg = require( '../package.json' );

const args = minimist( process.argv.slice( 2 ) );

export function isEmpty( value ) {
	return !value || value.length === 0;
}

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