import { addPercentages } from '../modules/statistics';

/**
 * The scenario state defines the state of the scenario.
 * It contains the page, event(s), thinktime and the probability for the state.
 *
 * @export
 * @class ScenarioState
 */
export class ScenarioState {
    /**
     * Creates an instance of ScenarioState.
     * The scenario state defines the state a scenario can be in.
     * It is used with the execution of the scenario's.
     * https://en.wikipedia.org/wiki/State_(computer_science)
     *
     * @param { String } page the page of the state.
     * @param { Event[] } events the event(s) of the state.
     * @param { ThinkTime } thinktime the thinktime for the state.
     * @memberof ScenarioState
     */
    constructor (page, events = undefined, thinkTime = null, occurences = undefined) {
        this.page = page;
        this.events = events;
        this.thinkTime = thinkTime;
        this.occurences = occurences;
        this.targets = [];
    }

    /**
     * Adds an array of events to the current array of events.
     *
     * @param { Event[] } events
     * @memberof ScenarioState
     */
    addEvents (events) {
        if (this.events) {
            events.forEach(event => {
                var found = this.events.find(e => e.name === event.name);
                if (found) {
                    found.occurences += event.occurences;
                } else {
                    this.events.push(event);
                }
            });
        }
    }

    /**
     * Calculates the probabilities of the events in the scenario state.
     *
     * @memberof ScenarioState
     */
    addEventsProbabilities () {
        if (this.events) {
            this.events = addPercentages(this.events, this.occurences, false);
        }
    }
}
