import { Scenario } from '../../models/scenario';
import { ScenarioState } from '../../models/scenariostate';
import { calculateArrayStatistics, addPercentages } from '../statistics';

/**
 * Groups the scenario's on exact the same visit paths.
 *
 * @export
 * @param { VisitPath[] } visitpaths the visit paths.
 * @param { Object } [pageThinkTimes=null] an object that contains the ThinkTime objects per page.
 * @param { Number } [threshold=1] the threshold that indicates at what percentage the scenario needs to occur.
 * @param { Boolean } [removeOutliers=false] variable for indicating that thinktime outliers should be removed.
 * @returns { Scenario[] } returns the exact scenarios.
 */
export function createScenariosExact (visitpaths, pageThinkTimes = null, threshold = 1, removeOutliers = false) {
    var scenarios = [];

    visitpaths.forEach(function (visitPath) {
        var scenariostates = [];
        // Scenario name is used for identifying same scenario's in this case.
        var scenarioName = '';
        let previousState;

        // Create the scenario states for the visit path.
        visitPath.visits.forEach(visit => {
            // Thinktime
            let thinkTime;
            // Check if pageThinkTimes object is used.
            if (pageThinkTimes) {
                // Get think times of specific page.
                thinkTime = pageThinkTimes[visit.page];
            } else {
                let times = [];
                times.push(visit.timeOnPage);
                thinkTime = calculateArrayStatistics(times, removeOutliers);
                thinkTime.times = times;
            }

            let state = new ScenarioState(visit.page, visit.events, thinkTime, 1);
            scenariostates.push(state);

            if (previousState) {
                previousState.targets.push({ target: state.page, occurences: undefined, probability: 100 });
            }

            previousState = state;
            // Add current path to scenario name.
            scenarioName = scenarioName ? (scenarioName + ' ' + visit.page) : (visit.page);
        });

        previousState.targets.push({ target: 'abandon', occurences: undefined, probability: 100 });

        // Check if scenario exists.
        // When it exists the number of users is increased else it is added as new scenario.
        var scenario = scenarios.find(x => x.scenarioName === scenarioName);
        if (scenario) {
            scenario.scenarioStates.forEach((state, index) => {
                state.occurences++;

                // Thinktime
                if (!pageThinkTimes) {
                    let times = state.thinkTime.times;
                    times = times.concat(scenariostates[index].thinkTime.times);
                    state.thinkTime = calculateArrayStatistics(times, removeOutliers);
                    state.thinkTime.times = times;
                }

                // Add events to found scenario at the same states.
                state.addEvents(scenariostates[index].events);
                state.addEventsProbabilities();
            });

            scenario.occurences++;
        } else {
            // Add new scenario.
            scenarios.push(new Scenario(scenarioName, scenariostates, 1));
        }
    });

    // Filter
    var totalOccurences = scenarios.reduce((sum, scenario) => sum + scenario.occurences, 0);
    scenarios = scenarios.filter(scenario => scenario.occurences / totalOccurences * 100 >= threshold);

    // Add percentages, filter out the percentages below 1 and sort the scenario's on probability.
    scenarios = addPercentages(scenarios, totalOccurences);
    scenarios = scenarios.filter(scenario => scenario.probability >= 1);
    scenarios = scenarios.sort((a, b) => b.probability - a.probability);
    return scenarios;
}
