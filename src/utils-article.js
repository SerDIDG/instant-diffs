import id from './id';
import * as utils from './utils';

import Article from './Article';

export function getRevID( article ) {
    const values = article.getValues();

    if ( utils.isValidID( article.get( 'revid' ) ) ) {
        return article.get( 'revid' );
    }

    if ( values.type === 'revision' ) {
        if ( utils.isValidID( values.oldid ) ) {
            if ( !utils.isValidDir( values.direction ) || values.direction === 'prev' ) {
                return values.oldid;
            }
        }
    }

    if ( values.type === 'diff' ) {
        if ( utils.isValidID( values.oldid ) && utils.isValidID( values.diff ) ) {
            return Math.max( values.oldid, values.diff );
        } else if ( utils.isValidID( values.oldid ) ) {
            if ( !utils.isValidDir( values.diff ) || values.diff === 'prev' ) {
                return values.oldid;
            }
        } else if ( utils.isValidID( values.diff ) ) {
            if ( !utils.isValidDir( values.oldid ) || values.oldid === 'prev' ) {
                return values.diff;
            }
        }
    }

    return false;
}

export function getDependencies( article ) {
    let dependencies = [];
    const typeDependencies = id.config.dependencies[ article.get( 'type' ) ];
    if ( typeDependencies ) {
        // Set common dependencies
        if ( typeDependencies[ '*' ] ) {
            dependencies = dependencies.concat( typeDependencies[ '*' ] );
        }

        // Set namespace-specific dependencies
        const namespace = article.getMW( 'title' )?.getNamespaceId();
        if ( typeDependencies[ namespace ] ) {
            dependencies = dependencies.concat( typeDependencies[ namespace ] );
        }
    }
    return dependencies;
}

export function getHref( article, articleParams, options ) {
    if ( !( article instanceof Article ) ) {
        article = new Article( article );
    }

    articleParams = { ...articleParams };
    options = {
        type: null,
        ...options,
    };

    // Get copy of the values
    const values = { ...article.getValues() };

    // Validate options
    if ( !options.type ) {
        if ( values.type === 'revision' && values.typeVariant === 'page' ) {
            options.type = 'page';
        } else {
            options.type = values.type;
        }
    }

    // Validate page params for diffs
    if ( options.type === 'diff' ) {
        if ( utils.isEmpty( values.diff ) && utils.isValidDir( values.direction ) ) {
            values.diff = values.direction;
        }

        if ( utils.isValidID( values.oldid ) && utils.isValidID( values.diff ) ) {
            articleParams.oldid = values.oldid;
            articleParams.diff = values.diff;
        } else if ( utils.isValidID( values.revid ) ) {
            articleParams.diff = values.revid;
        } else if ( utils.isValidID( values.oldid ) ) {
            if ( utils.isValidDir( values.diff ) && values.diff !== 'prev' ) {
                articleParams.oldid = values.oldid;
                articleParams.diff = values.diff;
            } else {
                articleParams.diff = values.oldid;
            }
        } else if ( utils.isValidID( values.diff ) ) {
            if ( utils.isValidDir( values.oldid ) && values.oldid !== 'prev' ) {
                articleParams.oldid = values.diff;
                articleParams.diff = values.oldid;
            } else {
                articleParams.diff = values.diff;
            }
        }
    }

    // Validate page params for revisions
    if ( options.type === 'revision' ) {
        if ( utils.isEmpty( values.direction ) && utils.isValidDir( values.diff ) ) {
            values.direction = values.diff;
        }

        if ( utils.isValidID( values.revid ) ) {
            articleParams.oldid = values.revid;
        } else if ( utils.isValidID( values.oldid ) ) {
            articleParams.oldid = values.oldid;
            if ( utils.isValidDir( values.direction ) && values.direction === 'next' ) {
                articleParams.direction = values.direction;
            }
        }
    }

    // Validate page params for pages
    if ( options.type === 'page' ) {
        articleParams.curid = values.curid;
    }

    return utils.getHref( article, articleParams, options );
}