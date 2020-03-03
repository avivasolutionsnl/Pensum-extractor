import { createScenariosExact } from './scenario/scenarioexact';
import { createScenariosProbability } from './scenario/scenarioprobability';
import { createVisitPaths } from './visitpath';
import { importVisits as importCustomVisits } from './import/gaCustom';
import { importVisits } from './import/ga';
import { writeScenariosXML, writeScenariosJSON, writeVisitPathGraphs, writeScenarioGraphs } from './writer';
import { getThinkTimesForEachPage } from './statistics';

/**
 * Creates the scenarios with given options.
 *
 * @param { String } dataOption option for getting the data. (ga-custom, ga).
  * @param { Number } threshold threshold number that indicates at what percentage the scenario or scenariostate target needs to occur.
 * @param { Object } customConfiguration custom configuration that is used for export and/or google analytics settings.
 * @param { Function } toGenericPagePath combine multiple page paths into one or more generic paths
 */
export async function getScenarios (dataOption = 'ga', threshold, customConfiguration, toGenericPagePath = (p) => p) {
    console.log('Data: ' + dataOption);

    let configuration = require('../../files/configuration.json');
    if (customConfiguration) {
        configuration = require(`${customConfiguration}`);
    }

    if (!configuration) {
        throw new Error('missing configuration file.');
    }

    let scenarios;
    if (dataOption === 'ga-custom') {
        scenarios = await importUserVisits(configuration, threshold, toGenericPagePath);
    } else if (dataOption === 'ga') {
        scenarios = await importPageVisits(configuration, threshold, toGenericPagePath);
    } else {
        throw new Error('No option found for data ' + dataOption);
    }

    // Writes the graphs of the scenario's.
    if (configuration.exportOptions.writeScenarioGraphs) {
        const files = writeScenarioGraphs(scenarios);
        console.log(`Created the following graph files: ${JSON.stringify(files)}`);
    }

    // Writes the scenario's to XML.
    if (configuration.exportOptions.xml) {
        writeScenariosXML(scenarios);
    }

    const jsonFile = writeScenariosJSON(scenarios);
    console.log(`Created the following scenarios JSON file: ${jsonFile}`);
}

async function importUserVisits (configuration, threshold, toGenericPagePath) {
    const visits = await importCustomVisits(configuration, toGenericPagePath);

    var thinkTimes = null;
    // Calculates the think times per page instead of per state.
    if (configuration.exportOptions.thinkTimesPerPage) {
        thinkTimes = getThinkTimesForEachPage(visits, configuration.exportOptions.removeOutliers);
    }

    var visitPaths = createVisitPaths(visits);

    // Generates the visit graphs with DOT language.
    if (configuration.exportOptions.writeVisitGraphs) {
        writeVisitPathGraphs(visitPaths);
    }

    return createScenariosExact(visitPaths, thinkTimes, threshold, configuration.exportOptions.removeOutliers);
}

async function importPageVisits (configuration, threshold, toGenericPagePath) {
    const visits = await importVisits(configuration, toGenericPagePath);

    var thinkTimes = getThinkTimesForEachPage(visits, configuration.exportOptions.removeOutliers);
    return createScenariosProbability(visits, thinkTimes, threshold);
}
