SquareRootTests = function(numSamples){
  var f = [];
  var i;
  var Min=1;
  var Max=2;
  var stepSize = (Max - Min)/(numSamples);
  var passed = true;
  if(numSamples < 2){
    numSamples = 3;
  }

  for(i=0; i < numSamples; i++){
    f.push(Min + stepSize * i);
  }

  f = new Float64Array(f);
  fbits = new Uint32Array(f.buffer);

  fSquareRootExact = f.map(Math.sqrt);

  //Pre-allocate:
  fMySquareRoot = new Float64Array(numSamples);

  BruteFrog.prototype.fasterSqrts(f, fMySquareRoot);

  for(i = 0; i < numSamples; i++){
    if (!Math.isClose(fSquareRootExact[i], fMySquareRoot[i])){
      passed = false;
      console.log(f[i].toPrecision(4) + ", " + fSquareRootExact[i].toPrecision(4) + ", " + fMySquareRoot[i].toPrecision(4));
    }
  }

  return passed;
};

numSamples = 10;
if (SquareRootTests(numSamples)){
  document.write("Square Root Tests passed with sample size "+ numSamples +".");
} else {
  document.write("Some Square Root Tests failed.");
}
