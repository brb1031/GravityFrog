SquareRootTests = function(numSamples){
  var i;
  var numFailed = 0;
  var numSpecialCases;
  if(numSamples < 2){
    numSamples = 3;
  }

  var f = [];

  f.push(0);
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

  console.log("Float64Array map Math.sqrt() calculating...\n");
  fSquareRootExact = f.map(Math.sqrt);
  console.log("Done.\n");



  console.log("Custom Sqrt calculating...\n");
  BruteFrog.prototype.fasterSqrts(f, fMySquareRoot);
  console.log("Done.\n");

  for(i = 0; i < f.length; i += 1){
    if (!Math.isClose(fSquareRootExact[i], fMySquareRoot[i])){
        console.log("Element " + i + ": " +f[i].toPrecision(4) + ", " + fSquareRootExact[i].toPrecision(4) + ", " + fMySquareRoot[i].toPrecision(4));
        numFailed++;
    }
  }

  return {numFailed:numFailed, numSamples:f.length};
};

var numSamples  = 25;
var testResults = SquareRootTests(numSamples);
if (testResults.numFailed){
  document.write("" + testResults.numFailed + " Square Root Tests out of " +testResults.numSamples+ " failed.");
} else {
  document.write("Square Root Tests passed with sample size "+ testResults.numSamples +".");
}
