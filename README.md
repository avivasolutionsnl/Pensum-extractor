# Extractor
The extractor is used for getting the workload model out of the historical data. The current implementation uses Google Analytics data.

## Generation of test scenarios
Run `run-export` with arguments, e.g:

```
> npm run run-export -- --data ga-custom --generate exact --configuration extractor-configuration.json
> npm run run-export -- --data ga-custom --generate probability --configuration extractor-configuration.json
> npm run run-export -- --data ga --configuration extractor-configuration.json
```

This will create the JSON file and optional a XML file. The JSON file is used to run K6 with, while the XML file can be used to look into the scenarios.

To change Google Analytics authentication details, metrics and dimensions and/or sitemap locations for product and categories a configuration file in JSON format can be passed to the script.

## Generation options
For generating the scenarios multiple options can be provided. The strategy for getting the data and creating the scenarios can be provided with arguments.
Google Analytics settings, export options and sitemap options are provided with a custom configuration file.

### Config file
Google Analytics authentication settings can be set in a custom configuration file.

```json
"analytics": {
    "private_key": "privatekey",
    "client_email": "clientemail",
    "view_id": "viewid",
    "start_date": "30daysAgo",
    "end_date": "today",
    "dimensions": {
      "userID": "ga:dimensionX",
      "loggedIn": "ga:dimensionX",
      "date": "ga:dimensionX"
    }
}
```

Sitemaps can also be set in the config file.

```json
"sitemap": {
    "productURL": "url",
    "categoriesURL": "url"
}
```

Export settings:
- xml option: writes the scenarios to a xml file.
- write visit graphs option: writes visit graphs showing the visits of a session in DOT language. The visits graphs are written to `./extractor/files/graphs`
- write scenario graphs option: writes scenario graphs showing the scenarios in DOT language. The scenario graphs are written to `./extractor/files/graphs`
- use sitemap option: specifies if the sitemap must be used for making products and categories generic.
- think times per page option: specifies if the thinktimes must be calculated with the distribution per page instead of per state.
    - Per page calculating collects the thinktime distribution of each page, when a page occurs in a state the thinktime distribution of that specific page is used.
    - Per state thinktime distribution is collection and calculating the distribution of the same state in a scenario. The disadvantage of this is that the distribution can have only a few samples.
- remove outliers option: Specifies if the outliers from the thinktimes distribution need to be removed.

```json
"exportOptions": {
    "xml": true,
    "writeVisitGraphs": false,
    "writeScenarioGraphs": false,
    "useSitemap": true,
    "thinkTimesPerPage": true,
    "removeOutliers": true
}
```

### Arguments
- data option: provided with --data, current options: 'ga-custom (with custom dimensions), ga'
- generate option: provided with --generate, current options: 'exact (only for ga)', 'probability'
- configuration option: provided with --configuration, this is used to pass a configuration file. Currently this path is relative from `./extractor/src/index.js`

## Code quality.
Code quality is ensured with eslint in this project.

The following command can be executed with a file:
```
> npx eslint *file*
```

Or install the visual studio code plugin for eslint to ensure code quality.

## Tests
Testing is done with Mocha in this project.

The following command executes all the tests:
```
> npm test
```

When testing a specific file the following command can be used.
```
> npx mocha --require @babel/register *file*
```
