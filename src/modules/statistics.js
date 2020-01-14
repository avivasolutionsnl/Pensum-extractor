
/**
 *  Calcultates the thinktimes for each page.
 *
 * @export
 * @param { Visit[] } visits the visits.
 * @param {boolean} [removeOutliers=false] variable for indicating that array outliers should be removed.
 * @returns { Object[] } returns the thinktimes object with a thinktime object for each page.
 */
export function getThinkTimesForEachPage (visits, removeOutliers = false) {
    var thinkTimes = {};
    visits.forEach(visit => {
        if (!thinkTimes[visit.page]) {
            thinkTimes[visit.page] = [];
        }

        thinkTimes[visit.page].push(visit.timeOnPage);
    });

    Object.keys(thinkTimes).forEach(key => {
        thinkTimes[key] = calculateArrayStatistics(thinkTimes[key], removeOutliers);
    });

    return thinkTimes;
}

/**
 * Calucate the average, standard deviation, min and max for the given array of numbers.
 *
 * @export
 * @param { Number[] } array the array of numbers.
 * @param {boolean} [removeOutliers=false] variable for indicating that array outliers should be removed.
 * @returns { Object } object with average, standard deviation, min and max.
 */
export function calculateArrayStatistics (array, removeOutliers = false) {
    if (removeOutliers) {
        array = filterOutliers(array);
    }

    var total = 0;
    array.forEach(thinkTime => {
        total += parseInt(thinkTime);
    });
    var avg = Math.round((total / array.length) * 100) / 100;

    var sum = 0;
    // Calculate standard deviation
    array.forEach(thinkTime => {
        sum += Math.pow(thinkTime - avg, 2);
    });

    var std;
    if (array.length === 1) {
        std = 0;
    } else {
        std = Math.round(Math.sqrt(sum / (array.length - 1)) * 100) / 100;
    }

    var min = Math.min(...array);
    var max = Math.max(...array);

    return { avg: avg, std: std, min: min, max: max };
}

/**
 * Adds the percentages to the objects and ensures that the total is 100 procent.
 * With help of the following link: https://revs.runtime-revolution.com/getting-100-with-rounded-percentages-273ffa70252b
 *
 * @export
 * @param { Object[] } objects the objects where the probabilities needs to be added.
 * @returns the objects with new probabilities.
 */
export function addPercentages (objects, totalOccurences, fixTotal = true) {
    objects = objects.map(e => {
        e.probability = e.occurences / totalOccurences * 100;
        return e;
    });

    if (fixTotal) {
        var diff = 100 - objects.reduce((sum, e2) => sum + Math.floor(e2.probability), 0);
        objects = objects.sort((a, b) => {
            return (Math.floor(a.probability) - a.probability) - (Math.floor(b.probability) - b.probability);
        });

        objects = objects.map((e, index) => {
            e.probability = index < diff ? Math.floor(e.probability) + 1 : Math.floor(e.probability);
            return e;
        });
    } else {
        objects = objects.map(e => {
            e.probability = Math.floor(e.probability);
            return e;
        });
    }

    return objects;
}

/**
 * Filter the outliers of an array with the iqr method.
 * (https://www.mathworks.com/matlabcentral/cody/problems/42485-eliminate-outliers-using-interquartile-range)
 *
 * @param { Array } someArray
 * @returns the filtered array.
 */
function filterOutliers (someArray) {
    if (someArray.length < 4) {
        return someArray;
    }

    let q1, q3, iqr, maxValue, minValue;
    q1 = quantile(someArray, 25);
    q3 = quantile(someArray, 75);

    iqr = q3 - q1;
    maxValue = q3 + iqr * 1.5;
    minValue = q1 - iqr * 1.5;

    return someArray.filter((x) => (x >= minValue) && (x <= maxValue));
}

/**
 * Gets the quantile for the array.
 * (https://en.wikipedia.org/wiki/Quantile)
 *
 * @param { Array } array the array that is used.
 * @param { Number } percentile the percentile.
 * @returns the result.
 */
function quantile (array, percentile) {
    array.sort((a, b) => a - b);
    let index = percentile / 100.0 * (array.length - 1);
    let result;
    if (Math.floor(index) === index) {
        result = array[index];
    } else {
        let i = Math.floor(index);
        let fraction = index - i;
        result = array[i] + (array[i + 1] - array[i]) * fraction;
    }
    return result;
}
