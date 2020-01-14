/**
 * Creates the different visit paths of different users and session for the visits.
 *
 * @export
 * @param { Visit[] } visits the ORDERED visits.
 * @returns { VisitPath[] } returns the visitPaths.
 */
export function createVisitPaths (visits) {
    var visitPaths = [];
    var currentVisits = [];
    var previousVisit;

    // Create visitPaths for each identifier, this assumes that the visits are ordered.
    visits.forEach(function (visit) {
        if (!previousVisit) {
            previousVisit = visit;
        }

        // Check if it is a new visit path.
        if (visit.identifier !== previousVisit.identifier) {
            visitPaths.push({ visits: currentVisits });
            currentVisits = [];
        }

        // Add the visit to the path.
        currentVisits.push(visit);
        previousVisit = visit;
    });

    // Push the last visit path.
    visitPaths.push({ visits: currentVisits });

    return visitPaths;
}
