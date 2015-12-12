var squareRootTests = function SquareRootTests(numRandomSamples) {
    "use strict";
    var i;
    var numSpecialCases = 0;
    var numRandomFailed = 0;
    var numFailed = 0;

    var f = [];
    var timings = [];
    var stopWatch;

    var bFrog = new BruteFrog(0);

    f.push(0);
    f.push(-1);
    f.push(-2);
    f.push(-4);

    f.push(-Number.NaN);
    f.push(Number.NaN);

    f.push(Number.POSITIVE_INFINITY);
    f.push(Number.NEGATIVE_INFINITY);

    numSpecialCases = f.length;

    for (i = numSpecialCases; i < numRandomSamples + numSpecialCases; i += 1) {
        f.push(Math.random());
        f[i] /= (1 - f[i]);
    }

    //Padding:
    var numPadding = (f.length + 1) % 8 - 1;

    for (i = 0; i < numPadding; i += 1) {
        f.push(0);
    }

    f = new Float64Array(f);
    //Pre-allocate:
    var fMySquareRoot = new Float64Array(f.length);
    var fSquareRootExact = new Float64Array(f.length);




    // stopWatch = new Date();
    // fSquareRootExact = f.map(Math.sqrt);
    // timings.push({testName: "Float64Array.map(Math.sqrt)", testTime: new Date() - stopWatch});

    stopWatch = new Date();
    for (i = 0; i < f.length; i += 1) {
        fSquareRootExact[i] = Math.sqrt(f[i]);
    }
    timings.push({testName: "for loop on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});

    stopWatch = new Date();
    var iMax = f.length;
    for (i = 0; i < iMax; i += 1) {
        fSquareRootExact[i] = Math.sqrt(f[i]);
    }
    timings.push({testName: "for loop with cached length on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});



    stopWatch = new Date();
    bFrog.simpleSqrts(f, fMySquareRoot);
    timings.push({testName: "BruteFrog.simpleSqrts()", testTime: new Date() - stopWatch});




    stopWatch = new Date();
    iMax = f.length;
    for (i = 0; i < iMax; i += 8) {
        fSquareRootExact[i + 0] = Math.sqrt(f[i + 0]);
        fSquareRootExact[i + 1] = Math.sqrt(f[i + 1]);
        fSquareRootExact[i + 2] = Math.sqrt(f[i + 2]);
        fSquareRootExact[i + 3] = Math.sqrt(f[i + 3]);
        fSquareRootExact[i + 4] = Math.sqrt(f[i + 4]);
        fSquareRootExact[i + 5] = Math.sqrt(f[i + 5]);
        fSquareRootExact[i + 6] = Math.sqrt(f[i + 6]);
        fSquareRootExact[i + 7] = Math.sqrt(f[i + 7]);
    }
    timings.push({testName: "Unrolled for loop on Math.sqrt(Float64Array[i])", testTime: new Date() - stopWatch});





    var numRandomDisplay = 20;
    for (i = numSpecialCases; i < fSquareRootExact.length; i += 1) {
        if (!Math.isClose(fSquareRootExact[i], fMySquareRoot[i])) {
            numRandomFailed += 1;
            if (numRandomDisplay) {
                numRandomDisplay -= 1;
                console.log("Element " + i + ": " + f[i].toPrecision(4) + ", " + fSquareRootExact[i].toPrecision(4) + ", " + fMySquareRoot[i].toPrecision(4));
            }
        }
    }

    for (i = 0; i < numSpecialCases; i += 1) {
        if (!Math.isClose(fSquareRootExact[i], fMySquareRoot[i])) {
            console.log("Special Case: " + f[i].toPrecision(4) + ", " + fSquareRootExact[i].toPrecision(4) + ", " + fMySquareRoot[i].toPrecision(4));
            numFailed += 1;
        }
    }
    numFailed += numRandomFailed;

    for (i = 0; i < timings.length; i += 1) {
        console.log("Test name: " + timings[i].testName);
        console.log("Time (ms): " + timings[i].testTime);
    }

    return {numFailed: numFailed, numRandomSamples: numRandomSamples, numSpecialCases: numSpecialCases};
};


var numRandomSamples = 5E6;
var testResults = squareRootTests(numRandomSamples);
var logMessage;
var lineEnd = "<br>";

if (testResults.numFailed) {
    logMessage = "FAIL: Brutefrog.simpleSqrts() gave incorrect results." + lineEnd;
    logMessage += "Total number of failures: " + testResults.numFailed + lineEnd;
} else {
    logMessage = "PASS: Brutefrog.simpleSqrts() passed." + lineEnd;
}

logMessage += "Number of special cases: " + testResults.numSpecialCases + lineEnd;
logMessage += "Number of random nonnegative inputs: " + testResults.numRandomSamples + lineEnd;

document.write(logMessage);
