
/**
 * The PageVisit class contains information about the page that is visited by possibly multiple users.
 *
 * @export
 * @class PageVisit
 */
export class PageVisit {
    /**
     * Creates an instance of PageVisit.
     *
     * @param { Visit } visit
     * @param { String } previousPage the previous page.
     * @param { Number } entrances the number of entrances on the page.
     * @param { Number } exits the number of exits on the page.
     * @param { Number } occurences the number of occurences of the page.
     */
    constructor (visit, previousPage, entrances, exits, occurences) {
        Object.assign(this, visit);
        this.previousPage = previousPage;
        this.entrances = entrances;
        this.exits = exits;
        this.occurences = occurences;
    }
}
