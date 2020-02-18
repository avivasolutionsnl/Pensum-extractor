import { PageVisit } from '../../models/pagevisit';
import { Visit } from '../../models/visit';
import { importData, cleanPagePath, getCommerceEvents } from './googleanalytics';

const entranceValue = '(entrance)';

/**
 * Gets all the visits
 *
 * @export
 * @param { Object } configuration the configuration that is used for Google Analytics.
 * @param { Function } toGenericPagePath
 * @param { Array } GA data elements
 * @returns { PageVisit[] } returns the visits.
 */
/* istanbul ignore next */
export async function importVisits (configuration, toGenericPagePath, data = null) {
    if (!data) {
        data = await importData(configuration, getReport);
    }

    return data.map(e => convertToPageVisit(e, toGenericPagePath));
}

/**
 *  Converts the google analytics data row to a page visit.
 *
 * @param { object } element the google analytics row.
 * @returns { PageVisit } the created PageVisit object.
 */
export function convertToPageVisit (element, toGenericPagePath = (p) => p) {
    // Get all the dimensions out of the element.
    element.dimensions.map(s => s.toLowerCase());
    let [pagePath, previousPagePath] = element.dimensions;

    // Get all the metrics out of the element.
    let [occurences, thinkTime, entrances, exit, addsToCart, removesFromCart, transactions] = element.metrics[0].values;

    // Total occurences is minus number of exits
    occurences -= exit; // TODO: verify if this is correct

    // cleaning
    pagePath = toGenericPagePath(cleanPagePath(pagePath));
    previousPagePath = toGenericPagePath(cleanPagePath(previousPagePath));
    if (previousPagePath === entranceValue) {
        previousPagePath = 'entrance';
    }

    // Add events
    var events = getCommerceEvents(addsToCart, removesFromCart, transactions);

    // Make the thinktime average of the specific page
    thinkTime = Math.round(thinkTime / occurences);

    return new PageVisit(new Visit(pagePath, ~~thinkTime, events), previousPagePath, ~~entrances, ~~exit, ~~occurences);
}

/**
 *  Gets the report with the dimensions and metrics.
 *
 * @param { Object } analyticsreporting the analyticsreporting object.
 * @param { Object } configuration the JSON file that contains the custom dimensions and view id for the API.
 * @param { Number } [pageToken=0] the pagetoken, default is 0.
 * @returns { Promise } returns the report.
 */
/* istanbul ignore next */
function getReport (analyticsreporting, configuration, pageToken = 0) {
    return analyticsreporting.reports.batchGet({
        requestBody: {
            reportRequests: [{
                viewId: configuration.view_id,
                dateRanges: [{
                    startDate: configuration.start_date,
                    endDate: configuration.end_date
                }],
                metrics: [
                    { expression: 'ga:pageViews' },
                    { expression: 'ga:timeOnPage' },
                    { expression: 'ga:entrances' },
                    { expression: 'ga:exits' },
                    { expression: 'ga:productAddsToCart' },
                    { expression: 'ga:productRemovesFromCart' },
                    { expression: 'ga:transactions' }
                ],
                dimensions: [
                    { name: 'ga:pagepath' },
                    { name: 'ga:previousPagePath' }
                ],
                pageToken: pageToken.toString()
            } ]
        }
    });
}
