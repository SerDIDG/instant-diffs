import id from './id';
import * as utils from './utils';

export async function getInterwikiMap() {
    if ( !utils.isEmpty( id.local.interwikiMap ) ) {
        return id.local.interwikiMap;
    }

    const data = await id.local.mwApi.get( {
        action: 'query',
        meta: 'siteinfo',
        siprop: 'interwikimap',
        format: 'json',
        formatversion: 2,
        uselang: id.local.userLanguage,
    } );

    try {
        return id.local.interwikiMap = data.query.interwikimap;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}