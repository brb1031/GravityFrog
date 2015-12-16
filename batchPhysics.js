function BruteFrog(maxNumParticles) {
/*This implements the brute force algorithm, O(N_vector ^ 2);
Vector3d should pull from this kinematics buffer.
And Particle will therefore see this transparently.
*/
    "use strict";
    // var that = this;

    this.numColumns = maxNumParticles;
    this.N = this.numColumns;

    this.tView = Float64Array;

    this.rowSize = this.numColumns * this.tView.BYTES_PER_ELEMENT;

    this.initializeWorkspace = function () {
        this.numCells = this.numColumns * this.numColumns;
        this.tableSize = this.numCells * this.tView.BYTES_PER_ELEMENT;

        this.workBuffer = new ArrayBuffer(6 * this.tableSize);

        this.allTables = new this.tView(this.workBuffer);

        this.forces = this.allTables.subarray(0 * this.numCells, 3 * this.numCells);

        this.rSelf = this.allTables.subarray(3 * this.numCells, 6 * this.numCells);

        this.dSquared = this.rSelf.subarray(0 * this.numCells, 1 * this.numCells);
        this.distance = this.rSelf.subarray(1 * this.numCells, 2 * this.numCells);
        this.fMagnitude = this.rSelf.subarray(2 * this.numCells, 3 * this.numCells);
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
    this.allRows = new this.tView(this.b);


    this.x = this.allRows.subarray(0 * this.numColumns, 3 * this.numColumns);
    this.v = this.allRows.subarray(3 * this.numColumns, 6 * this.numColumns);
    this.a = this.allRows.subarray(6 * this.numColumns, 9 * this.numColumns);
    this.aOld = this.allRows.subarray(9 * this.numColumns, 12 * this.numColumns);

    this.aSwap = this.a;

    this.m = this.allRows.subarray(12 * this.numColumns, 13 * this.numColumns);

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
        for (row = 0; row < 3 * f.numCells; row += 3 * f.numColumns) {
            f.forces.set(f.x, row);
        }
    };
    setx(this);

    var setSelfx = function (f) {
        var numElements, numVColumns;
        var selfI;
        numElements = 3 * f.numCells;
        numVColumns = 3 * f.numColumns;

        for (i = 0; i < numElements; i += 3) {
            selfI = (i / numVColumns) >>> 0;
            f.rSelf[i + 0] = f.x[selfI + 0];
            f.rSelf[i + 1] = f.x[selfI + 1];
            f.rSelf[i + 2] = f.x[selfI + 2];
        }
    };
    setSelfx(this);

    var setdxSubtract = function (f) {
        var BLOCK_SIZE = 8;
        var numElements = 3 * f.numCells;

        var iChunked = BLOCK_SIZE * Math.floor(numElements / BLOCK_SIZE);

        for (i = 0; i < iChunked; i += BLOCK_SIZE) {
            f.forces[i + 0] -= f.rSelf[i + 0];
            f.forces[i + 1] -= f.rSelf[i + 1];
            f.forces[i + 2] -= f.rSelf[i + 2];
            f.forces[i + 3] -= f.rSelf[i + 3];
            f.forces[i + 4] -= f.rSelf[i + 4];
            f.forces[i + 5] -= f.rSelf[i + 5];
            f.forces[i + 6] -= f.rSelf[i + 6];
            f.forces[i + 7] -= f.rSelf[i + 7];
        }

        for (i = iChunked; i < numElements; i += 1) {
            f.forces[i + 0] -= f.rSelf[i + 0];
        }
    };
    setdxSubtract(this);


    var setGravityToAwesome = function (f) {
        var rSq;
        var numElements = 3 * f.numCells;

        for (i = 0; i < numElements; i += 3) {
            rSq = 1 / (f.forces[i + 0] * f.forces[i + 0] +
                    f.forces[i + 1] * f.forces[i + 1] +
                    f.forces[i + 2] * f.forces[i + 2]);
            rSq *= Math.sqrt(rSq);
            f.forces[i + 0] *= rSq;
            f.forces[i + 1] *= rSq;
            f.forces[i + 2] *= rSq;
        }
    };
    setGravityToAwesome(this);



    // var setdSquared = function (f) {
    //     var numElements;
    //     var iChunked;
    //     var BLOCK_SIZE = 2;
    //     numElements = f.numCells;
    //     iChunked = BLOCK_SIZE * Math.floor(numElements / BLOCK_SIZE);

    //     var iV = 0;
    //     for (i = iChunked; i < numElements; i += 1) {
    //         f.dSquared[i] = f.forces[iV + 0] * f.forces[iV + 0];
    //         f.dSquared[i] += f.forces[iV + 1] * f.forces[iV + 1];
    //         f.dSquared[i] += f.forces[iV + 2] * f.forces[iV + 2];
    //         iV += 3;
    //     }
    // };

    var calcSquared = function (f) {
        var BLOCK_SIZE = 8;
        var numElements = 3 * f.numCells;

        f.rSelf.set(f.forces);

        var iChunked = BLOCK_SIZE * Math.floor(numElements / BLOCK_SIZE);
        for (i = 0; i < iChunked; i += BLOCK_SIZE) {
            f.rSelf[i + 0] *= f.rSelf[i + 0];
            f.rSelf[i + 1] *= f.rSelf[i + 1];
            f.rSelf[i + 2] *= f.rSelf[i + 2];
            f.rSelf[i + 3] *= f.rSelf[i + 3];
            f.rSelf[i + 4] *= f.rSelf[i + 4];
            f.rSelf[i + 5] *= f.rSelf[i + 5];
            f.rSelf[i + 6] *= f.rSelf[i + 6];
            f.rSelf[i + 7] *= f.rSelf[i + 7];
        }
        for (i = iChunked; i < numElements; i += 1) {
            f.rSelf[i + 0] *= f.rSelf[i + 0];
        }

    };
    calcSquared(this);

    var sumSquaredOptimized = function (f) {
        var iV = 0;
        var numElements = f.numCells;
        for (i = 0; i < numElements; i += 1) {
            f.dSquared[i + 0] = f.rSelf[iV + 0];
            f.dSquared[i + 0] += f.rSelf[iV + 1];
            f.dSquared[i + 0] += f.rSelf[iV + 2];
            iV += 3;
        }
    };
    sumSquaredOptimized(this);

    BruteFrog.prototype.sqrts(this.dSquared, this.distance);



    var scaleInverseCube = function (f) {
        for (i = 0; i < f.numCells; i += 1) {
            f.fMagnitude[i] = 1 / (f.dSquared[i] * f.distance[i]);
        }
    };
    scaleInverseCube(this);

    var scaleM = function (f) {
        for (jScalar = 0; jScalar < f.numColumns; jScalar += 1) {
            for (iScalar = 0; iScalar < f.numCells; iScalar += f.numColumns) {
                f.fMagnitude[iScalar + jScalar] *= f.m[jScalar];
            }
        }
    };
    scaleM(this);

    // scaleMagnitude(this);

    var sumAccels = function (f) {
        f.a.fill(0);
        for (i = 0; i < f.maxNumParticles; i += 1) {
            iVector = 3 * i * f.numColumns;
            for (jVector = 0; jVector < 3 * f.numColumns; jVector += 3) {
                f.a[3 * i + 0] += f.forces[iVector + jVector + 0];
                f.a[3 * i + 1] += f.forces[iVector + jVector + 1];
                f.a[3 * i + 2] += f.forces[iVector + jVector + 2];
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

