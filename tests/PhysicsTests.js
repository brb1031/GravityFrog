/*global
    BruteFrog, console
*/

var physicsTests = function () {
    "use strict";
    var passed = true;
    var i, numParticles;

    var bFrog;

    for (numParticles = 0; numParticles < 5; numParticles += 1) {
        bFrog = new BruteFrog(numParticles);
        passed = passed && bFrog;
    }

    bFrog = new BruteFrog(1);
    passed = passed && bFrog;

    bFrog = new BruteFrog(125);
    for (i = 0; i < bFrog.allRows.length; i += 1) {
        bFrog.allRows[i] = Math.randBroad();
    }
    var initialState = bFrog.snapshot();

    bFrog.initializeWorkspace();

    var stopWatch = new Date();
    for (i = 0; i < 60; i += 1) {
        bFrog.leap();
    }
    var elapsedTime = new Date() - stopWatch;

    return {success: passed,
            initialState: initialState,
            finalState: bFrog.snapshot(),
            elapsedTime: elapsedTime};
};

var lineEnd = "<br>";

var testResults = physicsTests();

var summary = "Elapsed time (ms): " + testResults.elapsedTime + lineEnd;

summary += "(Detailed results in javascript console.)" + lineEnd;
document.write(summary);
