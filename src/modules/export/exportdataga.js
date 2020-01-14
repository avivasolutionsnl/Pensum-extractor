import { PageVisit } from '../../models/pagevisit';
import { Visit } from '../../models/visit';
import { exportData, cleanPagePath, getCommerceEvents } from '../googleanalytics';

const entranceValue = '(entrance)';

/**
 * Calls the export data function that gets all the visits, the custom getReport() and convertToPageVisit() are passed.
 *
 * @export
 * @param { Object } configuration the configuration that is used for Google Analytics.
 * @returns { PageVisit[] } returns the visits.
 */
/* istanbul ignore next */
export async function exportDataGa (configuration) {
    var visits = await exportData(configuration, getReport, convertToPageVisit);
    return visits;
}

/**
 *  Converts the google analytics data row to a page visit.
 *
 * @param { object } element the google analytics row.
 * @returns { PageVisit } the created PageVisit object.
 */
export function convertToPageVisit (element, products, categories) {
    // Get all the dimensions out of the element.
    var pagePath = element.dimensions[0].toLowerCase();
    var previousPagePath = element.dimensions[1].toLowerCase();

    // Get all the metrics out of the element.
    var occurences = element.metrics[0].values[0];
    var thinkTime = element.metrics[0].values[1];
    var entrances = element.metrics[0].values[2];
    var exit = element.metrics[0].values[3];
    var addsToCart = element.metrics[0].values[4];
    var removesFromCart = element.metrics[0].values[5];
    var transactions = element.metrics[0].values[6];

    // cleaning
    pagePath = cleanPagePath(pagePath, products, categories);
    previousPagePath = cleanPagePath(previousPagePath, products, categories);
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
                    { name: 'ga:previousPagePath' },
                    { name: configuration.dimensions.userID }
                ],
                pageToken: pageToken.toString()
            } ]
        }
    });
}
