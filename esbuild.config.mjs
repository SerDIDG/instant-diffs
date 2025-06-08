import { readFile } from 'fs/promises';
import * as esbuild from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';

import { lessLoader } from 'esbuild-plugin-less';
import ImportGlobPlugin from 'esbuild-plugin-import-glob';
const ImportGlob = ImportGlobPlugin.default;

// Read package.json to import version
const pkg = JSON.parse(
    await readFile( new URL( './package.json', import.meta.url ) ),
);

// String to replace in the files
const strings = {
    include: /\.js$/,
    '__version__': pkg.version,
};

// Prepend a banner
const banner = `/**
 * Instant Diffs
 *
 * Author: ${ pkg.author }
 * Licenses: ${ pkg.license }
 * Documentation: ${ pkg.homepage }
 */`;

await esbuild.build( {
    entryPoints: [ 'src/app.js' ],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'iife',
    banner: {
        js: banner,
        css: banner,
    },
    plugins: [
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
    loader: {
        '.json': 'json',
    },
} );