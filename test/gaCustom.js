import { convertToUserVisit } from '../src/modules/import/gaCustom';
import assert from 'assert';

describe('GA-custom', function () {
    describe('#convertToUserVisit()', function () {
        const element = {
            dimensions: ['1', '1553847449714', '1', '/'],
            metrics: [{
                values: ['1', '10', '1', '0', '1', '0', '0']
            }]
        };

        it('first element should convert to correct user and page visit', function () {
            const visit = convertToUserVisit(element);
            assert.strictEqual(visit.identifier, '1_1');
            assert.strictEqual(visit.page, '/');
            assert.strictEqual(visit.timeOnPage, 10);
            assert.strictEqual(visit.events.length, 1);
            assert.strictEqual(visit.events[0].name, 'adds-to-cart');
        });

        const element2 = {
            dimensions: ['2', '1553847449714', '1', '/http://localhost/search?location=searchtext=test'],
            metrics: [{
                values: ['1', '3', '1', '0', '1', '1', '0']
            }]
        };

        it('second element should convert to correct visit', function () {
            const visit = convertToUserVisit(element2);
            assert.strictEqual(visit.identifier, '2_1');
            assert.strictEqual(visit.page, '/search');
            assert.strictEqual(visit.timeOnPage, 3);
            assert.strictEqual(visit.events.length, 2);
            assert.strictEqual(visit.events[0].name, 'adds-to-cart');
            assert.strictEqual(visit.events[1].name, 'removes-from-cart');
        });

        const element3 = {
            dimensions: ['2', '1553847449714', '2', '/drinks/page'],
            metrics: [{
                values: ['1', '7', '0', '1', '0', '0', '0']
            }]
        };

        it('third element should convert to correct visit', function () {
            const visit = convertToUserVisit(element3);
            assert.strictEqual(visit.identifier, '2_2');
            assert.strictEqual(visit.page, '/drinks/page');
            assert.strictEqual(visit.timeOnPage, 7);
            assert.strictEqual(visit.events.length, 0);
        });

        const element4 = {
            dimensions: ['3', '1553847449714', '1', '/drinks'],
            metrics: [{
                values: ['1', '1', '1', '0', '0', '0', '1']
            }]
        };

        it('fourth element should convert to correct visit', function () {
            const visit = convertToUserVisit(element4);
            assert.strictEqual(visit.identifier, '3_1');
            assert.strictEqual(visit.page, '/drinks');
            assert.strictEqual(visit.timeOnPage, 1);
            assert.strictEqual(visit.events.length, 1);
            assert.strictEqual(visit.events[0].name, 'transaction');
        });
    });
});
