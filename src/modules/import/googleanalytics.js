import { google } from 'googleapis';
import { Event } from '../../models/event';

/**
 * Authenticates to the google analytics reporting API
 *
 * @export
 * @param { Object } configuration the JSON file that contains the settings for google analytics.
 */
/* istanbul ignore next */
function authenticate (configuration) {
    if (!configuration.analytics) {
        throw new Error('Analytics configuration is missing.');
    }

    var jwtClient = new google.auth.JWT(configuration.analytics.client_email, null, configuration.analytics.private_key, ['https://www.googleapis.com/auth/analytics.readonly']);
    jwtClient.authorize(function (err, tokens) { if (err) { throw new Error('Google Analytics authentication not correct. Check if configuration.json is filled in correctly or check if custom configuration is passed correctly.'); } });
    return google.analyticsreporting({ version: 'v4', auth: jwtClient });
}

/**
 * gets the visits out of the google analytics data with two custom functions getReport and convertToVisit.
 *
 * @export
 * @param { Object } configuration the configuration for Analytics.
 * @param { Function } getReport the custom get report function.
 * @param { Function } convertToVisit the custom convert to visit function.
 * @returns
 */
/* istanbul ignore next */
export async function importData (configuration, getReport, convertToVisit) {
    var analyticsreporting = authenticate(configuration);

    var visits = [];
    var result = await getReport(analyticsreporting, configuration.analytics);
    var report = result.data.reports[0];

    report.data.rows.forEach(function (element) {
        visits.push(convertToVisit(element));
    });

    while (report.nextPageToken) {
        result = await getReport(analyticsreporting, configuration.analytics, report.nextPageToken);
        report = result.data.reports[0];
        report.data.rows.forEach(function (element) {
            visits.push(convertToVisit(element));
        });
    }

    return visits;
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
    // Remove specific text by paging option.
    if (pagePath.substr(pagePath.lastIndexOf('/') + 1).includes('page')) {
        pagePath = pagePath.substr(0, pagePath.lastIndexOf('-'));
    }
    // Remove specific text by sorting option.
    if (pagePath.includes('sortby')) {
        pagePath = pagePath.replace(/(.*sortby)(?:(?:-.*?)?(\/.*)|(?:-.*))/g, '$1$2');
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
    var events = [];

    if (addsToCart > 0) { events.push(new Event('adds-to-cart', 1)); }
    if (removesFromCart > 0) { events.push(new Event('removes-from-cart', 1)); }
    if (transactions > 0) { events.push(new Event('transaction', 1)); }

    return events;
}
