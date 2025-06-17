import { readFile } from 'fs/promises';
import * as esbuild from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import { lessLoader } from 'esbuild-plugin-less';

// Read package.json
const pkg = JSON.parse(
    await readFile( new URL( './package.json', import.meta.url ) ),
);

// Folder where bundle will saving
const outdir = 'dist';
const outfile = 'instantDiffs' + ( process.argv.includes( '--dev' ) ? '.test' : '' );

// Get a script's version
const version = process.argv.includes( '--dev' ) ? pkg.version : pkg.version.split( '+' ).shift();

// String to replace in the files
const strings = {
    include: /\.js$/,
    __outdir__: outdir,
    __version__: version,
    __origin__: 'https://mediawiki.org',
    __styles__: `/w/index.php?title=User:Serhio_Magpie/${ outfile }.css&action=raw&ctype=text/css`,
    __messages__: '/w/index.php?title=User:Serhio_Magpie/instantDiffs-i18n/$lang.js&action=raw&ctype=text/javascript',
    __debug__: process.argv.includes( '--start' ),
};

if ( process.argv.includes( '--start' ) ) {
    strings.__origin__ = 'http://localhost:8000';
    strings.__styles__ = `/${ outfile }.css`;
    strings.__messages__ = '/instantDiffs-i18n/$lang.js';
}

// Prepend a banner and footer
const banner = `/**
 * Instant Diffs
 *
 * Version: ${ version }
 * Author: ${ pkg.author.name }
 * Licenses: ${ pkg.license }
 * Documentation: ${ pkg.homepage }
 */
 /* <nowiki> */`;

const footer = `/* </nowiki> */`;

// Build a config
const config = {
    logLevel: 'info',
    entryPoints: [ 'src/app.js' ],
    bundle: true,
    outfile: `${ outdir }/${ outfile }.js`,
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
if ( process.argv.includes( '--build' ) ) {
    await esbuild
        .build( {
            ...config,
            minify: true,
            sourcemap: false,
        } );
}

// Serve process
if ( process.argv.includes( '--start' ) ) {
    await esbuild
        .context( {
            ...config,
            minify: false,
            sourcemap: true,
        } )
        .then( async ( ctx ) => {
            await ctx.watch();
            await ctx.serve( {
                servedir: outdir,
                onRequest: ( { remoteAddress, method, path, status, timeInMS } ) => {
                    console.info( remoteAddress, status, `"${ method } ${ path }" [${ timeInMS }ms]` );
                },
            } );
        } )
        .catch( ( e ) => {
            console.error( e );
            process.exit( 1 );
        } );
}