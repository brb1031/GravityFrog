function BruteFrog(maxNumParticles) {
/*This implements the brute force algorithm, O(N_vector ^ 2);
Vector3d should pull from this kinematics buffer.
And Particle will therefore see this transparently.
*/
    "use strict";
    var that = this;

    this.numColumns = maxNumParticles;
    this.N = this.numColumns;

    this.tView = Float64Array;

    this.rowSize = this.numColumns * this.tView.BYTES_PER_ELEMENT;

    function allocateTViewSpace(buffer, numElements) {
        //Assumes buffer.nextByte exists and is initiallized to zero.
        var bytesDesired = numElements * that.tView.BYTES_PER_ELEMENT;

        var array = new that.tView(buffer,
                buffer.nextByte,
                numElements);

        if (array !== undefined) {
            buffer.nextByte += bytesDesired;
        }

        return array;
    }

    this.initializeWorkspace = function () {
        this.numTableElements = this.numColumns * this.numColumns;
        this.tableSize = this.numTableElements * this.tView.BYTES_PER_ELEMENT;

        this.workBuffer = new ArrayBuffer(6 * this.tableSize);
        this.workBuffer.nextByte = 0;

        this.allTables = new this.tView(this.workBuffer);

        this.forceTable = allocateTViewSpace(this.workBuffer,
                3 * this.numTableElements);

        this.forceStrengthTable = allocateTViewSpace(this.workBuffer,
                1 * this.numTableElements);

        this.distTable = allocateTViewSpace(this.workBuffer,
                1 * this.numTableElements);

        this.distSquareTable = allocateTViewSpace(this.workBuffer,
                1 * this.numTableElements);
    };

    this.copy = function (includeWorkspace) {
        includeWorkspace = includeWorkspace || false;
        var frog = new BruteFrog(this.numColumns);

        frog.allRows.set(this.allRows);

        //Calculation buffers:
        if (includeWorkspace && this.workBuffer) {
            frog.initializeWorkspace();
            frog.allTables.set(this.allTables);
        }
    };


    this.b = new ArrayBuffer(13 * this.rowSize);
    this.b.nextByte = 0;

    this.allRows = new this.tView(this.b);

    this.x = allocateTViewSpace(this.b, 3 * this.numColumns);
    this.v = allocateTViewSpace(this.b, 3 * this.numColumns);
    this.a = allocateTViewSpace(this.b, 3 * this.numColumns);
    this.aOld = allocateTViewSpace(this.b, 3 * this.numColumns);

    this.aSwap = this.a;
    this.m = allocateTViewSpace(this.b, this.numColumns);

    this.workBuffer = null;

}

BruteFrog.prototype.snapshot = function () {
    // Copy only the current state of the particles.  Cannot be evolved.
    "use strict";
    var frog = this.copy();
    frog.leap = function () {
        return false;
    };

    frog.setGravityForce = function () {
        return false;
    };

    return frog;
};

BruteFrog.prototype.clone = function () {
    //Copy the current state along with workspace.
    "use strict";
    return this.copy(true);
};

BruteFrog.prototype.leap = function () {
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

    // if (this.workBuffer === null) {
    //     debugger;
    // }
    this.setGravityForce();

    // this.setExternalForce();

    //Half step V.
    for (i = 0; i < 3 * this.N; i += 1) {
        this.v[i] += this.a[i];
    }
};


BruteFrog.prototype.setGravityForce = function () {
    "use strict";
    var i;
    var row;
    var iScalar, iVector;
    var jScalar, jVector;

    //Set positions. (Bytes)
    for (row = 0; row < 3 * this.tableSize; row += 3 * this.rowSize) {
        this.forceTable.set(this.x, row);
    }

    //Subtract self position to form vector pointing from self to every other:
    for (iVector = 0; iVector < 3 * this.numTableElements; iVector += 3 * this.numColumns) {
        for (jVector = 0; jVector < 3 * this.numColumns; jVector += 3) {
            this.forceTable[iVector + jVector + 0] -= this.x[iVector + 0];
            this.forceTable[iVector + jVector + 1] -= this.x[iVector + 1];
            this.forceTable[iVector + jVector + 2] -= this.x[iVector + 2];
        }
    }

    //Calculate d^2
    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numColumns) {
        iVector = 3 * iScalar;
        for (jScalar = 0; jScalar < this.numTableElements; jScalar += 1) {
            jVector = 3 * jScalar;
            this.distSquareTable[iScalar + jScalar] = this.forceTable[iVector + jVector + 0] * this.forceTable[iVector + jVector + 0] +
                    this.forceTable[iVector + jVector + 1] * this.forceTable[iVector + jVector + 1] +
                    this.forceTable[iVector + jVector + 2] * this.forceTable[iVector + jVector + 2];
        }
    }

    BruteFrog.prototype.sqrts(this.distSquareTable, this.distTable);

    for (i = 0; i < this.numTableElements; i += 1) {
        this.forceStrengthTable[i] = 1 / (this.distSquareTable[i] * this.distTable[i]);
    }


    for (jScalar = 0; jScalar < this.numColumns; jScalar += 1) {
        for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numColumns) {
            this.forceStrengthTable[iScalar + jScalar] *= this.m[jScalar];
        }
    }

    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numColumns) {
        this.forceStrengthTable[iScalar] = 0;
        iScalar += 1; //To follow the diagonal elements.
    }


    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numColumns) {
        iVector = 3 * iScalar;
        for (jScalar = 0; jScalar < this.numColumns; jScalar += 1) {
            jVector = 3 * jVector;
            this.forceTable[iVector + jVector + 0] *= this.distSquareTable[iScalar + jScalar];
            this.forceTable[iVector + jVector + 1] *= this.distSquareTable[iScalar + jScalar];
            this.forceTable[iVector + jVector + 2] *= this.distSquareTable[iScalar + jScalar];
        }
    }

    this.a.fill(0);
    for (i = 0; i < this.maxNumParticles; i += 1) {
        iVector = 3 * i * this.numColumns;
        for (jVector = 0; jVector < 3 * this.numColumns; jVector += 3) {
            this.a[3 * i + 0] += this.forceTable[iVector + jVector + 0];
            this.a[3 * i + 1] += this.forceTable[iVector + jVector + 1];
            this.a[3 * i + 2] += this.forceTable[iVector + jVector + 2];
        }
    }
};

BruteFrog.prototype.sqrts = function (xSq, x) {
    "use strict";
    var i, numElements;
    var BLOCK_SIZE = 4;

    //If not given a place to put result, perform in-place:
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

