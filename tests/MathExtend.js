Math.relativeTol = 1E-5;
Math.absoluteTol = 1E-8;

Math.isClose = function(a, b){
  //Based on Numpy implementation:
  //http://docs.scipy.org/doc/numpy-dev/reference/generated/numpy.isclose.html
  return (Math.abs(a-b) <= Math.absoluteTol + Math.relativeTol * Math.abs(b));
};

