
/**
 * The event class defines an event that can occur in a state.
 * It contains the name of the event, occurences and probability.
 *
 * @export
 * @class Event
 */
export class Event {
    /**
     * Creates an instance of Event.
     * @param { String } name the name of the event.
     * @param { Number } occurences the number of occurences of the event.
     * @param { Number } probability the probability that the event occurs.
     * @memberof Event
     */
    constructor (name, occurences = undefined, probability = undefined) {
        this.name = name;
        this.occurences = occurences;
        this.probability = probability;
    }
}
