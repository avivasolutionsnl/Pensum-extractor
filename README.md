# Pensum Extractor
The Pensum-extractor tool distills a load-test scenario out of historical Google Analytics data.

> Pensum-extractor is part of the Pensum toolset which helps you extract, model, and run realistic load-tests.
An extracted scenario can be run using [Pensum-runner](https://github.com/avivasolutionsnl/pensum-runner).

Using historical data gives you the advantage of creating a realistic load-test. A realistic load-test is defined as:
1. all (visited) pages are present
2. not visited pages and thus irrelevant pages are *not* present
3. the probability of visiting a certain page is modelled and matches reality
4. the path, ie. order of pages and actions, that users take through your site matches reality

As historical data quickly grows too large to manually inspect, the only way to extract a test from it is automatically and *that* is where Pensum-extractor comes into play.

The current Pensum-extractor implementation uses Google Analytics (GA) as data source. Although other datasources could be used, 
GA is considered to be the most widely used website analytics tool and therefore chosen at first.

## Usage
First provide your Google Analytics authentication details, metrics and dimensions in a configuration file. An example configuration file is available [here](./files/configuration.json), see [configuration](#configuration) for a full description of the options.

Run `extract` with arguments, e.g:

```
> npm run extract -- --configuration <configuration.json>
```

This will create a JSON file with the scenarios. To make a scenario executable, using [Pensum-runner](https://github.com/avivasolutionsnl/pensum-runner), you will need to convert it to a workload model which the runner can handle.

> See [Pensum-runner](https://github.com/avivasolutionsnl/pensum-runner) for the workload model definition

A minimal example of Google Analytics input and its resulting output can be found in [this test](./test/pagevisits/scenario.js).

### Convert to a Pensum workload model
As the Pensum runner executes a workload model, you will need to convert the scenarios from the JSON file to a workload model.
Pensum extractor provides a `createWorkloadFromScenario` (see [workload.js](./src/workload.js)) function that helps you with it, for example:
```
const scenarios = JSON.parse(fs.readFileSync(<YOUR SCENARIOS JSON FILE>).toString())
const myScenario = scenarios[0]
const workload = createWorkloadFromScenario(myScenario, mapPageToFun, mapEventToFun)

function mapPageToFun(page) {
    switch(page) {
        case '/':
            return () => console.log(`Visit ${page} page`)
        case 'abandon':
        case 'entrance':
            return () => console.log(page)
        default:
            return null
    }
}

function mapEventToFun(event) {
    switch(event) {
        case 'adds-to-cart':
            return () => console.log('Add item to cart')
        default:
            return null
    }
}
```
See [here](./test/pagevisits/workload.js) for a full example.

The `mapPageToFun` and `mapEventToFun` functions map to functions that will be performed once a page is visited and/or when an event is triggered. In other words these are functions that you, as developer, need to implement to make the load-test functional. See [here](https://github.com/avivasolutionsnl/pensum-runner#Usage) for a more detailed explanation and example.

## Configuration
The strategy for getting the data and creating the scenarios is provided using CLI arguments. By default the *probability* strategy is used.

All other options are provided using a configuration file.

### Strategies
#### Probability strategy
For generating the scenarios multiple options can be provided. By default Google Analytics (without custom dimensions) and the *probability* method is used. The *probability* method models the likelihood that a certain page is visited. To determine the probability that a user visits another page, it simply divides the number of times a next page is visited by the total outgoing visits. 

The *probability* method does not take previously visited pages into account which results in always outputting a single scenario. Note that not taking the full visit path into account might lead to inaccurate results. In case this is not accurate enough for your situation, consider using the (more complex) exact strategy.

#### Exact strategy
The exact method takes the complete path of a visitor into account to calculate the probability of visiting a next page.

To distinguish unique visit paths, 2 custom dimensions need to be added to the [Google Tag Manager](https://tagmanager.google.com/):
- `configuration.dimensions.userID`: a unique id per visitor
- `configuration.dimensions.date`: a precise timestamp (which allows fine grained ordering of page visits/events)

Using these two GA dimensions you can get more accurate results. Opposite to the default method we can now determine multiple scenarios, because unique ids allows to distinguish unique visit paths.

To use the custom dimensions use the `--data` CLI option:
```
> npm run extract -- --configuration <configuration.json> --data ga-custom
```

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
