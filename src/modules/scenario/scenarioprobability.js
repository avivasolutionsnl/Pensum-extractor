import { Scenario } from '../../models/scenario';
import { UserVisit } from '../../models/uservisit';
import { PageVisit } from '../../models/pagevisit';
import { ScenarioState } from '../../models/scenariostate';
import { addPercentages } from '../statistics';

/**
 * Creates one scenario that contains the target probabilities per identical state.
 *
 * @export
 * @param { Object[] } objects contains the objects that are used for creating the scenario this can currently be VisitPaths or PageVisits.
 * @param { Object } pageThinkTimes an object that contains the ThinkTime objects per page.
 * @param { number } [threshold=1] the threshold that indicates at what percantage the target needs to occur.
 * @returns { Scenario[] } returns the scenario array with the global scenario.
 */
export function createScenariosProbability (objects, pageThinkTimes, threshold = 1) {
    var scenarioStates = [];

    if (objects[0].visits instanceof Array && objects[0].visits[0] instanceof UserVisit) {
        var visitpaths = objects;

        var entranceState = new ScenarioState('entrance');
        scenarioStates.push(entranceState);
        visitpaths.forEach(visitPath => {
            let previousState = entranceState;

            visitPath.visits.forEach(visit => {
                var state = statesTargetsFunction(scenarioStates, previousState, visit, pageThinkTimes);
                previousState = state;
            });

            var abandonTarget = previousState.targets.find(target => target.target === 'abandon');
            if (abandonTarget) {
                abandonTarget.occurences++;
            } else {
                previousState.targets.push({ target: 'abandon', occurences: 1 });
            }
        });
    } else if (objects[0] instanceof PageVisit) {
        var visits = objects;

        visits.forEach(visit => {
            let previousState = scenarioStates.find(state => state.page === visit.previousPage);
            if (!previousState) {
                previousState = new ScenarioState(visit.previousPage, [], pageThinkTimes[visit.previousPage], visit.occurences);
                scenarioStates.push(previousState);
            }

            var state = statesTargetsFunction(scenarioStates, previousState, visit, pageThinkTimes);

            if (visit.exits > 0) {
                var abandonTarget = state.targets.find(target => target.target === 'abandon');
                if (abandonTarget) {
                    abandonTarget.occurences += visit.exits;
                } else {
                    state.targets.push({ target: 'abandon', occurences: visit.exits });
                }
            }
        });
    } else {
        throw new Error('Incorrect objects');
    }

    scenarioStates.forEach(state => {
        state.addEventsProbabilities();

        // Filter
        var totalOccurences = state.targets.reduce((sum, target) => sum + target.occurences, 0);
        state.targets = state.targets.filter(target => target.occurences / totalOccurences * 100 >= threshold);
    });

    // Calculate probabilities for each state and return.
    var scenarios = [];
    var scenario = addPercentagesToScenarioStateTargets(new Scenario('Global', scenarioStates, undefined, 100));
    scenarios.push(scenario);
    return scenarios;
}

/**
 * Adds the percentages to the scenariostate targets and ensures that the scenariostate can be hit.
 *
 * @export
 * @param { Scenario } scenario
 * @returns { Scenario }  the scenario with percentages
 */
export function addPercentagesToScenarioStateTargets (scenario) {
    var allTargets = [];

    scenario.scenarioStates.forEach(scenarioState => {
        var targets = scenarioState.targets;
        var totalOccurences = targets.reduce((sum, target) => sum + target.occurences, 0);
        targets = addPercentages(targets, totalOccurences);
        scenarioState.targets = targets.filter(target => target.probability > 0);
        allTargets = allTargets.concat(scenarioState.targets);
    });

    // Filter states that can never be hit.
    scenario.scenarioStates = scenario.scenarioStates.filter(state => {
        if (state.page === 'entrance') { return true; }

        // Check if the state can be reached by the entrance state.
        return checkIfReachableState(state, scenario.scenarioStates);
    });
    return scenario;
}

/**
 * Checks if the state can be reached by the entrance state, else it is useless in the scenario because it cannot be reached.
 * For each different state it will search for other states where it is targeted.
 * Then it checks if one of the found states or targets of the found states is the entrance state and conclude that the state can be hit from the entrance.
 *
 * @param { ScenarioState } state the state that needs to be checked if it is reachable.
 * @param { ScenarioState[] } states all the scenario states.
 * @returns
 */
function checkIfReachableState (state, states) {
    /* var alreadyFound = [];
    alreadyFound.push(state.page);

    var queue = states.filter(s => s.targets.find(target => target.target === state.page));
    while (queue.length > 0) {
        state = queue.shift();
        if (state.page === 'entrance') {
            return true;
        }

        alreadyFound.push(state.page);
        var childStates = states.filter(s => {
            return s.targets.find(target => target.target === state.page) && !alreadyFound.includes(s.page);
        });
        queue = [...queue, ...childStates];
    }
    return false; */

    var found = false;
    var currentStates = [];
    // Recursive function for finding the entrance state and so concluding that it can be hit.
    function recursive (state) {
        // Find the states that lead to the specific state, this does not include states that are already found because of recursive loop.
        var foundStates = states.filter(s => {
            return s.targets.find(target => target.target === state.page) && !currentStates.includes(s.page);
        });

        for (let i = 0; i < foundStates.length; i++) {
            // Check if entrance state is hit and exit loop.
            if (foundStates[i].page === 'entrance') {
                found = true;
                break;
            }

            // Find entrance state with new state.
            // The current states fixes that the method is not looping.
            currentStates.push(foundStates[i].page);
            // Check if the state has the entrance state target.
            recursive(foundStates[i]);
            // Break loop because entrance is already found.
            if (found) {
                break;
            }
        }
    }

    recursive(state);
    return found;
}

/**
 * Gets the state and target for the visit, if the state or target doesn't exit it will create one.
 *
 * @param { ScenarioState[] } scenarioStates the states of the scenario that is created.
 * @param { ScenarioState } previousState the previous state.
 * @param { Visit } visit the visit.
 * @param { Object } pageThinkTimes an object that contains the ThinkTime objects per page.
 * @returns { ScenarioState } returns the ScenarioState of the visit.
 */
function statesTargetsFunction (scenarioStates, previousState, visit, pageThinkTimes) {
    let state, target;
    state = scenarioStates.find(state => state.page === visit.page);
    target = previousState.targets.find(target => target.target === visit.page);

    // Add state if it doesn't exists in previous target.
    if (!state) {
        state = new ScenarioState(visit.page, visit.events, pageThinkTimes[visit.page], 1);
        scenarioStates.push(state);
    } else {
        // Add events to state if it doesn't exist.
        state.occurences++;
        state.addEvents(visit.events);
    }

    var occurences = 1;
    if (visit.occurences) {
        occurences = visit.occurences;
    }

    if (!target) {
        previousState.targets.push({ target: state.page, occurences: occurences });
    } else {
        // Increment target occurences
        target.occurences += occurences;
    }

    return state;
}
