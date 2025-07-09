import id from './id';
import * as utils from './utils';

import Article from './Article';

export function getRevID( article ) {
    if ( utils.isValidID( article.get( 'revid' ) ) ) {
        return article.get( 'revid' );
    }

    if ( article.get( 'type' ) === 'revision' ) {
        if ( utils.isValidID( article.get( 'oldid' ) ) ) {
            if ( !utils.isValidDir( article.get( 'direction' ) ) || article.get( 'direction' ) === 'prev' ) {
                return article.get( 'oldid' );
            }
        }
    }

    if ( article.get( 'type' ) === 'diff' ) {
        if ( utils.isValidID( article.get( 'oldid' ) ) && utils.isValidID( article.get( 'diff' ) ) ) {
            return Math.max( article.get( 'oldid' ), article.get( 'diff' ) );
        } else if ( utils.isValidID( article.get( 'oldid' ) ) ) {
            if ( !utils.isValidDir( article.get( 'diff' ) ) || article.get( 'diff' ) === 'prev' ) {
                return article.get( 'oldid' );
            }
        } else if ( utils.isValidID( article.get( 'diff' ) ) ) {
            if ( !utils.isValidDir( article.get( 'oldid' ) ) || article.get( 'oldid' ) === 'prev' ) {
                return article.get( 'diff' );
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
    if ( !(article instanceof Article ) ) {
        article = new Article( article );
    }

    articleParams = { ...articleParams };
    options = {
        type: null,
        ...options,
    };

    // Validate options
    if ( !options.type ) {
        if ( article.get( 'type' ) === 'revision' && article.get( 'typeVariant' ) === 'page' ) {
            options.type = 'page';
        } else {
            options.type = article.get( 'type' );
        }
    }

    // Validate page params for diffs
    if ( options.type === 'diff' ) {
        if ( utils.isEmpty( article.get( 'diff' ) ) && utils.isValidDir( article.get( 'direction' ) ) ) {
            article.setValue( 'diff', article.get( 'direction' ) );
        }

        if ( utils.isValidID( article.get( 'oldid' ) ) && utils.isValidID( article.get( 'diff' ) ) ) {
            articleParams.oldid = article.get( 'oldid' );
            articleParams.diff = article.get( 'diff' );
        } else if ( utils.isValidID( article.get( 'revid' ) ) ) {
            articleParams.diff = article.get( 'revid' );
        } else if ( utils.isValidID( article.get( 'oldid' ) ) ) {
            if ( utils.isValidDir( article.get( 'diff' ) ) && article.get( 'diff' ) !== 'prev' ) {
                articleParams.oldid = article.get( 'oldid' );
                articleParams.diff = article.get( 'diff' );
            } else {
                articleParams.diff = article.get( 'oldid' );
            }
        } else if ( utils.isValidID( article.get( 'diff' ) ) ) {
            if ( utils.isValidDir( article.get( 'oldid' ) ) && article.get( 'oldid' ) !== 'prev' ) {
                articleParams.oldid = article.get( 'diff' );
                articleParams.diff = article.get( 'oldid' );
            } else {
                articleParams.diff = article.get( 'diff' );
            }
        }
    }

    // Validate page params for revisions
    if ( options.type === 'revision' ) {
        if ( utils.isEmpty( article.get( 'direction' ) ) && utils.isValidDir( article.get( 'diff' ) ) ) {
            article.setValue( 'direction', article.get( 'diff' ) );
        }

        if ( utils.isValidID( article.get( 'revid' ) ) ) {
            articleParams.oldid = article.get( 'revid' );
        } else if ( utils.isValidID( article.get( 'oldid' ) ) ) {
            articleParams.oldid = article.get( 'oldid' );
            if ( utils.isValidDir( article.get( 'direction' ) ) && article.get( 'direction' ) === 'next' ) {
                articleParams.direction = article.get( 'direction' );
            }
        }
    }

    // Validate page params for pages
    if ( options.type === 'page' ) {
        articleParams.curid = article.get( 'curid' );
    }

    return utils.getHref( article, articleParams, options );
}