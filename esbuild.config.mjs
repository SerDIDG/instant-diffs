import fs from 'fs/promises';
import minimist from 'minimist';
import * as esbuild from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import { lessLoader } from 'esbuild-plugin-less';

const args = minimist( process.argv.slice( 2 ) );

// Package config
const pkg = JSON.parse(
    await fs.readFile( new URL( './package.json', import.meta.url ) ),
);
const version = args.dev ? pkg.version : pkg.version.split( '+' ).shift();
const postfix = args.dev ? '.test' : '';

// Project config
const env = JSON.parse(
    await fs.readFile( new URL( './env.json', import.meta.url ) ),
);
const project = env[ process.env.PROJECT ];
project.target = project.target.replace( '$name', project.name ) + postfix;
project.i18n = project.i18n.replace( '$name', project.name );

// String to replace in the files
const strings = {
    include: /\.js$/,
    __outname__: project.name,
    __outdir__: project.dir,
    __version__: version,
    __origin__: 'https://www.mediawiki.org',
    __styles__: `/w/index.php?title=${ project.target }.css&action=raw&ctype=text/css`,
    __messages__: `/w/index.php?title=${ project.i18n }$lang.js&action=raw&ctype=text/javascript`,
    __debug__: process.argv.includes( '--start' ),
};

if ( args.start ) {
    strings.__origin__ = project.server;
    strings.__styles__ = `${ project.target }.css`;
    strings.__messages__ = `${ project.i18n }$lang.js`;
}

// Prepend a banner and a footer
const banner = `/**
 * Instant Diffs
 *
 * Version: ${ version }
 * Author: ${ pkg.author.name }
 * Licenses: ${ pkg.license }
 * Documentation: ${ pkg.homepage }
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
    outfile: `${ project.dir }/${ project.name }${ postfix }.js`,
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
        } );
}

// Serve process
if ( args.start ) {
    await esbuild
        .context( {
            ...config,
            minify: false,
            sourcemap: true,
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
            console.error( e );
            process.exit( 1 );
        } );
}