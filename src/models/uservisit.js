
/**
 * The UserVisit class contains one visit from one user to the website.
 *
 * @export
 * @class Visit
 */
export class UserVisit {
    /**
     * Creates an instance of UserVisit.
     * @param { Visit } visit
     * @param { String } identifier the identifier for the user and session.
     * @memberof UserVisit
     */
    constructor (visit, identifier) {
        Object.assign(this, visit);
        this.identifier = identifier;
    }
}
