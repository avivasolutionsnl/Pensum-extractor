/**
 * Creates a workload from a scenario
 *
 * @param { Scenario } scenario the chosen scenario.
 * @returns returns a workload model
 */
export function createWorkloadFromScenario (scenario, mapPageToFun = (p) => null, mapEventToFun = (p) => null) {
    const states = [];

    scenario.scenarioStates.forEach(scenarioState => {
        const { events, page, targets, thinkTime } = scenarioState;

        const pageFun = mapPageToFun(page);
        if (!pageFun) {
            throw Error(`No function found for page: ${page}`);
        }

        if (events) {
            events.map(e => { e.action = mapEventToFun(e.name); });
        }

        states.push({
            name: page,
            targets: targets,
            action: function () {
                pageFun(thinkTime); // Visit page action
            },
            events
        });
    });

    // Add the abandon state.
    const abandonFun = mapPageToFun('abandon');
    states.push({
        name: 'abandon',
        targets: [],
        action: abandonFun
    });

    // Return the workload model
    return {
        initial: states[0].name,
        abandon: 'abandon',
        states: states
    };
}
