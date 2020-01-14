import { getThinkTimesForEachPage } from '../src/modules/statistics';
import { createScenariosExact } from '../src/modules/scenario/scenarioexact';
import { createScenariosProbability } from '../src/modules/scenario/scenarioprobability';
import { UserVisit } from '../src/models/uservisit';
import { Event } from '../src/models/event';
import { createVisitPaths } from '../src/modules/visitpath';
import { Visit } from '../src/models/visit';
import assert from 'assert';

describe('Scenario\'s 1 user visits', function () {
    var visitPaths;
    var visits;
    var thinkTimes;

    beforeEach(function () {
        // Userpages
        visits = [];
        var events = [];

        events.push(new Event('add-to-cart', 1, 100));
        visits.push(new UserVisit(new Visit('/', '1', events), '1'));
        visits.push(new UserVisit(new Visit('/cart', '1', []), '1'));
        events = [];
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/', '6', events), '1'));
        events = [];
        events.push(new Event('add-to-cart', 1));
        events.push(new Event('removes-from-cart', 1));
        visits.push(new UserVisit(new Visit('/', '3', events), '1'));
        visits.push(new UserVisit(new Visit('/product', '1', []), '1'));
        visits.push(new UserVisit(new Visit('/', '3', []), '1'));
        visits.push(new UserVisit(new Visit('/product', '1', []), '1'));

        visits.push(new UserVisit(new Visit('/category', '1', []), '2'));
        events = [];
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/category', '1', events), '2'));
        events = [];
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/category', '1', events), '2'));
        visits.push(new UserVisit(new Visit('/category', '1', []), '2'));

        events = [];
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/', '2', events), '3'));
        visits.push(new UserVisit(new Visit('/cart', '1', []), '3'));

        visits.push(new UserVisit(new Visit('/', '10', []), '4'));
        visits.push(new UserVisit(new Visit('/cart', '1', []), '4'));

        events = [];
        events.push(new Event('add-to-wishlist', 1));
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/', '3', events), '5'));
        visits.push(new UserVisit(new Visit('/cart', '2', []), '5'));

        visitPaths = createVisitPaths(visits);
        thinkTimes = getThinkTimesForEachPage(visits);
    });

    describe('#createVisitPaths()', function () {
        it('should have five visit paths', function () {
            assert.strictEqual(visitPaths.length, 5);
        });
        it('first visit path should have 7 visits', function () {
            assert.strictEqual(visitPaths[0].visits.length, 7);
        });
    });

    // Should have 3 scenario's.
    // 60% (/ - /cart)
    // 20% (/category /category /category /category)
    // 20% (/ - /cart - / - /product - / - /product)
    describe('#createScenariosExact() without treshold and without thinktime per page', function () {
        var scenarios;
        beforeEach(function () {
            scenarios = createScenariosExact(visitPaths);
        });

        it('check the number of scenario\'s', function () {
            assert.strictEqual(scenarios.length, 3);
        });

        it('check the (/ - /cart) scenario', function () {
            var scenario = scenarios.find(x => x.scenarioName === '/ /cart');
            assert.strictEqual(scenario.occurences, 3);
            assert.strictEqual(scenario.probability, 60);

            assert.strictEqual(scenario.scenarioStates[0].page, '/');
            assert.strictEqual(scenario.scenarioStates[0].events.length, 2);
            assert.strictEqual(scenario.scenarioStates[0].events[0].name, 'add-to-cart');
            assert.strictEqual(scenario.scenarioStates[0].events[1].name, 'add-to-wishlist');
            assert.strictEqual(scenario.scenarioStates[1].page, '/cart');

            let thinkTime = scenario.scenarioStates[0].thinkTime;
            assert.strictEqual(thinkTime.avg, 5);
            assert.strictEqual(thinkTime.std, 4.36);
            assert.strictEqual(thinkTime.min, 2);
            assert.strictEqual(thinkTime.max, 10);
        });

        it('check the (/category /category /category /category) scenario', function () {
            var scenario = scenarios.find(x => x.scenarioName === '/category /category /category /category');
            assert.strictEqual(scenario.occurences, 1);
            assert.strictEqual(scenario.probability, 20);

            assert.strictEqual(scenario.scenarioStates[0].page, '/category');
            assert.strictEqual(scenario.scenarioStates[0].events.length, 0);

            assert.strictEqual(scenario.scenarioStates[1].page, '/category');
            assert.strictEqual(scenario.scenarioStates[1].events.length, 1);
            assert.strictEqual(scenario.scenarioStates[1].events[0].name, 'add-to-cart');

            let thinkTime = scenario.scenarioStates[0].thinkTime;
            assert.strictEqual(thinkTime.avg, 1);
            assert.strictEqual(thinkTime.std, 0);
            assert.strictEqual(thinkTime.min, 1);
            assert.strictEqual(thinkTime.max, 1);
        });

        it('check the (/ - /cart - / - / - /product - / - /product) scenario', function () {
            let scenario = scenarios.find(x => x.scenarioName === '/ /cart / / /product / /product');
            assert.strictEqual(scenario.occurences, 1);
            assert.strictEqual(scenario.probability, 20);

            assert.strictEqual(scenario.scenarioStates[0].page, '/');
            assert.strictEqual(scenario.scenarioStates[0].events.length, 1);
            assert.strictEqual(scenario.scenarioStates[0].events[0].name, 'add-to-cart');
            assert.strictEqual(scenario.scenarioStates[1].page, '/cart');
            assert.strictEqual(scenario.scenarioStates[2].page, '/');
            assert.strictEqual(scenario.scenarioStates[2].events.length, 1);
            assert.strictEqual(scenario.scenarioStates[2].events[0].name, 'add-to-cart');
            assert.strictEqual(scenario.scenarioStates[3].page, '/');
            assert.strictEqual(scenario.scenarioStates[3].events.length, 2);
            assert.strictEqual(scenario.scenarioStates[3].events[0].name, 'add-to-cart');
            assert.strictEqual(scenario.scenarioStates[3].events[1].name, 'removes-from-cart');
            assert.strictEqual(scenario.scenarioStates[4].page, '/product');
            assert.strictEqual(scenario.scenarioStates[5].page, '/');
            assert.strictEqual(scenario.scenarioStates[6].page, '/product');

            let thinkTime = scenario.scenarioStates[0].thinkTime;
            assert.strictEqual(thinkTime.avg, 1);
            assert.strictEqual(thinkTime.std, 0);
            assert.strictEqual(thinkTime.min, 1);
            assert.strictEqual(thinkTime.max, 1);
        });
    });

    // Should have 1 scenario.
    // 100% (/ - /cart)
    describe('#createScenariosExact() with thinkTimes per page and treshold', function () {
        var scenarios;
        beforeEach(function () {
            scenarios = createScenariosExact(visitPaths, thinkTimes, 50);
        });

        it('check if there is only one scenario because of treshold and check thinktimes', function () {
            assert.strictEqual(scenarios.length, 1);

            var scenario = scenarios[0];
            var calculated = scenario.scenarioStates[0].thinkTime;
            assert.strictEqual(calculated.avg, 4);
            assert.strictEqual(calculated.std, 3.06);
            assert.strictEqual(calculated.min, 1);
            assert.strictEqual(calculated.max, 10);
        });
    });

    // Should have 1 scenario with following states, targets and probabilities.
    // state: (entrance) targets: (/ - 100%)
    // state: (/) targets: (/product - 33%, /cart - 67%)
    // state: (/cart) targets: (/ - 25%, abandon - 75%)
    // state: (/product) targets: (/ - 50%, abandon - 50%)
    describe('#createScenariosProbability()', function () {
        var scenario;
        beforeEach(function () {
            var scenarios = createScenariosProbability(visitPaths, thinkTimes, 25);
            scenario = scenarios[0];
        });

        it('check if scenario has 4 states', function () {
            assert.strictEqual(scenario.scenarioStates.length, 4);
        });

        it('check targets and probabilities of entrance state', function () {
            let state = scenario.scenarioStates.find(x => x.page === 'entrance');
            assert.strictEqual(state.page, 'entrance');
            assert.strictEqual(state.targets.length, 1);
            assert.strictEqual(state.targets.find(x => x.target === '/').probability, 100);
        });

        it('check targets and probabilities of / state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/');
            assert.strictEqual(state.page, '/');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === '/product').probability, 33);
            assert.strictEqual(state.targets.find(x => x.target === '/cart').probability, 67);
        });

        it('check targets and probabilities of /cart state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/cart');
            assert.strictEqual(state.page, '/cart');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 75);
            assert.strictEqual(state.targets.find(x => x.target === '/').probability, 25);
        });

        it('check targets and probabilities of /product state', function () {
            let state = scenario.scenarioStates.find(x => x.page === '/product');
            assert.strictEqual(state.page, '/product');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 50);
            assert.strictEqual(state.targets.find(x => x.target === '/').probability, 50);
        });
    });
});

describe('Scenario\'s 2 user visits', function () {
    var visitPaths;
    var visits;
    var thinkTimes;
    beforeEach(function () {
        // Userpages
        visits = [];
        var events = [];
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/', '5', events), '1'));

        visits.push(new UserVisit(new Visit('/', '10', []), '2'));
        visits.push(new UserVisit(new Visit('/category', '7', []), '2'));

        events = [];
        events.push(new Event('add-to-wishlist', 1));
        events.push(new Event('add-to-cart', 1));
        visits.push(new UserVisit(new Visit('/', '8', events), '3'));
        visits.push(new UserVisit(new Visit('/category', '4', []), '3'));
        visits.push(new UserVisit(new Visit('/product', '6', []), '3'));

        visitPaths = createVisitPaths(visits);
        thinkTimes = getThinkTimesForEachPage(visits);
    });

    describe('#createVisitPaths()', function () {
        it('should have three visit paths', function () {
            assert.strictEqual(visitPaths.length, 3);
        });
    });

    // Should have 3 scenario's.
    // 34% (/)
    // 33% (/ - /category)
    // 33% (/ - /category - /product)
    describe('#createScenariosExact()', function () {
        var scenarios;
        beforeEach(function () {
            scenarios = createScenariosExact(visitPaths);
        });

        it('check the number of scenario\'s', function () {
            assert.strictEqual(scenarios.length, 3);
        });
        it('check if the total percentage of scenarios is 100%', function () {
            assert.strictEqual(scenarios.reduce((total, x) => total + x.probability, 0.0), 100);
        });

        it('check the (/) scenario', function () {
            var scenario = scenarios.find(x => x.scenarioName === '/');
            assert.strictEqual(scenario.occurences, 1);
            assert.strictEqual(scenario.probability, 34);

            assert.strictEqual(scenario.scenarioStates[0].page, '/');
            assert.strictEqual(scenario.scenarioStates[0].events.length, 1);
            assert.strictEqual(scenario.scenarioStates[0].events[0].name, 'add-to-cart');
        });

        it('check the (/ - /category) scenario', function () {
            var scenario = scenarios.find(x => x.scenarioName === '/ /category');
            assert.strictEqual(scenario.occurences, 1);
            assert.strictEqual(scenario.probability, 33);

            assert.strictEqual(scenario.scenarioStates[0].page, '/');
            assert.strictEqual(scenario.scenarioStates[1].page, '/category');
        });

        it('check the (/ - /category - /product) scenario', function () {
            var scenario = scenarios.find(x => x.scenarioName === '/ /category /product');
            assert.strictEqual(scenario.occurences, 1);
            assert.strictEqual(scenario.probability, 33);

            assert.strictEqual(scenario.scenarioStates[0].page, '/');
            assert.strictEqual(scenario.scenarioStates[0].events.length, 2);
            assert.strictEqual(scenario.scenarioStates[0].events[0].name, 'add-to-wishlist');
            assert.strictEqual(scenario.scenarioStates[0].events[1].name, 'add-to-cart');
            assert.strictEqual(scenario.scenarioStates[1].page, '/category');
            assert.strictEqual(scenario.scenarioStates[2].page, '/product');
        });
    });

    // Should have 1 scenario with following states, targets and probabilities.
    // state: (entrance) targets: (/ - 100%)
    // state: (/) targets: (/category - 67%, abandon - 33%)
    // state: (/category) targets: (/product - 50%, abandon - 50%)
    // state: (/product) targets: (abandon - 100%)
    describe('#createScenariosProbability()', function () {
        var scenario;
        beforeEach(function () {
            var scenarios = createScenariosProbability(visitPaths, thinkTimes);
            scenario = scenarios[0];
        });

        it('check if scenario has 4 states', function () {
            assert.strictEqual(scenario.scenarioStates.length, 4);
        });

        it('check targets and probabilities of entrance state', function () {
            var state = scenario.scenarioStates.find(x => x.page === 'entrance');
            assert.strictEqual(state.page, 'entrance');
            assert.strictEqual(state.targets.length, 1);
            assert.strictEqual(state.targets.find(x => x.target === '/').probability, 100);
        });

        it('check targets and probabilities of / state', function () {
            var state = scenario.scenarioStates.find(x => x.page === '/');
            assert.strictEqual(state.page, '/');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === '/category').probability, 67);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 33);
        });

        it('check targets and probabilities of /category state', function () {
            var state = scenario.scenarioStates.find(x => x.page === '/category');
            assert.strictEqual(state.page, '/category');
            assert.strictEqual(state.targets.length, 2);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 50);
            assert.strictEqual(state.targets.find(x => x.target === '/product').probability, 50);
        });

        it('check targets and probabilities of /product state', function () {
            var state = scenario.scenarioStates.find(x => x.page === '/product');
            assert.strictEqual(state.page, '/product');
            assert.strictEqual(state.targets.length, 1);
            assert.strictEqual(state.targets.find(x => x.target === 'abandon').probability, 100);
        });
    });
});
