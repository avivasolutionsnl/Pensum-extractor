import { convertToPageVisit } from '../src/modules/import/ga';
import assert from 'assert';

describe('GA', function () {
    describe('#convertToPageVisit()', function () {
        it('first element should convert to correct user and page visit', function () {
            const element = {
                dimensions: ['/', '(entrance)'],
                metrics: [{
                    values: ['14', '87', '14', '5', '4', '1', '0']
                }]
            };

            const visit = convertToPageVisit(element);
            assert.strictEqual(visit.page, '/');
            assert.strictEqual(visit.previousPage, 'entrance');
            assert.strictEqual(visit.timeOnPage, 10);
            assert.strictEqual(visit.events.length, 2);
        });

        it('second element should convert to correct visit', function () {
            const element2 = {
                dimensions: ['/http://localhost/search?location=searchtext=test', '/'],
                metrics: [{
                    values: ['2', '24', '0', '1', '0', '0', '0']
                }]
            };

            const visit = convertToPageVisit(element2);
            assert.strictEqual(visit.page, '/search');
            assert.strictEqual(visit.previousPage, '/');
            assert.strictEqual(visit.timeOnPage, 24);
            assert.strictEqual(visit.events.length, 0);
        });
    });
});
