
/**
 * The scenario that can be used for the load test.
 * Contains the name of the scenario, number of users and the scenario states.
 *
 * @export
 * @class Scenario
 */
export class Scenario {
    /**
     * Creates an instance of Scenario.
     * @param { String } scenarioName the name of the scenario.
     * @param { ScenarioState[] } scenarioStates the different states of the scenario.
     * @param { Number } occurences the number of users that goes through the scenario.
     * @param { Number } probability the probability that the scenario is hit.
     * @memberof Scenario
     */
    constructor (scenarioName, scenarioStates, occurences = undefined, probability = undefined) {
        this.scenarioName = scenarioName;
        this.occurences = occurences;
        this.scenarioStates = scenarioStates;
        this.probability = probability;
    }
}
