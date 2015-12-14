/*global
    BruteFrog
*/

var physicsTests = function () {
    "use strict";
    var passed = false;
    return passed;
};

var bFrog = new BruteFrog(0);

bFrog = new BruteFrog(1);
bFrog.initializeWorkspace();
bFrog.leap();

var summary = "";
var lineEnd = "<br>";

summary += "(Detailed results in javascript console.)" + lineEnd;
document.write(summary);
