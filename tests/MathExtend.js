Math.TAU = Math.TAU || 2 * Math.PI;

Math.relativeTol = 1E-5;
Math.absoluteTol = 1E-8;

Math.isClose = function (a, b) {
    "use strict";
    //Based on Numpy implementation:
    //http://docs.scipy.org/doc/numpy-dev/reference/generated/numpy.isclose.html
    if (Number.isNaN(a) && Number.isNaN(b)) {
        return true;
    } else if (a === b) {
        return true;
    } else {
        return (Math.abs(a - b) <= Math.absoluteTol + Math.relativeTol * Math.abs(b));
    }
};

Math.randBroad = function () {
/*    produces random real numbers, from zero (inclusive) to
    2^52 (exclusive).*/
    "use strict";
    var x = Math.random();
    x /= (1 - x);
    return x;
};
