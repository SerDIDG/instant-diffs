import { readFile } from 'fs/promises';
import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { replace } from 'esbuild-plugin-replace';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';
import { lessLoader } from 'esbuild-plugin-less';
import ImportGlobPlugin from 'esbuild-plugin-import-glob';

const ImportGlob = ImportGlobPlugin.default;

// Read package.json
const pkg = JSON.parse(
    await readFile( new URL( './package.json', import.meta.url ) ),
);

// String to replace in the files
const strings = {
    include: /\.js$/,
    __version__: pkg.version,
    __origin__: 'https://mediawiki.org',
    __styles__: '/w/index.php?title=User:Serhio_Magpie/instantDiffs.test.css&action=raw&ctype=text/css',
    __messages__: '/w/index.php?title=User:Serhio_Magpie/instantDiffs-i18n/$lang.js&action=raw&ctype=text/javascript',
    __debug__: process.argv.includes( '--start' ),
};

if ( process.argv.includes( '--start' ) ) {
    strings.__origin__ = 'http://localhost:8000';
    strings.__styles__ = '/bundle.css';
    strings.__messages__ = '/i18n/$lang.js';
}

// Prepend a banner
const banner = `/**
 * Instant Diffs
 *
 * Version: ${ pkg.version }
 * Author: ${ pkg.author.name }
 * Licenses: ${ pkg.license }
 * Documentation: ${ pkg.homepage }
 */`;

// Build a config
const config = {
    logLevel: 'info',
    entryPoints: [ 'src/app.js' ],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'iife',
    banner: {
        js: banner,
        css: banner,
    },
    plugins: [
        copy( {
            resolveFrom: 'cwd',
            assets: {
                from: [ './i18n/*' ],
                to: [ './dist/i18n' ],
            },
            watch: true,
        } ),
        replace( strings ),
        globalExternals( {
            mediawiki: 'mw',
            jquery: '$',
            oojs: 'OO',
            'oojs-ui': 'OO.ui',
        } ),
        ImportGlob(),
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
                servedir: 'dist',
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