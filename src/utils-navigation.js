import * as utils from './utils';
import { getModuleExport } from './utils-oojs';
import { getHrefAbsolute } from './utils-article';

/**
 * Updates status of the watch \ unwatch button.
 * @param {OO.ui.ButtonWidget} button a OO.ui.ButtonWidget instance
 * @param {import('./Article').default} article an Article instance
 */
export function updateWatchLinkStatus( button, article ) {
    //const config = getModuleExport(  'mediawiki.page.watch.ajax', 'config.json' );
    const watched = article.get( 'watched' );
    const action = watched ? 'unwatch' : 'watch';
    const expiry = article.get( 'expiry' ) || 'infinity';

    const label = `action-${ action }`;
    const href = mw.util.getUrl( article.get( 'title' ), { action } );

    let daysLeftExpiry = null;
    let tooltipAction;
    let icon;

    if ( watched ) {
        // Checking to see what if the expiry is set or indefinite to display the correct message
        if ( mw.util.isInfinity( expiry ) ) {
            tooltipAction = 'unwatch';
            icon = 'unStar';
        } else {
            const expiryDate = new Date( expiry );
            const currentDate = new Date();

            // Using the Math.ceil function instead of floor so when, for example, a user selects one week
            // the tooltip shows 7 days instead of 6 days (see Phab ticket T253936)
            daysLeftExpiry = Math.ceil( ( expiryDate - currentDate ) / ( 1000 * 60 * 60 * 24 ) );
            tooltipAction = daysLeftExpiry > 0 ? 'unwatch-expiring' : 'unwatch-expiring-hours';
            icon = 'halfStar';
        }
    } else {
        tooltipAction = 'watch';
        icon = 'star';
    }

    button.setLabel( utils.msg( label ) );
    button.setTitle( mw.msg( `tooltip-ca-${ tooltipAction }`, daysLeftExpiry ) );
    button.setIcon( icon );
    button.setHref( getHrefAbsolute( article, href ) );
}