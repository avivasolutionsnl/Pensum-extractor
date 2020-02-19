# Extractor
The extractor is used for distilling a load-test scenario out of the historical data. The current implementation uses Google Analytics data.
The extracted scenario can be run using [Pensum-runner](https://github.com/avivasolutionsnl/pensum-runner).

## Usage
First provide your Google Analytics authentication details, metrics and dimensions in a configuration file. An example configuration file is available [here](./files/configuration.json), see [configuration](#configuration) for a full description of the options.

Run `extract` with arguments, e.g:

```
> npm run extract -- --configuration <configuration.json>
```

This will create a JSON file holding the scenarios that can be run using [Pensum-runner](https://github.com/avivasolutionsnl/pensum-runner).

A minimal example of Google Analytics input and its resulting output can be found in [this test](./test/pagevisits/scenario.js).

// TODO: how to run with pensum-runner?

## Configuration
For generating the scenarios multiple options can be provided. The strategy for getting the data and creating the scenarios is provided using CLI arguments. 
By default Google Analytics (without custom dimensions) and the probability method is used. Using this method you will get one scenario.

### Algorithm selection
By adding 2 custom dimensions to [Google Tag Manager](https://tagmanager.google.com/):
- `configuration.dimensions.userID`: a unique id per visitor
- `configuration.dimensions.date`: a precise timestamp (which allows fine grained ordering of page visits/events)

Using these two GA dimensions you can get more accurate results. Opposite to the default method we can now determine multiple scenarios, because unique ids allows to distinguish unique visit paths.

To use the custom dimensions use the `--data` CLI option:
```
> npm run extract -- --configuration <configuration.json> --data ga-custom
```

Other options are provided using a configuration file.

### Google Analytics
Google Analytics authentication settings can be set in the configuration file, for example:

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

### Export settings
Export settings, configured using the config file, are:
- `xml`: writes the scenarios to a xml file.
- `writeVisitGraphs`: writes visit graphs showing the visits of a session in DOT language. The visits graphs are written to [./files/graphs]().
- `writeScenarioGraphs`: writes scenario graphs showing the scenarios in DOT language. The scenario graphs are written to [./files/graphs]().
- `thinkTimesPerPage`: specifies if the thinktimes must be calculated with the distribution per page instead of per state.
    - Per page calculating collects the thinktime distribution of each page, when a page occurs in a state the thinktime distribution of that specific page is used.
    - Per state thinktime distribution is collection and calculating the distribution of the same state in a scenario. The disadvantage of this is that the distribution can have only a few samples.
- `removeOutliers`: Specifies if the outliers from the thinktimes distribution need to be removed.

### Generic page paths
When you have a lot of pages you might want to generalize several pages into one. For example when you have a product page with multiple variants you might want to
combine that into one page for simplicity. 
You can combine multiple page paths into one by implementing your own script that invokes `getScenarios` and pass a custom `toGenericPagePath` function.
See [index.js](./src/index.js) for an example.


## Tests
The following command executes all the tests:
```
PS> npm test
```

When testing a specific file the following command can be used:
```
PS> npx mocha --require @babel/register *file*
```

Code quality is ensured using ESlint, execute it using:
```
PS> npx eslint *file*
```
