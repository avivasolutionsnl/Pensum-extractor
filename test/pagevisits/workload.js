import assert from 'assert';
import fs from 'fs';
import { createWorkloadFromScenario } from '../../src/workload';

function mapPageToFun (page) {
    switch (page) {
    case '/':
    case '/cart':
    case '/checkout':
    case '/category':
    case '/product':
        return () => console.log(`Visit ${page} page`);
    case 'abandon':
    case 'entrance':
        return () => console.log(page);
    default:
        return null;
    }
}

function mapEventToFun (event) {
    switch (event) {
    case 'adds-to-cart':
        return () => console.log('Add item to cart');
    case 'transaction':
        return () => console.log('Perform transaction');
    default:
        return null;
    }
}

describe('Create workload from page visits', function () {
    it('create workload model', function () {
        const scenarios = JSON.parse(fs.readFileSync('test/pagevisits/expected.json').toString());
        const workload = createWorkloadFromScenario(scenarios[0], mapPageToFun, mapEventToFun);
        assert.strictEqual(workload.abandon, 'abandon');
        assert.strictEqual(workload.initial, 'entrance');
        assert.strictEqual(workload.states.length, 7);

        const checkout = workload.states.find(x => x.name === '/checkout');
        const e = checkout.events[0];
        assert.strictEqual(e.name, 'transaction');
        assert.strictEqual(typeof (e.action), 'function');
    });
});
