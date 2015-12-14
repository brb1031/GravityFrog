function BruteFrog(maxNumParticles) {
/*This implements the brute force algorithm, O(N_vector ^ 2);
Vector3d should pull from this kinematics buffer.
And Particle will therefore see this transparently.
*/
    "use strict";
    this.maxNumParticles = maxNumParticles;
    this.tView = Float64Array;
    this.numRowElements = this.maxNumParticles;
    this.numTableElements = this.maxNumParticles * this.maxNumParticles;
    this.rowSize = this.numRowElements * this.tView.BYTES_PER_ELEMENT;
    this.tableSize = this.numTableElements * this.tView.BYTES_PER_ELEMENT;
    this.b = new ArrayBuffer(16 * this.rowSize);
    this.allRows = new this.tView(this.b, 0);

    var rowOffset = 0;

    this.x = new this.tView(this.b, rowOffset * this.rowSize);
    rowOffset += 3;

    this.v = new this.tView(this.b, rowOffset * this.rowSize);
    rowOffset += 3;

    this.a = new this.tView(this.b, rowOffset * this.rowSize);
    rowOffset += 3;

    this.aOld = new this.tView(this.b, rowOffset * this.rowSize);
    rowOffset += 3;

    this.aSwap = this.a;

    this.m = new this.tView(this.b, rowOffset * this.rowSize);
    rowOffset += 1;

    this.numRows = rowOffset;

    this.forceStrengthTable = new this.tView(this.tableSize);
    this.forceTable = new this.tView(3 * this.tableSize);
    this.distTable = new this.tView(this.tableSize);
    this.distSquareTable = new this.tView(this.tableSize);
}

BruteFrog.prototype.Leap = function () {
//Assumes acceleration calculation has been performed at least once.
    "use strict";
    var i;

    //Half step V.
    for (i = 0; i < 3 * this.N; i += 1) {
        this.v[i] += this.a[i];
    }

    //Full step X.
    for (i = 0; i < 3 * this.N; i += 1) {
        this.x[i] += this.v[i];
    }

    this.aSwap = this.a;
    this.a = this.aOld;
    this.aOld = this.aSwap;

    this.prototype.batchCalcForces();

    //Half step V.
    for (i = 0; i < 3 * this.N; i += 1) {
        this.v[i] += this.a[i];
    }
};


BruteFrog.prototype.batchCalcForces = function () {
    "use strict";
    var i;
    var rowOffset;
    var iScalar, iVector;
    var jScalar, jVector;

    //Set positions. (Bytes)
    for (rowOffset = 0; rowOffset < 3 * this.tableSize; rowOffset += 3 * this.rowSize) {
        this.forceTable.set(rowOffset, this.x);
    }

    //Subtract self position to form vector pointing from self to every other:
    for (iVector = 0; iVector < 3 * this.numTableElements; iVector += 3 * this.numRowElements) {
        for (jVector = 0; jVector < 3 * this.numRowElements; jVector += 3) {
            this.forceTable[iVector + jVector + 0] -= this.x[iVector + 0];
            this.forceTable[iVector + jVector + 1] -= this.x[iVector + 1];
            this.forceTable[iVector + jVector + 2] -= this.x[iVector + 2];
        }
    }

    //Calculate d^2
    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numRowElements) {
        iVector = 3 * iScalar;
        for (jScalar = 0; jScalar < this.numTableElements; jScalar += 1) {
            jVector = 3 * jScalar;
            this.distSquareTable[iScalar + jScalar] = this.forceTable[iVector + jVector + 0] * this.forceTable[iVector + jVector + 0] +
                    this.forceTable[iVector + jVector + 1] * this.forceTable[iVector + jVector + 1] +
                    this.forceTable[iVector + jVector + 2] * this.forceTable[iVector + jVector + 2];
        }
    }

    for (i = 0; i < this.numTableElements; i += 1) {
        this.distTable[i] = Math.sqrt(this.distSquareTable);
        this.forceStrengthTable[i] = 1 / (this.distSquareTable[i] * this.distTable[i]);
    }
    //To be replaced with:
    //Brutefrog.prototype.fasterSqrts(distSquareTable, distTable);


    for (jScalar = 0; jScalar < this.numRowElements; jScalar += 1) {
        for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numRowElements) {
            this.forceStrengthTable[iScalar + jScalar] *= this.m[jScalar];
        }
    }

    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numRowElements) {
        this.distSquareTable[iScalar] = 0;
        iScalar += 1; //To follow the diagonal elements.
    }


    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numRowElements) {
        iVector = 3 * iScalar;
        for (jScalar = 0; jScalar < this.numRowElements; jScalar += 1) {
            jVector = 3 * jVector;
            this.forceTable[iVector + jVector + 0] *= this.distSquareTable[iScalar + jScalar];
            this.forceTable[iVector + jVector + 1] *= this.distSquareTable[iScalar + jScalar];
            this.forceTable[iVector + jVector + 2] *= this.distSquareTable[iScalar + jScalar];
        }
    }

    this.a.fill(0);
    for (i = 0; i < this.maxNumParticles; i += 1) {
        iVector = 3 * i * this.numRowElements;
        for (jVector = 0; jVector < 3 * this.numRowElements; jVector += 3) {
            this.a[3 * i + 0] += this.forceTable[iVector + jVector + 0];
            this.a[3 * i + 1] += this.forceTable[iVector + jVector + 1];
            this.a[3 * i + 2] += this.forceTable[iVector + jVector + 2];
        }
    }

};



BruteFrog.prototype.fasterSqrts = function (xSq, x) {
    "use strict";

    var xSqInt32 = new Int32Array(xSq.buffer, 0);
    var xInt32 = new Int32Array(x.buffer, 0);

    var i;
    var numElements;

    //First order approx | NaN in higher 32bits
    numElements = xInt32.length;
    for (i = 1; i < numElements; i += 2) {
        xInt32[i + 0] = (xSqInt32[i + 0] >> 1) + 0x1ff80000;
        xInt32[i + 0] |= xSqInt32[i + 0] >> 31;
    }


    //2nd order correction in lower 32-bit slot
    numElements = xInt32.length;
    for (i = 0; i < numElements; i += 2) {
        xInt32[i] = (xInt32[i + 1] << 12);
        xInt32[i] >>= 16;
        xInt32[i] *= ~xInt32[i];
        xInt32[i] >>= 16;
        xInt32[i] *= 22488;
        xInt32[i] >>= 12;
        xInt32[i] += xInt32[i + 1];
    }



    // numElements = xSq.length;

};

BruteFrog.prototype.simpleSqrts = function (xSq, x) {
    "use strict";
    //Assume 64 bits,
    var xSqInt32 = new Int32Array(xSq.buffer, 0);
    var xInt32 = new Int32Array(x.buffer, 0);
    var i;
    var numElements;


    numElements = 2 * xSq.length;

    // for (i = 1; i < numElements; i += 2) {
    //     xInt32[i + 0] = (xSqInt32[i + 0] >> 1) + 0x1ff80000;
    // }
    for (i = 1; i < numElements; i += 16) {
        xInt32[i + 0] = (xSqInt32[i + 0] >> 1) + 0x1ff80000;
        xInt32[i + 2] = (xSqInt32[i + 2] >> 1) + 0x1ff80000;
        xInt32[i + 4] = (xSqInt32[i + 4] >> 1) + 0x1ff80000;
        xInt32[i + 6] = (xSqInt32[i + 6] >> 1) + 0x1ff80000;
        xInt32[i + 8] = (xSqInt32[i + 8] >> 1) + 0x1ff80000;
        xInt32[i + 10] = (xSqInt32[i + 10] >> 1) + 0x1ff80000;
        xInt32[i + 12] = (xSqInt32[i + 12] >> 1) + 0x1ff80000;
        xInt32[i + 14] = (xSqInt32[i + 14] >> 1) + 0x1ff80000;
    }

    numElements = xSq.length;
    for (i = 0; i < numElements; i += 1) {
        x[i] += xSq[i] / x[i];
        x[i] /= 2;
        x[i] += xSq[i] / x[i];
        x[i] /= 2;
    //
    }
};



BruteFrog.prototype.wrapperSqrts = function (xSq, x) {
    "use strict";
    var i, numElements;
    var BLOCK_SIZE = 4;

    //If not given a place to put result, do in-place:
    x = x || xSq;

    numElements = BLOCK_SIZE * Math.floor(xSq.length / BLOCK_SIZE);
    for (i = 0; i < numElements; i += BLOCK_SIZE) {
        x[i + 0] = Math.sqrt(xSq[i + 0]);
        x[i + 1] = Math.sqrt(xSq[i + 1]);
        x[i + 2] = Math.sqrt(xSq[i + 2]);
        x[i + 3] = Math.sqrt(xSq[i + 3]);
        // x[i + 4] = Math.sqrt(xSq[i + 4]);
        // x[i + 5] = Math.sqrt(xSq[i + 5]);
        // x[i + 6] = Math.sqrt(xSq[i + 6]);
        // x[i + 7] = Math.sqrt(xSq[i + 7]);
    }

    for (i = numElements; i < xSq.length; i += 1) {
        x[i] = Math.sqrt(xSq[i]);
    }
};

