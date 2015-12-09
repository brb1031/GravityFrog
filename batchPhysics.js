function BruteFrog(maxNumParticles){
/*This implements the brute force algorithm, O(N_vector ^ 2);
Vector3d should pull from this kinematics buffer.
And Particle will therefore see this transparently.
*/
  this.maxNumParticles = maxNumParticles;
  this.tView            = Float64Array;
  this.numRowElements   = this.maxNumParticles;
	this.numTableElements = this.maxNumParticles*this.maxNumParticles;
  this.rowSize          = this.numRowElements * this.tView.BYTES_PER_ELEMENT;
	this.tableSize        = this.numTableElements * this.tView.BYTES_PER_ELEMENT;
  this.b               = new ArrayBuffer(16 * this.rowSize);
  this.allRows         = new this.tView(this.b, 0);

  var rowOffset=0;
  this.x = new this.tView(this.b, (rowOffset+=3) * this.rowSize);
  this.v = new this.tView(this.b, (rowOffset+=3) * this.rowSize);
  this.a = new this.tView(this.b, (rowOffset+=3) * this.rowSize);
  this.aOld = new this.tView(this.b, (rowOffset+=3) * this.rowSize);
  this.aSwap = this.a;

  this.m = new this.tView(this.b, (rowOffset++)*this.rowSize);
	this.numRows     = rowOffset;

	this.fStrengthBuf = new ArrayBuffer(this.tableSize);
	this.fBuf = new ArrayBuffer(3 * this.tableSize);
	this.dBuf = new ArrayBuffer(this.tableSize);
	this.dSquaredBuf = new ArrayBuffer(this.tableSize);

	this.forceStrengthTable = new this.tView(this.fStrengthBuf);
	this.forceTable = new this.tView(this.fBuf);
	this.distTable  = new this.tView(this.dBuf);
	this.distSquareTable = new this.tView(this.dSquaredBuf);
}

BruteFrog.prototype.Leap = function(){
//Assumes acceleration calculation has been performed at least once.
  var i;

  //Half step V.
  for(i=0; i < 3 * this.N; i++){
  	this.v[i] += this.a[i];
  }

  //Full step X.
  for(i=0; i < 3 * this.N; i++){
  	this.x[i] += this.v[i];
  }

  this.aSwap = this.a;
  this.a     = this.aOld;
  this.aOld  = this.aSwap;

  this.prototype.batchCalcForces();

  //Half step V.
  for(i=0; i < 3 * this.N; i++){
  	this.v[i] += this.a[i];
  }
};


BruteFrog.prototype.batchCalcForces = function(){
	var i, j;
  var rowOffset, colOffset;
  var iScalar, iVector;
  var jScalar, jVector;

  //Set positions. (Bytes)
  for(rowOffset = 0; rowOffset < 3 * this.tableSize; rowOffset += 3*this.rowSize){
  	this.forceTable.set(rowOffset, this.x);
  }

  //Subtract self position to form vector pointing from self to every other:
	for(iVector = 0; iVector < 3*this.numTableElements; iVector += 3*this.numRowElements){
	  for(jVector = 0; jVector < 3*this.numRowElements; jVector+=3){
			this.forceTable[iVector + jVector + 0] -= this.x[iVector + 0];
			this.forceTable[iVector + jVector + 1] -= this.x[iVector + 1];
			this.forceTable[iVector + jVector + 2] -= this.x[iVector + 2];
		}
  }

  //Calculate d^2
  for(iScalar = 0, iVector = 0; iScalar < this.numTableElements; iScalar+=this.numRowElements, iVector+= 3*this.numRowElements){
	  for(jScalar = 0, jVector = 0; jScalar < this.numTableElements; jScalar++, jVector+= 3){

  		this.distSquareTable[iScalar + jScalar] = this.forceTable[iVector + jVector + 0] * this.forceTable[iVector + jVector + 0]+
  																	this.forceTable[iVector + jVector + 1] * this.forceTable[iVector + jVector + 1]+
  																	this.forceTable[iVector + jVector + 2] * this.forceTable[iVector + jVector + 2];
  	}
  }

  for(i = 0; i < this.numTableElements; i++){
  	this.distTable[i] = Math.sqrt(this.distSquareTable);
  	this.forceStrengthTable[i] = 1 / (this.distSquareTable[i] * this.distTable[i]);
  }
  //To be replaced with:
  //Brutefrog.prototype.fasterSqrts(distSquareTable, distTable);


	for(jScalar = 0; jScalar < this.numRowElements; jScalar ++){
	  for(iScalar = 0; iScalar < this.numTableElements; iScalar += this.numRowElements){
  		this.forceStrengthTable[iScalar + jScalar] *= this.m[jScalar];
  	}
  }

  for(iScalar = 0; iScalar < this.numTableElements; iScalar += this.numRowElements){
  	this.distSquareTable[iScalar] = 0;
  	iScalar++; //To follow the diagonal elements.
  }


  for(iScalar = 0, iVector = 0; iScalar < this.numTableElements; iScalar+=this.numRowElements, iVector+= 3*this.numRowElements){
	  for(jScalar = 0, jVector = 0; jScalar < this.numRowElements; jScalar++, jVector+= 3){
	  	this.forceTable[iVector + jVector + 0] *= this.distSquareTable[iScalar + jScalar];
	  	this.forceTable[iVector + jVector + 1] *= this.distSquareTable[iScalar + jScalar];
	  	this.forceTable[iVector + jVector + 2] *= this.distSquareTable[iScalar + jScalar];
		}
  }

  this.a.fill(0);
  for(i=0, iVector = 0; iVector < 3 * this.numTableElements; i+=3, iVector+= 3*this.numRowElements){
	  for(jVector = 0; jVector < 3 * this.numRowElements; jVector+= 3){
	  	this.a[i + 0] += this.forceTable[iVector + jVector + 0];
	  	this.a[i + 1] += this.forceTable[iVector + jVector + 1];
	  	this.a[i + 2] += this.forceTable[iVector + jVector + 2];
		}
	}

};



BruteFrog.prototype.fasterSqrts = function(xSq, x){
	//Assume 64 bits,
	//32 bits has lo = offset, hi = offset+1

	// var xSqBitLo = new Uint32Array(x.buffer, 0);
  //  var xSqBitHi = new Uint32Array(x.buffer, 4);

  // var inputByteLength = xSq.length*xSq.BYTES_PER_ELEMENT;
/*
Float64:
| B | B | B | B | B | B | B | B |
|s exp|  frac   |    frac       |

2 x Float32:
| B | B | B | B | B | B | B | B |
|sexp|   frac   |sexp|   frac   |

(uint 32 + bias_32 << 23 (0x3f800000))
Intermediate float32:
| B | B | B | B |
| n |(b+frac)/2 |
Where exp = 2n+b
*/

  var x32FloatLo = new Float32Array(x.buffer, 0);
  var x32FloatHi = new Float32Array(x.buffer, 4);

  var x32UnsignedLo = new Uint32Array(x.buffer, 0);
  var x32UnsignedHi = new Uint32Array(x.buffer, 4);

  var x32IntLo = new Int32Array(x.buffer, 0);
  var x32IntHi = new Int32Array(x.buffer, 4);

  var x16Ints = new Int16Array(x.buffer, 0);

	var i;

  //Interleaved approach, cast to 32bit float
	for(i = 0; i < xSq.length; i++){
		x32FloatLo[2*i] = xSq[i];
	}


	for (i = 0; i < x32IntLo.length; i+=2){
    if (x32FloatLo[i] != x32FloatLo[i]){
      continue;
    } else if (x32FloatLo[i] < 0){
      x32IntLo[i] = ~0;
      x32IntHi[i] = ~0;
      continue;
    }
    //Guarantees that sign bit is zero, allowing
    //Top 9 bits to store the exponent.
    x32UnsignedLo[i] += 0x3f800000;
    //Float32
    //Where exp = 2n + b, frac = (uint)mantissa / 2^(23)
    //Top 9 bits contain: 2n+2bias + b
    //Bottom 23 bits contain: mantissa
    //Top _byte_ has n+bias
    //Bottom 3 bytes have (b+frac)/2


    x32IntHi[i] = x32IntLo[i];

    x32IntLo[i] <<= 8;
    //Top 3 bytes (as int) has (frac-b)/2

		//2nd Order correction:
    x32UnsignedLo[i] = x16Ints[2*i+2] * x16Ints[2*i+2];
    x32UnsignedLo[i] = 22488 * x16Ints[2*i+2];
    x32UnsignedLo[i] >>>= 9;//| 0 |  4f((frac-b)/2)^2    |

    //Top _byte_ has n+bias
    //Bottom 3 bytes have (b+frac)/2

    x32UnsignedLo[i] = x32UnsignedHi[i] - x32UnsignedLo[i];
    //Top _byte_ has n+ bias
    //Bottom 3 bytes have (b+frac)/2-f(frac-b)^2
    x32IntLo[i] >>>= 1;
    //Top 9 bits has n+bias
    //Bottom 23 bits has  (b+frac)/2-f(frac-b)^2
    //x32Float[i] should have (2^n) * (1+ (b+frac)/2) - correction

		//Perform Newton's method on 32bit float.
    x32UnsignedHi[i] -= 0x3f800000;
    //Top 9 bits has 2n+2bias+b - bias = 2n+b+bias
    //Bottom 23 bits has frac

		// x32FloatLo[i] += x32FloatHi[i] / x32FloatLo[i];
		// x32UnsignedLo[i] -= 0x00800000;
	}

	for(i = 0; i < xSq.length; i++){
		//One 64-bit refinement:
    // x[i] = (x32FloatHi[2*i]+ xSq[i]/x32FloatHi[2*i])/2;
    x[i] = x32FloatLo[2*i];
	}
};
