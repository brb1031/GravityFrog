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
        return frog;
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

    var setx = function (f) {
        for (row = 0; row < 3 * f.numTableElements; row += 3 * f.numColumns) {
            f.forceTable.set(f.x, row);
        }
    };
    setx(this);
    //Subtract self position to form vector pointing from self to every other:


    var setdxOptimized = function (f) {
        var j = -1;
        var x, y, z;
        var numElements;
        numElements = 3 * f.numTableElements;
        for (i = 0; i < numElements; i += 3) {
            if (!(0)) {
                j += 1;
                x = f.x[j + 0];
                y = f.x[j + 1];
                z = f.x[j + 2];
            }
            f.forceTable[i + 0] -= x;
            f.forceTable[i + 1] -= y;
            f.forceTable[i + 2] -= z;
        }
    };
    setdxOptimized(this);

    // var setdx = function (f) {
    //     for (iVector = 0; iVector < 3 * f.numTableElements; iVector += 3 * f.numColumns) {
    //         for (jVector = 0; jVector < 3 * f.numColumns; jVector += 3) {
    //             f.forceTable[iVector + jVector + 0] -= f.x[iVector + 0];
    //             f.forceTable[iVector + jVector + 1] -= f.x[iVector + 1];
    //             f.forceTable[iVector + jVector + 2] -= f.x[iVector + 2];
    //         }
    //     }
    // };
    // setdx(this);


    //Calculate d^2
    var setdSquaredOptimized = function (f) {
        for (i = 0; i < f.numTableElements; i += 1) {
            f.distSquareTable[i] = f.forceTable[3 * i + 0] * f.forceTable[3 * i + 0];
            f.distSquareTable[i] += f.forceTable[3 * i + 1] * f.forceTable[3 * i + 1];
            f.distSquareTable[i] += f.forceTable[3 * i + 2] * f.forceTable[3 * i + 2];
        }
    };

    setdSquaredOptimized(this);


    BruteFrog.prototype.sqrts(this.distSquareTable, this.distTable);



    var calculateInverseCube = function (f) {
        for (i = 0; i < f.numTableElements; i += 1) {
            f.forceStrengthTable[i] = 1 / (f.distSquareTable[i] * f.distTable[i]);
        }
    };
    calculateInverseCube(this);

    var scaleM = function (f) {
        for (jScalar = 0; jScalar < f.numColumns; jScalar += 1) {
            for (iScalar = 0; iScalar < f.numTableElements; iScalar += f.numColumns) {
                f.forceStrengthTable[iScalar + jScalar] *= f.m[jScalar];
            }
        }
    };
    scaleM(this);

    for (iScalar = 0; iScalar < this.numTableElements; iScalar += this.numColumns) {
        this.forceStrengthTable[iScalar] = 0;
        iScalar += 1; //To follow the diagonal elements.
    }

    var scaleByInverseCubeOptimized = function (f) {
        for (i = 0; i < f.numTableElements; i += 1) {
            f.forceTable[3 * i + 0] *= f.distSquareTable[i];
            f.forceTable[3 * i + 1] *= f.distSquareTable[i];
            f.forceTable[3 * i + 2] *= f.distSquareTable[i];
        }
    };
    scaleByInverseCubeOptimized(this);


    this.a.fill(0);
    var sumAccels = function (f) {
        for (i = 0; i < f.maxNumParticles; i += 1) {
            iVector = 3 * i * f.numColumns;
            for (jVector = 0; jVector < 3 * f.numColumns; jVector += 3) {
                f.a[3 * i + 0] += f.forceTable[iVector + jVector + 0];
                f.a[3 * i + 1] += f.forceTable[iVector + jVector + 1];
                f.a[3 * i + 2] += f.forceTable[iVector + jVector + 2];
            }
        }
    };
    sumAccels(this);
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

