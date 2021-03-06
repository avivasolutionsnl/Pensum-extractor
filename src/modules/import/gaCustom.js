import { UserVisit } from '../../models/uservisit';
import { Visit } from '../../models/visit';
import { importData, cleanPagePath, getCommerceEvents } from './googleanalytics';

/**
 * Gets all the user visits
 *
 * @export
 * @param { Object } configuration
 * @param { Function } toGenericPagePath
 * @param { Array } GA data elements
 * @returns { UserVisit[] } returns the visits.
 */
/* istanbul ignore next */
export async function importVisits (configuration, toGenericPagePath, data = null) {
    if (!data) {
        data = await importData(configuration, getReport);
    }

    return data.map(e => convertToUserVisit(e, toGenericPagePath));
}

/**
 *  Converts the google analytics data row to a user visit.
 *
 * @param { object } element the google analytics row.
 * @returns { UserVisit } the created UserVisit object.
 */
export function convertToUserVisit (element, toGenericPagePath = (p) => p) {
    // Get all the dimensions out of the element.
    var userSessionID = element.dimensions[0];
    var sessionNumber = element.dimensions[2];
    var pagePath = element.dimensions[3].toLowerCase();

    // Get all the metrics out of the element.
    var thinkTime = element.metrics[0].values[1];
    var addsToCart = element.metrics[0].values[4];
    var removesFromCart = element.metrics[0].values[5];
    var transactions = element.metrics[0].values[6];

    // Create identifier from user ID and session number.
    var identifier = userSessionID + '_' + sessionNumber;

    // cleaning
    pagePath = toGenericPagePath(cleanPagePath(pagePath));

    // Add events
    var events = getCommerceEvents(addsToCart, removesFromCart, transactions);

    return new UserVisit(new Visit(pagePath, ~~thinkTime, events), identifier);
}

/**
 *  Gets the report with the dimensions and metrics.
 *  The results are sorted with userID, sessionCount, date, entrances (DESCENDING) and exits.
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
                    { name: configuration.dimensions.userID },
                    { name: configuration.dimensions.date },
                    { name: 'ga:sessionCount' },
                    { name: 'ga:pagepath' },
                    { name: 'ga:previousPagePath' }
                ],
                orderBys: [
                    { fieldName: configuration.dimensions.userID },
                    { fieldName: 'ga:sessionCount' },
                    { fieldName: configuration.dimensions.date }, // Sorted by date, so we do not need to inspect the previous path for this
                    { fieldName: 'ga:entrances', sortOrder: 'DESCENDING' },
                    { fieldName: 'ga:exits' }
                ],
                pageToken: pageToken.toString()
            } ]
        }
    });
}
