import stripJsonComments from 'strip-json-comments';
import assert from 'assert';
import fs from 'fs';
import { importVisits } from '../../src/modules/import/ga';
import { getThinkTimesForEachPage } from '../../src/modules/statistics';
import { createScenariosProbability } from '../../src/modules/scenario/scenarioprobability';
import { writeScenarioGraphs, writeScenariosJSON } from '../../src/modules/writer';

describe('Page visits from file: scenario #1', function () {
    let scenarios = null;
    let scenario = null;

    beforeEach(function () {
        const config = null;
        const input = fs.readFileSync('test/pagevisits/input.json').toString();
        const data = JSON.parse(stripJsonComments(input));

        return importVisits(config, (p) => p, data).then((visits) => {
            const thinkTimes = getThinkTimesForEachPage(visits);
            scenarios = createScenariosProbability(visits, thinkTimes, 0);
            scenario = scenarios[0];
        });
    });

    it('should have 1 scenario', function () {
        assert.strictEqual(scenarios.length, 1);
    });

    it('should have 6 states', function () {
        // 6 states because the entrance is also a state
        assert.strictEqual(scenario.scenarioStates.length, 6);
    });

    it('verify entrance state', function () {
        const state = scenario.scenarioStates.find(({ page }) => page === 'entrance');
        assert.strictEqual(state.occurences, 1);
        assert.strictEqual(state.targets.length, 3);
        assert.strictEqual(state.targets.find(x => x.target === '/product').probability, 33);
        assert.strictEqual(state.targets.find(x => x.target === '/').probability, 34);
        assert.strictEqual(state.targets.find(x => x.target === '/category').probability, 33);
    });

    it('verify / state', function () {
        const state = scenario.scenarioStates.find(({ page }) => page === '/');
        assert.strictEqual(state.occurences, 2);
        assert.strictEqual(state.thinkTime.avg, 25);
        assert.strictEqual(state.targets.length, 2);
        assert.strictEqual(state.targets.find(x => x.target === '/cart').probability, 50);
        assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 50);
        assert.strictEqual(state.events.length, 1);
        assert.strictEqual(state.events.find(x => x.name === 'adds-to-cart').probability, 50);
    });

    it('verify /product state', function () {
        const state = scenario.scenarioStates.find(({ page }) => page === '/product');
        assert.strictEqual(state.occurences, 1);
        assert.strictEqual(state.thinkTime.avg, 30);
        assert.strictEqual(state.targets.length, 1);
        assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 100);
    });

    it('verify /category state', function () {
        const state = scenario.scenarioStates.find(({ page }) => page === '/category');
        assert.strictEqual(state.occurences, 1);
        assert.strictEqual(state.thinkTime.avg, 30);
        assert.strictEqual(state.targets.length, 1);
        assert.strictEqual(state.targets.find(x => x.target === '/').probability, 100);
    });

    it('verify /cart state', function () {
        const state = scenario.scenarioStates.find(({ page }) => page === '/cart');
        assert.strictEqual(state.occurences, 1);
        assert.strictEqual(state.thinkTime.avg, 10);
        assert.strictEqual(state.targets.length, 1);
        assert.strictEqual(state.targets.find(x => x.target === '/checkout').probability, 100);
    });

    it('verify /checkout state', function () {
        const state = scenario.scenarioStates.find(({ page }) => page === '/checkout');
        assert.strictEqual(state.occurences, 1);
        assert.strictEqual(state.thinkTime.avg, 90);
        assert.strictEqual(state.targets.length, 1);
        assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 100);
        assert.strictEqual(state.events.length, 1);
        assert.strictEqual(state.events.find(x => x.name === 'transaction').probability, 100);
    });

    it('verify dotty graph', function () {
        const filenames = writeScenarioGraphs(scenarios);
        assert.strictEqual(filenames.length, 1);

        const actual = fs.readFileSync(filenames[0]).toString();
        const expected = fs.readFileSync('test/pagevisits/expected.dot').toString();
        assert.strictEqual(actual, expected);
    });

    it('verify json', function () {
        const file = writeScenariosJSON(scenarios);

        const actual = fs.readFileSync(file).toString();
        const expected = fs.readFileSync('test/pagevisits/expected.json').toString();
        assert.strictEqual(actual, expected);
    });
});
