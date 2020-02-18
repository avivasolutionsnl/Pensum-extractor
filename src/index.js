import { createScenariosExact } from './modules/scenario/scenarioexact';
import { createScenariosProbability } from './modules/scenario/scenarioprobability';
import { createVisitPaths } from './modules/visitpath';
import { importVisits as importCustomVisits } from './modules/import/gaCustom';
import { importVisits } from './modules/import/ga';
import { writeScenariosXML, writeScenariosJSON, writeVisitPathGraph, writeScenarioGraph } from './modules/writer';
import { getThinkTimesForEachPage } from './modules/statistics';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));
// Data option, generate option, treshold and configuration
getScenarios(args.data, args.generate, 1, args.configuration);

/**
 * Creates the scenarios with given options.
 *
 * @param { String } dataOption option for getting the data. (ga-custom, ga).
 * @param { String } generateOption option for generating the scenarios. (exact, probability)
 * @param { Number } threshold threshold number that indicates at what percentage the scenario or scenariostate target needs to occur.
 * @param { Object } customConfiguration custom configuration that is used for export and/or google analytics settings.
 */
function getScenarios (dataOption = 'ga', generateOption = 'probability', threshold, customConfiguration) {
    console.log('Data: ' + dataOption + ', Generate: ' + generateOption);

    var configuration = require('../files/configuration.json');
    if (customConfiguration) {
        configuration = require(`${customConfiguration}`);
    }

    if (!configuration) {
        throw new Error('missing configuration file.');
    }

    var scenarios;
    if (dataOption === 'ga-custom') {
        // User visits
        importCustomVisits(configuration).then(visits => {
            var thinkTimes = null;
            // Calculates the think times per page instead of per state.
            if (configuration.exportOptions.thinkTimesPerPage || generateOption === 'probability') { thinkTimes = getThinkTimesForEachPage(visits, configuration.exportOptions.removeOutliers); }

            var visitPaths = createVisitPaths(visits);
            // Generates the visit graphs with DOT language.
            if (configuration.exportOptions.writeVisitGraphs) { writeVisitPathGraph(visitPaths); }

            if (generateOption === 'exact') {
                scenarios = createScenariosExact(visitPaths, thinkTimes, threshold, configuration.exportOptions.removeOutliers);
            } else if (generateOption === 'probability') {
                scenarios = createScenariosProbability(visitPaths, thinkTimes, threshold);
            } else {
                throw new Error('No option found for generate ' + generateOption);
            }

            // Writes the graphs of the scenario's.
            if (configuration.exportOptions.writeScenarioGraphs) { writeScenarioGraph(scenarios); }
            // Writes the scenario's to XML.
            if (configuration.exportOptions.xml) { writeScenariosXML(scenarios); }
            writeScenariosJSON(scenarios);
        });
    } else if (dataOption === 'ga') {
        // Page visits
        importVisits(configuration).then(visits => {
            var thinkTimes = getThinkTimesForEachPage(visits, configuration.exportOptions.removeOutliers);
            scenarios = createScenariosProbability(visits, thinkTimes, threshold);

            // Writes the graphs of the scenario's.
            if (configuration.exportOptions.writeScenarioGraphs) { writeScenarioGraph(scenarios); }
            // Writes the scenario's to XML.
            if (configuration.exportOptions.xml) { writeScenariosXML(scenarios); }
            writeScenariosJSON(scenarios);
        });
    } else {
        throw new Error('No option found for data ' + dataOption);
    }
}
