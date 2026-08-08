import { execSync } from 'child_process';
import chalk from 'chalk';
import { getProject } from './utils.mjs';
import { mkdirSync, writeFileSync } from 'fs';

const warning = ( text ) => console.log( chalk.yellowBright( text ) );

// Project config
const project = getProject( process.env.PROJECT );
if ( !project ) {
	warning( 'Please provide a valid PROJECT environment variable.' );
	process.exit( 1 );
}

function getContributors() {
	return execSync( 'git shortlog -sn --all' )
		.toString( 'utf8' )
		.trim()
		.split( '\n' )
		.map( line => line.replace( /^\s*\d+\s+/, '' ) );
}

const contributors = JSON.stringify( getContributors(), null, '\t' ) + '\n';
mkdirSync( `./${ project.dir }/`, { recursive: true } );
writeFileSync( `./${ project.dir }/${ project.name }-contributors.json`, contributors );

console.log( 'Contributors list have been built successfully.' );