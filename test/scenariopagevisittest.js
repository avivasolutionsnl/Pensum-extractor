import { getThinkTimesForEachPage } from '../src/modules/statistics';
import { createScenariosProbability } from '../src/modules/scenario/scenarioprobability';
import { Visit } from '../src/models/visit';
import { PageVisit } from '../src/models/pagevisit';
import assert from 'assert';

describe('Scenario\'s 1 page visits', function () {
    var visits = [];
    var thinkTimes;

    beforeEach(function () {
        visits.push(new PageVisit(new Visit('/', '134', []), 'entrance', 30, 5, 30));
        visits.push(new PageVisit(new Visit('/', '98', []), '/category', 2, 0, 2));

        visits.push(new PageVisit(new Visit('/category', '32', []), 'entrance', 2, 0, 2));
        visits.push(new PageVisit(new Visit('/category', '37', []), '/', 0, 1, 3));

        visits.push(new PageVisit(new Visit('/product', '67', []), '/', 0, 12, 14));
        visits.push(new PageVisit(new Visit('/product', '34', []), '/category', 0, 2, 2));

        visits.push(new PageVisit(new Visit('/cart', '67', []), '/', 0, 10, 10));
        visits.push(new PageVisit(new Visit('/cart', '58', []), '/product', 0, 2, 2));

        thinkTimes = getThinkTimesForEachPage(visits);
    });

    describe('#createScenariosProbability() with wrong objects', function () {
        it('expect exception because of wrong objects', function () {
            assert.throws(function () { createScenariosProbability([{ object: 'object' }], thinkTimes, 1); }, Error);
        });
    });

    // Should have 1 scenario with following states, targets and probabilities.
    // state: (entrance) targets: (/ - 94%, /category 6%)
    // state: (/) targets: (/category - 9%, /product - 44%, /cart - 31%, abandon 16%)
    // state: (/category) targets: (/ - 40%, /product - 40%, abandon - 20%)
    // state: (/product) targets: (/cart - 12%, abandon - 88%)
    // state: (/cart) targets: (abandon - 100%)
    describe('#createScenariosProbability()', function () {
        var scenario;
        beforeEach(function () {
            var scenarios = createScenariosProbability(visits, thinkTimes, 1);
            scenario = scenarios[0];
        });

        it('check if scenario has 5 states', function () {
            assert.strictEqual(scenario.scenarioStates.length, 5);
        });

        it('check targets and probabilities of entrance state', function () {
            let state = scenario.scenarioStates.find(x => x.page === 'entrance');
            assert.strictEqual(state.page, 'entrance');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === '/').probability, 94);
            assert.strictEqual(state.targets.find(x => x.target === '/category').probability, 6);
        });

        it('check targets and probabilities of / state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/');
            assert.strictEqual(state.page, '/');
            assert.strictEqual(state.targets.length, 4);
            assert.strictEqual(state.targets.find(x => x.target === '/category').probability, 9);
            assert.strictEqual(state.targets.find(x => x.target === '/product').probability, 44);
            assert.strictEqual(state.targets.find(x => x.target === '/cart').probability, 31);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 16);
        });

        it('check targets and probabilities of /cart state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/cart');
            assert.strictEqual(state.page, '/cart');
            assert.strictEqual(state.targets.length, 1);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 100);
        });

        it('check targets and probabilities of /product state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/product');
            assert.strictEqual(state.page, '/product');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 88);
            assert.strictEqual(state.targets.find(x => x.target === '/cart').probability, 12);
        });

        it('check targets and probabilities of /category state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/category');
            assert.strictEqual(state.page, '/category');
            assert.strictEqual(state.targets.length, 3);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 20);
            assert.strictEqual(state.targets.find(x => x.target === '/').probability, 40);
            assert.strictEqual(state.targets.find(x => x.target === '/product').probability, 40);
        });
    });
});
