import { google } from 'googleapis';
import { Event } from '../models/event';
import { XMLHttpRequest } from 'xmlhttprequest';
import xml2js from 'xml2js';

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
export async function exportData (configuration, getReport, convertToVisit) {
    var analyticsreporting = authenticate(configuration);

    var products, categories;
    if (configuration.exportOptions.useSitemap && configuration.sitemap.productURL && configuration.sitemap.categoriesURL) {
        products = getProductsFromSitemap(configuration.sitemap.productURL);
        categories = getCategoriesFromSitemap(configuration.sitemap.categoriesURL);
    }

    var visits = [];
    var result = await getReport(analyticsreporting, configuration.analytics);
    var report = result.data.reports[0];
    report.data.rows.forEach(function (element) {
        visits.push(convertToVisit(element, products, categories));
    });

    while (report.nextPageToken) {
        result = await getReport(analyticsreporting, configuration.analytics, report.nextPageToken);
        report = result.data.reports[0];
        report.data.rows.forEach(function (element) {
            visits.push(convertToVisit(element, products, categories));
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
export function cleanPagePath (pagePath, products, categories) {
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

    // Convert pagePath to generic product or category page.
    if (products && categories) { pagePath = convertPathToGenericProducOrCategoryPath(pagePath, products, categories); }

    return pagePath;
}

/**
 * Executes http request to the specified URL.
 *
 * @export
 * @param { String } url the url.
 * @returns { XMLHttpRequest } the result of the request.
 */
export function httpRequest (url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.setRequestHeader('Content-Type', 'text/xml');
    request.timeout = 4000;
    request.send();

    return request;
}

/**
 * Gets the products from the sitemap.
 *
 * @export
 * @param { String } sitemapURL URL to the product sitemap.
 * @returns { String[] } list of all product paths.
 */
export function getProductsFromSitemap (sitemapURL) {
    var request = httpRequest(sitemapURL);
    var products = [];

    if (request.status !== 200) {
        console.log('Can\'t load product sitemap from ' + sitemapURL + ', product recognition won\'t work.');
        return products;
    }

    xml2js.parseString(request.responseText, function (err, result) {
        /* istanbul ignore next */
        if (err) { throw err; }
        if (result && result.urlset && result.urlset.url) {
            result.urlset.url.forEach(element => {
                // Get last part of product url
                products.push(element.loc[0].match(/http[s]?:\/\/.*(\/.*)/)[1]);
            });
        }
    });

    return products;
}

/**
 * Gets the categories from the sitemap.
 *
 * @export
 * @param { String } sitemapURL URL to the category sitemap.
 * @returns { String[] } list of all category paths.
 */
export function getCategoriesFromSitemap (sitemapURL) {
    var request = httpRequest(sitemapURL);
    var categories = [];

    if (request.status !== 200) {
        console.log('Can\'t load category sitemap from ' + sitemapURL + ', category recognition won\'t work.');
        return categories;
    }

    xml2js.parseString(request.responseText, function (err, result) {
        /* istanbul ignore next */
        if (err) { throw err; }
        if (result && result.urlset && result.urlset.url) {
            result.urlset.url.forEach(element => {
                // Get last part of url without language part which contains the category or multiple categories
                var path = element.loc[0].match(/http[s]?:\/\/.*?(\/.*)/)[1];
                if (path.toLowerCase().includes('en/') || path.toLowerCase().includes('nl-nl/')) {
                    path = path.match(/\/.*?(\/.*)/)[1];
                }

                if (path !== '/') {
                    categories.push(path);
                }
            });
        }
    });

    return categories;
}

/**
 * Converts a path to a generic /product or /category path.
 *
 * @export
 * @param { String } path the path that is used.
 * @param { String[] } products the products array.
 * @param { String[] } categories the categories array.
 * @returns { String } returns the new path.
 */
export function convertPathToGenericProducOrCategoryPath (path, products, categories) {
    var extractedPathLevels = path.split('/').filter(x => x);
    if (path.length !== 1) {
        if (products.find(x => x.includes(path.substring(path.lastIndexOf('/') + 1, path.length)))) {
            path = '/product';
        } else if (categories.find(x => new RegExp(extractedPathLevels[0] + '([/]|$)', 'g').test(x))) {
            path = '';
            extractedPathLevels = extractedPathLevels.reverse();
            extractedPathLevels.forEach(pathLevel => {
                if (categories.find(x => x.includes(pathLevel))) {
                    if (!path.includes('category')) {
                        path = '/category' + path;
                    }
                } else if (pathLevel.includes('sortby') || pathLevel.includes('page')) {
                    path = '/' + pathLevel + path;
                }
            });
        }
    }
    return path;
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
