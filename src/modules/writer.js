import XMLWriter from 'xml-writer';
import fs from 'fs';
import libxml from 'libxmljs';
import { Graph } from 'graphlib';
import dot from 'graphlib-dot';
import del from 'del';
import { calculateArrayStatistics } from './statistics';

/**
 * Exports the array of VisitPath objects to different DOT graphs.
 *
 * @export
 * @param {VisitPath[]} visitPaths the array of visit paths
 * @param {string} [folderLocation='./extractor/files/graphs/'] the folder location the files are saved to.
 */
export function writeVisitPathGraph (visitPaths, folderLocation = './files/graphs/') {
    if (!fs.existsSync(folderLocation)) {
        const err = `Cannot write visit graph graph, path does not exist: "${folderLocation}"`;
        console.error(err);
        throw Error(err);
    }

    del.sync([folderLocation + '*.dot']);

    visitPaths.forEach((visitPath, index) => {
        var digraph = new Graph();

        digraph.setNode('entrance', { shape: 'plaintext' });
        var previousNode = 'entrance';
        var step = 1;
        visitPath.visits.forEach(visit => {
            digraph.setNode(visit.page);
            var edge = digraph.edge(previousNode, visit.page);
            if (edge) {
                edge.label += ' ' + step + '. ' + 'navigate';
            } else {
                digraph.setEdge(previousNode, visit.page, { label: ' ' + step + '. ' + 'navigate' });
            }
            previousNode = visit.page;
            step++;

            if (visit.events && visit.events.length >= 1) {
                var ownEdge = digraph.edge(visit.page, visit.page);
                if (!ownEdge) {
                    digraph.setEdge(visit.page, visit.page, { label: ' ' + step + '. ' });
                    ownEdge = digraph.edge(visit.page, visit.page);
                } else {
                    ownEdge.label += ' ' + step + '. ';
                }

                step++;
                visit.events.forEach(event => {
                    if (!ownEdge.label.includes(event)) { ownEdge.label += event.name + ';'; }
                });
            }
        });
        digraph.setNode('exit', { shape: 'plaintext' });
        digraph.setEdge(previousNode, 'exit', { label: ' ' + step + '. ' + 'navigate' });

        fs.writeFileSync(folderLocation + 'graph_' + index + '.dot', dot.write(digraph));
    });
    console.log('visit graphs saved to ' + folderLocation + ' directory.');
}

/**
 * Exports the array of scenario objects to different DOT graphs.
 *
 * @export
 * @param {Scenario[]} scenarios the array of scenarios
 * @param {string} [folderLocation='./files/scenarios/'] the folder location the files are saved to.
 * @returns List of created files
 */
export function writeScenarioGraphs (scenarios, folderLocation = './files/scenarios/') {
    if (!fs.existsSync(folderLocation)) {
        const err = `Cannot write scenario graph, path does not exist: "${folderLocation}"`;
        console.error(err);
        throw Error(err);
    }

    del.sync([folderLocation + '*.dot']);

    const filenames = [];
    scenarios.forEach((scenario, index) => {
        var digraph = new Graph();
        scenario.scenarioStates.forEach(function (state) {
            if (state.events && state.events.length >= 1) {
                var edge = digraph.edge(state.page, state.page);
                if (!edge) {
                    digraph.setEdge(state.page, state.page, { label: ' ' });
                    edge = digraph.edge(state.page, state.page);
                } else {
                    edge.label += ' ';
                }

                state.events.forEach(event => {
                    if (!edge.label.includes(event)) { edge.label += event.probability + '%:' + event.name + ';'; }
                });
            }

            state.targets.forEach(function (target) {
                var edge = digraph.edge(state.page, target.target);
                if (edge) {
                    edge.label += ' ' + target.probability + '% navigate';
                } else {
                    digraph.setEdge(state.page, target.target, { label: ' ' + target.probability + '% navigate' });
                }
            });
        });

        const filename = `${folderLocation}scenario_graph${index}.dot`;
        fs.writeFileSync(filename, dot.write(digraph));
        filenames.push(filename);
    });

    return filenames;
}

/**
 * Creates an xml of the scenarios for exporting.
 *
 * @export
 * @param { Scenario[] } scenarios the scenarios.
 * @param {string} [xmlDefinitionfile='./files/scenarios_definition.xsd'] The location of the xsd file.
 * @param {string} [file='./scenarios.xml'] the file the xml is saved to.
 */
export function writeScenariosXML (scenarios, xmlDefinitionfile = './files/scenarios_definition.xsd', file = './scenarios.xml') {
    if (!fs.existsSync(xmlDefinitionfile)) {
        const err = `Cannot find xml definition file: "${xmlDefinitionfile}"`;
        console.error(err);
        throw Error(err);
    }

    // create xml
    var xw = new XMLWriter(true);
    xw.startDocument();
    xw.startElement('scenarios');
    scenarios.forEach(function (scenario) {
        xw.startElement('scenario');
        xw.writeAttribute('scenarioName', scenario.scenarioName);
        xw.writeAttribute('nrOfUsers', scenario.occurences);
        xw.writeAttribute('probability', scenario.probability);

        xw.startElement('states');
        if (scenario.scenarioStates) {
            scenario.scenarioStates.forEach(function (scenarioState) {
                writeScenarioState(xw, scenarioState);
            });
        }
        xw.endElement();
        xw.endElement();
    });

    xw.endElement();
    xw.endDocument();

    // Validation
    var xsdDoc = libxml.parseXml(fs.readFileSync(xmlDefinitionfile, 'utf8'));
    var xmlParsed = libxml.parseXml(xw);

    if (xmlParsed.validate(xsdDoc)) {
        fs.writeFileSync(file, xw);
        console.log(file + ' saved!');
    } else {
        console.log(xmlParsed.validationErrors);
    }
}

function writeScenarioState (xw, state) {
    xw.startElement('state');
    xw.writeAttribute('path', state.page);
    xw.writeAttribute('probability', state.probability);

    var thinkTime = state.thinkTime;
    if (thinkTime && !thinkTime.avg && thinkTime.times) {
        thinkTime = calculateArrayStatistics(thinkTime.times);
    }

    if (thinkTime) {
        xw.writeAttribute('avgThinkTime', thinkTime.avg);
        xw.writeAttribute('stdThinkTime', thinkTime.std);
        xw.writeAttribute('minThinkTime', thinkTime.min);
        xw.writeAttribute('maxThinkTime', thinkTime.max);
    }

    // write events
    if (state.events) {
        xw.startElement('events');
        state.events.forEach(event => writeEvent(xw, event));
        xw.endElement();
    }

    // write targets
    if (state.targets) {
        xw.startElement('targets');
        state.targets.forEach(target => writeScenarioTarget(xw, target));
        xw.endElement();
    }

    xw.endElement();
}

function writeEvent (xw, event) {
    xw.startElement('event');
    xw.writeAttribute('name', event.name);
    xw.writeAttribute('probability', event.probability);
    xw.endElement();
}

function writeScenarioTarget (xw, target) {
    xw.startElement('target');
    xw.writeAttribute('name', target.target);
    xw.writeAttribute('probability', target.probability);
    xw.endElement();
}

/**
 * Writes the scenarios array to a json file.
 * Will be written to the src directory because of relative directory's when running K6.
 *
 * @export
 * @param { Scenario[] } scenarios the scenarios array.
 * @param {string} [file='./scenarios.json'] the file that the scenarios are saved to.
 * @returns written filename
 */
export function writeScenariosJSON (scenarios, file = './scenarios.json') {
    var jsonContent = JSON.stringify(scenarios, null, 4);
    fs.writeFileSync(file, jsonContent, 'utf8');
    return file;
}
