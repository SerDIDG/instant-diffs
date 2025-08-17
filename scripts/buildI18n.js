/**
 * Partially copied from:
 * @see {@link https://github.com/jwbth/convenient-discussions/blob/main/buildI18n.js}
 */

const fs = require( 'fs' );
const path = require( 'path' );

const chalk = require( 'chalk' );
const createDOMPurify = require( 'dompurify' );
const { JSDOM } = require( 'jsdom' );
const { replaceEntitiesInI18n, unhideText, hideText } = require( './utils' );

const window = new JSDOM( '' ).window;
const DOMPurify = createDOMPurify( window );

const warning = ( text ) => console.log( chalk.yellowBright( text ) );
const code = chalk.inverse;
const keyword = chalk.cyan;

const ALLOWED_TAGS = [
    'b',
    'bdi',
    'bdo',
    'code',
    'em',
    'i',
    'kbd',
    'li',
    'nowiki',
    'ol',
    'p',
    'pre',
    'span',
    'strong',
    'syntaxhighlight',
    'ul',
    'var',
];

// Project config
const env = require( '../env.json' );
const project = env[ process.env.PROJECT ];

DOMPurify.addHook( 'uponSanitizeElement', ( currentNode, data, config ) => {
    if (
        !Object.keys( data.allowedTags ).includes( data.tagName ) &&
        ![ 'body', '#comment' ].includes( data.tagName )
    ) {
        // `< /li>` qualifies as `#comment` and has content available under `currentNode.textContent`.
        warning( `Disallowed tag found and sanitized in the string "${ keyword( config.stringName ) }" in ${ keyword( config.filename ) }: ${ code( currentNode.outerHTML || currentNode.textContent ) }. See\nhttps://translatewiki.net/wiki/Wikimedia:Convenient-discussions-${ config.stringName }/${ config.lang }.` );
        console.log( currentNode.outerHTML, currentNode.textContent, currentNode.tagName );
    }
} );

DOMPurify.addHook( 'uponSanitizeAttribute', ( currentNode, hookEvent, config ) => {
    if ( !Object.keys( hookEvent.allowedAttributes ).includes( hookEvent.attrName ) ) {
        warning( `Disallowed attribute found and sanitized in the string "${ keyword( config.stringName ) }" in ${ keyword( config.filename ) }: ${ code( hookEvent.attrName ) } with value "${ hookEvent.attrValue }". See\nhttps://translatewiki.net/wiki/Wikimedia:Convenient-discussions-${ config.stringName }/${ config.lang }.` );
    }
} );

const i18n = {};
fs.readdirSync( './i18n/' )
    .filter( filename => path.extname( filename ) === '.json' && filename !== 'qqq.json' )
    .forEach( ( filename ) => {
        const [ , lang ] = path.basename( filename ).match( /^(.+)\.json$/ ) || [];
        const strings = require( `../i18n/${ filename }` );
        Object.keys( strings )
            .filter( ( name ) => typeof strings[ name ] === 'string' )
            .forEach( ( stringName ) => {
                const hidden = [];
                let sanitized = hideText(
                    strings[ stringName ],
                    /<nowiki(?: [\w ]+(?:=[^<>]+?)?| *)>([^]*?)<\/nowiki *>/g,
                    hidden,
                );

                sanitized = DOMPurify.sanitize( sanitized, {
                    ALLOWED_TAGS,
                    ALLOWED_ATTR: [
                        'class',
                        'dir',
                        'href',
                        'target',
                    ],
                    ALLOW_DATA_ATTR: false,
                    filename,
                    stringName,
                    lang,
                } );

                sanitized = unhideText( sanitized, hidden );

                // Just in case dompurify or jsdom gets outdated or the repository gets compromised, we will
                // just manually check that only allowed tags are present.
                for ( const [ , tagName ] of sanitized.matchAll( /<(\w+)/g ) ) {
                    if ( !ALLOWED_TAGS.includes( tagName.toLowerCase() ) ) {
                        warning( `Disallowed tag ${ code( tagName ) } found in ${ keyword( filename ) } at the late stage: ${ keyword( sanitized ) }. The string has been removed altogether.` );
                        delete strings[ stringName ];
                        return;
                    }
                }

                // The same with suspicious strings containing what seems like the "javascript:" prefix or
                // one of the "on..." attributes.
                const test = sanitized.replace( /&\w+;|\s+/g, '' );
                if ( /javascript:/i.test( test ) || /\bon\w+\s*=/i.test( sanitized ) ) {
                    warning( `Suspicious code found in ${ keyword( filename ) } at the late stage: ${ keyword( sanitized ) }. The string has been removed altogether.` );
                    delete strings[ stringName ];
                    return;
                }

                strings[ stringName ] = sanitized;
            } );

        i18n[ lang ] = strings;
    } );

const i18nWithFallbacks = {};

if ( Object.keys( i18n ).length ) {
    // Use language fallbacks data to fill missing messages. When the fallbacks need to be updated,
    // they can be collected using
    // https://phabricator.wikimedia.org/source/mediawiki/browse/master/languages/messages/?grep=fallback%20%3D.
    const fallbackData = require( '../data/languageFallbacks.json' );
    Object.keys( i18n ).forEach( ( lang ) => {
        const fallbacks = fallbackData[ lang ];
        if ( fallbacks ) {
            const fallbackMessages = fallbacks.map( ( fbLang ) => i18n[ fbLang ] ).reverse();
            i18nWithFallbacks[ lang ] = Object.assign( {}, ...fallbackMessages, i18n[ lang ] );
        } else {
            i18nWithFallbacks[ lang ] = i18n[ lang ];
        }
    } );

    // Create i18n files.
    for ( const [ lang, json ] of Object.entries( i18nWithFallbacks ) ) {
        let jsonText = replaceEntitiesInI18n( JSON.stringify( json, null, '\t' ) );

        if ( lang === 'en' ) {
            // Prevent creating "</nowiki>" character sequences when building the main script file.
            jsonText = jsonText.replace( /<\/nowiki>/g, '</" + String("") + "nowiki>' );
        }

        const text = `window.instantDiffs ||= {};
instantDiffs.i18n ||= {};
instantDiffs.i18n['${ lang }'] = ${ jsonText };
`;

        fs.mkdirSync( `./${ project.dir }/${ project.name }-i18n/`, { recursive: true } );
        fs.writeFileSync( `./${ project.dir }/${ project.name }-i18n/${ lang }.js`, text );
    }
}

const i18nListText = JSON.stringify( Object.keys( i18n ), null, '\t' ) + '\n';
fs.writeFileSync( `./${ project.dir }/${ project.name }-i18n.json`, i18nListText );

console.log( 'Internationalization files have been built successfully.' );