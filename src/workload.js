/**
 * Creates a workload from a scenario
 *
 * @param { Scenario } scenario the chosen scenario.
 * @returns returns a workload model
 */
export function createWorkloadFromScenario (scenario, mapPageToFun = (p) => null, mapEventToFun = (p) => null, runRandom = (r) => r) {
    const states = [];

    scenario.scenarioStates.forEach(scenarioState => {
        const { events, page, targets, thinkTime } = scenarioState;

        const pageFun = mapPageToFun(page);
        if (!pageFun) {
            throw Error(`No function found for page: ${page}`);
        }

        states.push({
            name: page,
            targets: targets,
            action: function () {
                pageFun(thinkTime); // Visit page action

                if (events) {
                    // Randomly select an event
                    const event = runRandom(events);
                    if (event) {
                        var eventFun = mapEventToFun(event.name);
                        if (eventFun) {
                            eventFun();
                        }
                    }
                }
            }
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

