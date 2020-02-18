import { calculateArrayStatistics, getThinkTimesForEachPage } from '../src/modules/statistics';
import { Visit } from '../src/models/visit';
import assert from 'assert';

describe('Thinktimes', function () {
    describe('#calculateThinkTimeVariables()', function () {
        let times = [];
        beforeEach(function () {
            times = [1, 3, 5, 200];
        });

        describe('With outliers', function () {
            it('avg should be 52, std 85, min 1 and max 200', function () {
                const { avg, std, min, max } = calculateArrayStatistics(times);
                assert.strictEqual(avg, 52.25);
                assert.strictEqual(std, 98.51);
                assert.strictEqual(min, 1);
                assert.strictEqual(max, 200);
            });
        });

        describe('Without outliers', function () {
            it('avg should be 3, std 2, min 1 and max 5', function () {
                const { avg, std, min, max } = calculateArrayStatistics(times, true);
                assert.strictEqual(avg, 3);
                assert.strictEqual(std, 2);
                assert.strictEqual(min, 1);
                assert.strictEqual(max, 5);
            });
        });

        describe('Without outliers and array size of 3', function () {
            it('avg should be 3, std 2, min 1 and max 5', function () {
                times = [1, 3, 5];
                const { avg, std, min, max } = calculateArrayStatistics(times, true);
                assert.strictEqual(avg, 3);
                assert.strictEqual(std, 2);
                assert.strictEqual(min, 1);
                assert.strictEqual(max, 5);
            });
        });

        describe('Without outliers and array size of 8', function () {
            it('avg should be 3, std 2, min 1 and max 5', function () {
                times = [1, 3, 5, 6, 7, 8, 2, 0, 6];
                const { avg, std, min, max } = calculateArrayStatistics(times, true);
                assert.strictEqual(avg, 4.22);
                assert.strictEqual(std, 2.82);
                assert.strictEqual(min, 0);
                assert.strictEqual(max, 8);
            });
        });
    });

    describe('#getThinkTimesForEachPage()', function () {
        var visits;
        beforeEach(function () {
            visits = [];
            visits.push(new Visit('/', '1', []));
            visits.push(new Visit('/', '2', []));
            visits.push(new Visit('/', '10', []));
            visits.push(new Visit('/', '3', []));
        });

        it('avg should be 4, std 4.08, min 1 and max 10', function () {
            const { avg, std, min, max } = getThinkTimesForEachPage(visits)['/'];
            assert.strictEqual(avg, 4);
            assert.strictEqual(std, 4.08);
            assert.strictEqual(min, 1);
            assert.strictEqual(max, 10);
        });
    });
});
