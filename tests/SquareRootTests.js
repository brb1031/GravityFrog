SquareRootTests = function(numSamples){
  var i;
  var numFailed = 0;
  if(numSamples < 2){
    numSamples = 3;
  }

  var f = [];

  f.push(0);
  f.push(-1);
  f.push(-2);
  f.push(-4);
  f.push(-NaN);
  f.push(NaN);

  f.push(-Infinity);
  f.push(Infinity);

  for(i=0; i < numSamples; i++){
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

  for(i = 0; i < numSamples; i++){
    if (!Math.isClose(fSquareRootExact[i], fMySquareRoot[i])){
      numFailed ++;
      console.log("Element" + i + ": " +f[i].toPrecision(4) + ", " + fSquareRootExact[i].toPrecision(4) + ", " + fMySquareRoot[i].toPrecision(4));
    }
  }

  return {numFailed:numFailed, numSamples:f.length};
};

var numSamples  = 6E6;
var testResults = SquareRootTests(numSamples);
if (testResults.numFailed){
  document.write("" + testResults.numFailed + " Square Root Tests out of " +testResults.numSamples+ " failed.");
} else {
  document.write("Square Root Tests passed with sample size "+ testResults.numSamples +".");
}
