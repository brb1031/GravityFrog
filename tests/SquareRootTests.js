var squareRootTests = function (numRandomSamples) {
    "use strict";
    var i;

    var timings = [];
    var logs = [];

    var specialCases = [];
    var randoms = [];

    specialCases.push(0);
    specialCases.push(-1);
    specialCases.push(-2);
    specialCases.push(-4);

    specialCases.push(-Number.NaN);
    specialCases.push(+Number.NaN);

    specialCases.push(Number.POSITIVE_INFINITY);
    specialCases.push(Number.NEGATIVE_INFINITY);


    for (i = 0; i < numRandomSamples; i += 1) {
        randoms.push(Math.random());
        randoms[i] /= (1 - randoms[i]);
    }

    randoms = new Float64Array(randoms);




    function clockIt(testFunc, input, name, testOutput) {
        var stopWatch;
        var numOps = input.length;
        name = name || testFunc.name;
        stopWatch = new Date();
        testOutput = testOutput || new Float64Array(numOps);
        testFunc(input, testOutput);
        return {name: name, testTime: new Date() - stopWatch, numOps: numOps};
    }

    // function clockUntil(testFunc)

    function checkIt(testFunc, input, name, verbose) {
        var numPassed = 0;
        var MAX_LOG_ENTRIES = 20;
        var remainingLogEntries = MAX_LOG_ENTRIES;
        verbose = verbose || false;
        var log = [];
        var entry;
        var closeEnough;
        var numTrials = input.length;
        var testOutput = new Float64Array(numTrials);
        var expectedOutput = new Float64Array(numTrials);
        name = name || testFunc.name;

        for (i = 0; i < numTrials; i += 1) {
            expectedOutput[i] = Math.sqrt(input[i]);
        }

        testFunc(input, testOutput);

        for (i = 0; i < numTrials; i += 1) {
            closeEnough = Math.isClose(testOutput[i], expectedOutput[i]);
            if (closeEnough) {
                numPassed += 1;
            }
            if ((!closeEnough || verbose) && remainingLogEntries) {
                remainingLogEntries -= 1;
                entry = "";
                if (closeEnough) {
                    entry += "PASS: ";
                } else {
                    entry += "FAIL: ";
                }
                entry += "sqrt(" + input[i].toPrecision(4) + "): ";
                entry += "Expected: " + expectedOutput[i].toPrecision(4) + ", ";
                entry += "Found: " + testOutput[i].toPrecision(4);
                log.push(entry);
            }
        }
        return {name: name, success: (numPassed === numTrials), numTrials: numTrials, numPassed: numPassed, log: log};
    }

    logs.push(checkIt(BruteFrog.prototype.wrapperSqrts, specialCases, "wrapperSqrts (special cases)"));
    logs.push(checkIt(BruteFrog.prototype.wrapperSqrts, randoms, "wrapperSqrts (random nonnegative)"));
    timings.push(clockIt(BruteFrog.prototype.wrapperSqrts, randoms, "wrapperSqrts (random nonnegative)"));


    // stopWatch = new Date();
    // for (i = 0; i < f.length; i += 1) {
    //     fSquareRootExact[i] = Math.sqrt(f[i]);
    // }
    // timings.push({testName: "for loop on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});

    // stopWatch = new Date();
    // var iMax = f.length;
    // for (i = 0; i < iMax; i += 1) {
    //     fSquareRootExact[i] = Math.sqrt(f[i]);
    // }
    // timings.push({testName: "for loop with cached length on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});



    // stopWatch = new Date();
    // bFrog.simpleSqrts(f, fMySquareRoot);
    // timings.push({testName: "BruteFrog.simpleSqrts()", testTime: new Date() - stopWatch});




    // stopWatch = new Date();
    // iMax = f.length;
    // for (i = 0; i < iMax; i += 8) {
    //     fSquareRootExact[i + 0] = Math.sqrt(f[i + 0]);
    //     fSquareRootExact[i + 1] = Math.sqrt(f[i + 1]);
    //     fSquareRootExact[i + 2] = Math.sqrt(f[i + 2]);
    //     fSquareRootExact[i + 3] = Math.sqrt(f[i + 3]);
    //     fSquareRootExact[i + 4] = Math.sqrt(f[i + 4]);
    //     fSquareRootExact[i + 5] = Math.sqrt(f[i + 5]);
    //     fSquareRootExact[i + 6] = Math.sqrt(f[i + 6]);
    //     fSquareRootExact[i + 7] = Math.sqrt(f[i + 7]);
    // }
    // timings.push({testName: "Unrolled for loop on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});

    // stopWatch = new Date();
    // bFrog.wrapperSqrts(f, fMySquareRoot);
    // timings.push({testName: "Wrapper unrolled for loop on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});



    return {timings: timings, logs: logs};
};


// var lineEnd = "<br>";

var testResults;
var i;
var log, timing;
var entry;
var MS_PER_SEC = 1000;
var MEGA_OPS_PER_S = MS_PER_SEC / 1E6;
var MEGA_OPS_PER_FRAME = MEGA_OPS_PER_S / 60;

var speedMops, MopsPerFrame;


testResults = squareRootTests(1E6);


for (i = 0; i < testResults.timings.length; i += 1) {
    timing = testResults.timings[i];
    console.log("" + timing.numOps + " iterations of " + timing.name);
    console.log("Time (ms): " + timing.testTime);
    speedMops = MEGA_OPS_PER_S * timing.numOps / timing.testTime;
    MopsPerFrame = MEGA_OPS_PER_FRAME * timing.numOps / timing.testTime;
    console.log("Speed (MegaOps/s): " + Math.floor(speedMops));
}

for (i = 0; i < testResults.logs.length; i += 1) {
    log = testResults.logs[i];

    if (log.success) {
        console.log("PASS: " + log.name);
    } else {
        console.log("FAIL: " + log.name);
    }

    for (entry = 0; entry < log.log.length; entry += 1) {
        console.log(log.log[entry]);
    }
}


// if (testResults.numFailed) {
//     logMessage = "FAIL: Brutefrog.simpleSqrts() gave incorrect results." + lineEnd;
//     logMessage += "Total number of failures: " + testResults.numFailed + lineEnd;
// } else {
//     logMessage = "PASS: Brutefrog.simpleSqrts() passed." + lineEnd;
// }

// logMessage += "Number of special cases: " + testResults.numSpecialCases + lineEnd;
// logMessage += "Number of random nonnegative inputs: " + testResults.numRandomSamples + lineEnd;

// document.write(logMessage);
