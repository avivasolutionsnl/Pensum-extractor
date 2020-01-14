
/**
 * The Visit class contains information about a visit on the website.
 *
 * @export
 * @class Visit
 */
export class Visit {
    /**
    * Creates an instance of Visit.
    * @param { String } page the page path of the visit
    * @param { Number } timeOnPage the time that is spent on the visit.
    * @param { Event[] } events the event(s) for the visit.
    * @memberof Visit
    */
    constructor (page, timeOnPage, events) {
        this.page = page;
        this.timeOnPage = timeOnPage;
        this.events = events;
    }
}
