import id from './id';
import * as utils from './utils';

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