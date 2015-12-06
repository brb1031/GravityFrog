Math.TAU = Math.TAU || 2 * Math.PI;

/*See http://jsperf.com/typed-arrays-set-vs-indices
for the setting of short arrays.
*/

function Vector3d(x, y, z){
  var tView = Float64Array;
  var b = new ArrayBuffer(3 * tView.BYTES_PER_ELEMENT);
  this.v = new tView(b, 0, 3);
  this.v[0] = x;
  this.v[1] = y;
  this.v[2] = z;
  return this;
}

Vector3d.prototype.copy = function(){
  return new Vector3d(this.v[0], this.v[1], this.v[2]);
};

Vector3d.prototype.setXYZ = function(x, y, z){
  this.v[0] = x;
  this.v[1] = y;
  this.v[2] = z;
};

Vector3d.prototype.asXYZ = function(){
  return {x: this.v[0],
      y: this.v[1],
      z: this.v[2]};
};

Vector3d.prototype.fromRThetaPhi = function(r, theta, phi){
  return new Vector3d(
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(theta)
    );
};

Vector3d.prototype.setRThetaPhi = function (r, theta, phi){
  this.v[0] = r * Math.sin(theta) * Math.cos(phi);
  this.v[1] = r * Math.sin(theta) * Math.sin(phi);
  this.v[2] = r * Math.cos(theta);
};

Vector3d.prototype.asRThetaPhi = function(){
  return {r:this.getMagnitude(), theta:this.getTheta(), phi:Math.atan2(this.v[1], this.v[0])};
};

Vector3d.prototype.setVector = function(v){
  this.v.set(v.v);
};

Vector3d.prototype.zeroMe = function(){
  this.v[0] = 0;
  this.v[1] = 0;
  this.v[2] = 0;
};

Vector3d.prototype.getSumSquares = function(){
  //The cheapest "size" measure of a vector.
  return  this.v[0]*this.v[0] +
		      this.v[1]*this.v[1] +
		      this.v[2]*this.v[2];
};

Vector3d.prototype.getMagnitude = function(){
  return Math.sqrt(this.getSumSquares());
};

Vector3d.prototype.getTheta = function(){
  //Theta meaured from north pole.
  // This method avoids a Math.sqrt() call.

  if (this.v[2] === 0) {
    return Math.PI / 2;
  } else {
    var zPositive = this.v[2] > 0;
    //Since cos(x)**2 = 1/2 (cos(2 x)+1)
    var theta = Math.acos(2 * this.v[2]*this.v[2]/this.getSumSquares() - 1) / 2;
    if(zPositive){
      return theta;
    } else {
      return Math.PI - theta;
    }
  }
};

Vector3d.prototype.getPhi = function(){
  //Azimuthal angle.
  //Extremely cheap relative to getting both theta and phi.
  return Math.atan2(this.v[1], this.v[0]);
};

Vector3d.prototype.dot = function(v){
  return  this.v[0]*v.v[0] +
		      this.v[1]*v.v[1] +
		      this.v[2]*v.v[2];
};

Vector3d.prototype.getDistSquared = function(v){
  var dx, dy, dz;
  dx = this.v[0] - v.v[0];
  dy = this.v[1] - v.v[1];
  dz = this.v[2] - v.v[2];
  return dx*dx + dy*dy + dz*dz;
};

Vector3d.prototype.getDistance = function(v){
  return Math.sqrt(this.getDistSquared(v));
};

Vector3d.prototype.getDistCubed = function(v){
  var d = this.getDistance(v);
  return d*d*d;
};

Vector3d.prototype.incrementMe = function(v){
  this.v[0] += v.v[0];
  this.v[1] += v.v[1];
  this.v[2] += v.v[2];
  return this;
};

Vector3d.prototype.decrementMe = function(v){
  this.v[0] -= v.v[0];
  this.v[1] -= v.v[1];
  this.v[2] -= v.v[2];
  return this;
};

Vector3d.prototype.scaleMe = function(a){
  this.v[0] *= a;
  this.v[1] *= a;
  this.v[2] *= a;
  return this;
};

Vector3d.prototype.generateRandomUnitVector = function(){
  // Randomly directed uniformly over sphere.
  var costheta = 2 * Math.random() - 1;
  var sintheta = Math.sqrt(1 - costheta*costheta);
  var phi = Math.TAU * Math.random();
  return new Vector3d(Math.cos(phi)*sintheta, Math.sin(phi)*sintheta, costheta);
};

Vector3d.prototype.generateRandomVector = function(magnitude){
  //Randomly directed, but fixed magnitude:
  var u = Vector3d.prototype.generateRandomUnitVector();
  return u.scaleMe(magnitude);
};

Vector3d.prototype.unitFromAngles = function(theta, phi){
  // Phi is the angle in the x-y plane (called azimuth, like longitude)
  // theta is the angle from the north celestial pole (like latitude, but starts at 0 at pole)
  return Vector3d.prototype.fromRThetaPhi(1, theta, phi);
};

Vector3d.prototype.unitMe = function(){
  var magnitude = this.getMagnitude();
  if (magnitude === 0){
    return this;
  } else {
    return this.scaleMe(1 / magnitude );
  }
};

Vector3d.prototype.unitVector = function(){
  return this.copy().unitMe();
};

Vector3d.prototype.getOpeningAngle = function(v2){
  var u1 = this.unitVector();
  var u2 = v2.unitVector();
  var oppositeSide = u1.decrementMe(u2);
  return Math.acos(1 - oppositeSide.getSumSquares()/2);
};

Vector3d.prototype.cross = function(v2){
  var v1Xv2 = new Vector3d(this.v[1]*v2.v[2] - this.v[2]*v2.v[1],
            -this.v[0]*v2.v[2] + this.v[2]*v2.v[0],
             this.v[0]*v2.v[1] - this.v[1]*v2.v[0]);
  return v1Xv2;
};

Vector3d.prototype.rotateMe = function(rotation){
  if (rotation.pivotPoint) this.decrementMe(rotation.pivotPoint);

  var uRotationAxis = rotation.axis.unitVector();

    var vAxial = this.projectOntoAxis(uRotationAxis);

    var vPlaneParallel = this.projectOntoPlane(uRotationAxis);
    vPlaneParallel.scaleMe(Math.cos(rotation.angle));

    var vPlanePerp = uRotationAxis.cross(this);
    vPlanePerp.scaleMe(Math.sin(rotation.angle));

    this.setVector(vAxial);
    this.incrementMe(vPlaneParallel);
    this.incrementMe(vPlanePerp);

    if (rotation.pivotPoint) this.incrementMe(rotation.pivotPoint);
    return this;
};

Vector3d.prototype.projectOntoAxis = function(axis){
  return axis.copy().scaleMe(axis.dot(this));
};

Vector3d.prototype.projectOntoPlane = function(plane){
  //plane is a Vector3d perpendicular to that plane.
  var projectedV = new Vector3d(this.v[0], this.v[1], this.v[2]);
  //Subtract off the part of the vector perpendicular to the plane:
  projectedV.decrementMe(this.projectOntoAxis(plane));
  return projectedV;
};

Vector3d.prototype.asString = function(){
  return ("Vector3d(" + this.v[0].toPrecision(3) + ", " + this.v[1].toPrecision(3) + ", " + this.v[2].toPrecision(3) + ")");
};


