import { google } from 'googleapis';
import { Event } from '../../models/event';

/**
 * Authenticates to the Google Analytics reporting API
 *
 * @export
 * @param { Object } configuration the JSON file that contains the settings for google analytics.
 */
/* istanbul ignore next */
function authenticate ({ analytics }) {
    if (!analytics) {
        throw new Error('Analytics configuration is missing.');
    }

    /* eslint-disable camelcase */
    const { client_email, private_key } = analytics;
    const jwtClient = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/analytics.readonly']);
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            throw new Error('Google Analytics authentication not correct. Check if configuration.json is filled in correctly or check if custom configuration is passed correctly.');
        }
    });

    return google.analyticsreporting({ version: 'v4', auth: jwtClient });
}

/**
 * Gets the visits out of the google analytics data.
 *
 * @export
 * @param { Object } configuration the configuration for Analytics.
 * @param { Function } getReport the custom get report function.
 * @returns
 */
/* istanbul ignore next */
export async function importData (configuration, getReport) {
    const analyticsreporting = authenticate(configuration);

    let elems = [];
    let result = await getReport(analyticsreporting, configuration.analytics);
    let report = result.data.reports[0];

    report.data.rows.forEach(e => elems.push(e));

    while (report.nextPageToken) {
        result = await getReport(analyticsreporting, configuration.analytics, report.nextPageToken);
        report = result.data.reports[0];
        report.data.rows.forEach(e => elems.push(e));
    }

    return elems;
}

/**
 * Cleans the page path to make it more consistent
 *
 * @export
 * @param { String } pagePath the pagePath that will be cleaned.
 * @returns { String } the new pagePath
 */
export function cleanPagePath (pagePath) {
    if (pagePath.indexOf('?') >= 0) {
        pagePath = pagePath.substring(0, pagePath.indexOf('?'));
    }
    // Remove URL from path
    if (pagePath.indexOf('http') >= 0) {
        pagePath = pagePath.replace(/(\/https?:\/\/.*?)(\/.*)/g, '$2');
    }
    // Remove unnecessary backslash in end of path.
    if (pagePath.length !== 1 && pagePath.endsWith('/')) {
        pagePath = pagePath.slice(0, -1);
    }

    return pagePath;
}

/**
 * Creates the commerce events from three variables.
 *
 * @export
 * @param { number } [addsToCart=0] the adds to carts.
 * @param { number } [removesFromCart=0] the removes from carts.
 * @param { number } [transactions=0] the transactions (payments).
 * @returns { Event[] } the array of events.
 */
export function getCommerceEvents (addsToCart = 0, removesFromCart = 0, transactions = 0) {
    let events = [];

    if (addsToCart > 0) { events.push(new Event('adds-to-cart', 1)); }
    if (removesFromCart > 0) { events.push(new Event('removes-from-cart', 1)); }
    if (transactions > 0) { events.push(new Event('transaction', 1)); }

    return events;
}
