SquareRootTests = function(numSamples){
  var i;
  var numFailed = 0;
  var numSpecialCases;
  if(numSamples < 2){
    numSamples = 3;
  }

  var f = [];
  var timings = [];
  var stopWatch;

  f.push( 0);
  f.push(-1);
  f.push(-2);
  f.push(-4);

  f.push(-Number.NaN);
  f.push( Number.NaN);

  f.push(Number.POSITIVE_INFINITY);
  f.push(Number.NEGATIVE_INFINITY);

  numSpecialCases = f.length;
  numSamples += numSpecialCases;
  for(i=numSpecialCases; i < numSamples; i++){
    f.push(Math.random());
    f[i] /= (1-f[i]);
  }
  f = new Float64Array(f);
  //Pre-allocate:
  fMySquareRoot = new Float64Array(f.length);

  stopWatch = new Date();
  fSquareRootExact = f.map(Math.sqrt);
  timings.push({testName: "Float64Array map Math.sqrt()", testTime: new Date() - stopWatch});

  stopWatch = new Date();
  BruteFrog.prototype.fasterSqrts(f, fMySquareRoot);
  timings.push({testName: "BruteFrog.fasterSqrts()", testTime: new Date() - stopWatch});

  for(i = 0; i < f.length; i += 1){
    if (!Math.isClose(fSquareRootExact[i], fMySquareRoot[i])){
        console.log("Element " + i + ": " +f[i].toPrecision(4) + ", " + fSquareRootExact[i].toPrecision(4) + ", " + fMySquareRoot[i].toPrecision(4));
        numFailed++;
    }
  }

  for (i = 0; i < timings.length; i++){
    console.log("Test name: " + timings[i].testName);
    console.log("Time (ms): " + timings[i].testTime);
  }

  return {numFailed:numFailed, numSamples:f.length};
};


var numSamples  = 1E6;
var testResults = SquareRootTests(numSamples);

if (testResults.numFailed){
  document.write("" + testResults.numFailed + " Square Root Tests out of " +testResults.numSamples+ " failed.");
} else {
  document.write("Square Root Tests passed with sample size "+ testResults.numSamples +".");
}
