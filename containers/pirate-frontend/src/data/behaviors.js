// ============================= 
    function getLength(vector) { // return the magnitude (length) of this vector
        return(((vector[0]**2) + vector[1]**2)**0.5)
    }
    
    function normalize(vector) { // make length = 1; retain direction
        let length = getLength(vector)
        if (length == 0) {
            console.error("division by 0 attmpted on: " + vector)
            return [0,0] // prevent division by 0
        }
        let result = [vector[0] / length, vector[1] / length]
        return result
    }
    
    function add(vector1, vector2) { // add two vectors and return their result
        return [vector1[0] + vector2[0], vector1[1] + vector2[1]]
    }
    
    function subtract(vector1, vector2) { // subtract the second vector from the first and return their result
        return [vector1[0] - vector2[0], vector1[1] - vector2[1]]
    }

    function scalarMult(vector, c) { // multiply vector by a scalar (c)
        return ([vector[0] * c, vector[1] * c])
    } 
        
    
    function dotProduct(vector1, vector2) { // return the dot product of these two vectors
        return (vector1[0] * vector2[0]) + (vector1[1] * vector2[1])
    }
    
    function closestPointOnSegment(vector, A, B){ // return the point on line segment A,B that is closest to the X and Y of this vector
        let AB = subtract(B, A);
        let AQ = subtract(vector, A);

        if (dotProduct(AB, AB) === 0) {
            return A; // prevent division by 0
        }

        let T = (dotProduct(AQ, AB)) / (dotProduct(AB, AB)) // how "far along" AB is AQ's projection?

        if (T <= 0) {
            return A
        }
        else if (T >= 1) { 
            return B
        }
        else {
            return add(A, (scalarMult(AB, T)))
        }
    }

    function orientationToVector(orientation) { // Convert an orientation (number of rads) to its cartesian vector equivalent
        let result = [Math.cos(orientation), Math.sin(orientation)]
        return result
    }



function newKinematic(position, orientation, velocity, rotation) { // returns an obj used to identify a ship's position, orientation, velocity,and rotation
        // position and velocity should be Vector instances, orientation and rotation should be floats
        return {
        pos : position,
        orientation : orientation,
        velocity : velocity,
        rotation : rotation
        }
    }
    
function newSteeringOutput(linear, angular) { // returns an obj used to specify a rate of change in velocity and/or rotation; used in updating mover objs
    return {    
    linear : linear, // linear acceleration (Vector)
    angular : angular // angular acceleration (float)
    }
}

function newMover(initialKinematic, acceleration, maxSpeed, behavior) { // returns an obj that holds all data and methods relevant to a behavior-based moving thing.
    return { // INITIAL values
        // initialKinematic should be a Kinematic object; acceleration should be a vector; maxSpeed, number, ID, behavior should all be numbers
        kinematic : initialKinematic,
        acceleration : acceleration,
        maxSpeed : maxSpeed,
        behavior : behavior,
        isCollided : false
    }

}

function updateMover(mover, steering, maxSpeed, time) {
    let newPos = add(mover.kinematic.pos, scalarMult(mover.kinematic.velocity, time));
    let newOrientation = mover.kinematic.orientation + mover.kinematic.rotation * time;
    let newVelocity = add(mover.kinematic.velocity, scalarMult(steering.linear, time));
    let newRotation = mover.kinematic.rotation + steering.angular * time;

    if (getLength(newVelocity) > maxSpeed) {
        newVelocity = scalarMult(normalize(newVelocity), maxSpeed);
    }

    const newKinematic = {
        pos: newPos,
        orientation: newOrientation,
        velocity: newVelocity,
        rotation: newRotation
    };

    return {
        ...mover,
        kinematic: newKinematic,
        behavior: {
            ...mover.behavior,
            k1: newKinematic  // keep k1 in sync w/ updated kinematic
        },
        acceleration: steering.linear
    };
}

function newContinue(k1) { // behavior obj; a mover keeping its current trajectory; no change in orientation or velocity
    return {
        k1 : k1, // k1 = character to continue
        type: "continue"
    }
}

function getContinueSteering(continueBehavior) {
    return newSteeringOutput([0,0], 0); // no change to steering
}


function newSeek(k1, k2, maxAcceleration) { // Mover advances directly towards a target
    // identify which mover is seeking to which, and give max acceleration
    return {
        k1: k1,
        k2: k2,
        maxAcceleration: maxAcceleration,
        type: "seek"
    }
}

function getSeekSteering(seekBehavior) {
    // initialize steering output args
    let linear;
    let angular;

    linear = subtract(seekBehavior.k2.pos, seekBehavior.k1.pos); // get difference between target pos and pos of mover we want to steer
    linear = normalize(linear);
    linear = scalarMult(linear, seekBehavior.maxAcceleration); // set the magnitude of this acceleration vector to the maximum

    angular = 0;

    return newSteeringOutput(linear, angular); // initialize output
}

function newFlee(k1, k2, maxAcceleration) { // Mover travels directly away from a target
    return { // identify which mover is fleeing from which
        k1 : k1, // k1 = mover that will be fleeing
        k2 : k2, // k2 = target (mover being fled from)
        maxAcceleration : maxAcceleration,
        type: "flee"
    }
}

function getFleeSteering(fleeBehavior) {
    // initialize steering output args
    let linear;
    let angular;

    linear = subtract(fleeBehavior.k1.pos, fleeBehavior.k2.pos); // get difference between target pos and pos of mover we want to steer (inverted args between seek/flee)
    linear = normalize(linear);
    linear = scalarMult(linear, fleeBehavior.maxAcceleration); // set the magnitude of this acceleration vector to the maximum

    angular = 0;
    return newSteeringOutput(linear, angular)
}
    
function newArrive(k1, k2, maxAcceleration, maxSpeed, targetRadius, slowRadius) { // Send a mover towards a target, slowing down as it gets close to the target
    return { // identify which mover is arriving to which; give radii and max speed/acceleration
        k1 : k1, //k1 = mover to steer
        k2 : k2, //k2 = target
        maxAcceleration : maxAcceleration,
        maxSpeed : maxSpeed,
        targetRadius : targetRadius,
        slowRadius : slowRadius,
        timeToTarget : 0.1,
        type: "arrive"
    }
}

function getArriveSteering(arriveBheavior) {
    // initialize steering output args
    let linear;
    let angular;

    let direction = subtract(arriveBheavior.k2.pos,arriveBheavior.k1.pos); // get difference between target pos and pos of mover we want to steer; this time, save separately as a direction
    let distance = getLength(direction); // save distance between the two
        
    if (distance < arriveBheavior.targetRadius) { // has this mover reached its target? 
        return newSteeringOutput([0,0], 0); // if so, no need to steer; return a 0 steering output
    }

    let targetSpeed; // changed to compute locally instead of storing on behavior

    if (distance > arriveBheavior.slowRadius) { // is this mover far away enough from its target that it doesn't need to start slowing down (to prevent overshot)?
        targetSpeed = arriveBheavior.maxSpeed; // if so, stay at max speed
    }
    else { // if not, slow down:
        targetSpeed = arriveBheavior.maxSpeed * (distance / arriveBheavior.slowRadius);
    }

    // combine the direction of the difference in position with the speed obtained from the logic above to obtain a new velocity 
    let targetVelocity = direction;
    targetVelocity = normalize(targetVelocity);
    targetVelocity = scalarMult(targetVelocity, targetSpeed);

    // finally, use this new velocity and the given time to get the new acceleration
    linear = subtract(targetVelocity, arriveBheavior.k1.velocity);
    linear = scalarMult(linear, (arriveBheavior.timeToTarget)**-1);

    // if acceleration's magnitude is above max, correct it
    if (getLength(linear) > arriveBheavior.maxAcceleration) {
        linear = normalize(linear);
        linear = scalarMult(linear, arriveBheavior.maxAcceleration);
    }
    
    angular = 0;
    return newSteeringOutput(linear, angular);
}

function newPursue (k1, k2, maxAcceleration, maxPrediction) { //extends Seek  // Similar to seek, except predicts where target is going and sends the subject mover towards that point
    // REMINDER: k1 is the pursuer, k2 is the target (via Seek implementation)
    let result = newSeek(k1, k2, maxAcceleration);
    result.type = "flee"; // override type
    // Make new target obj to override Seek's with later
    let pursuedTarget = {
            pos: [0,0],
            orientation: 0
        }
    result.pursuedTarget = pursuedTarget;
    result.maxPrediction = maxPrediction;
    return result;
}


function getPursueSteering(pursueBehavior) {
    // First, compute target data as a prediction
    let direction = subtract(pursueBehavior.k2.pos, pursueBehavior.k1.pos);
    let distance = getLength(direction);

    let speed = getLength(pursueBehavior.k1.velocity); // record subject mover's current speed
    let prediction; // init here so it can be modified from within if-else

    // Is that speed too slow for a reasonable prediction?
    if (speed <= distance / pursueBehavior.maxPrediction) {
        prediction = pursueBehavior.maxPrediction; // if so, look as far ahead as possible
    }
    else {
        prediction = distance / speed; // otherwise calculate prediction time normally
    }

    // now get predicted position 
    let predictedPos = add(pursueBehavior.k2.pos, scalarMult(pursueBehavior.k2.velocity, prediction));

    // finally, construct a temporary target object
    let pursuedTarget = {
        pos: predictedPos
    };

    // create a temporary behavior object for Seek to make steering with
    let tempSeek = {
        k1: pursueBehavior.k1,
        k2: pursuedTarget,
        maxAcceleration: pursueBehavior.maxAcceleration
    };

    let result = getSeekSteering(tempSeek);
        
    return result;
}



function clampOreintation (orientation) { // Returns a clamped orientation value (rotation angle in rads) of a particular Kinematic instance to a [-pi, pi] boundary
    let result = (orientation) % (6.28);

    if(Math.abs(result) > 3.14) {
        let sign = Math.sign(result);
        result = result - (6.28) * sign;
    }
    return result;
}



function newAlign(k1, k2, maxAngularAcc, maxRotation, slowThreshold, targetThreshold) { // Align the movement of one mover with the movement of another
    return {
        k1 : k1, // The Kinematic of the mover to be aligned. (Henceforth called "Focused Mover")
        k2 : k2, // The Kinematic of mover whose orientation is being aligned to by the previous.
        maxAngularAcc : maxAngularAcc, // The max rate of change of the rotation rate of the mover to be aligned.
        maxRotation : maxRotation, // The max rate of change of the orientation (in rads) of the mover to be aligned.
        slowThreshold : slowThreshold, // When the focused mover's orientation is within this many rads of the target's, slow down rotation
        targetThreshold : targetThreshold, // When the focused mover's orientation is within this many rads of the target's, stop rotating entirely
        // NOTE ABOUT THRESHOLD VALUES: These are important for making the behaviors "smooth"; my advice is to not make targetThreshold <0.2 and
        // not to make slowThreshold <0.5. Their stability also depends on rotation speed/ acc; so be careful w/ those values too
        timeToTarget : 0.4, // Time over which to achieve target orientation (NOTE: could need tweaked/ made variable?)
        type: "flee"
    }
}

function getAlignSteering(alignBehavior) {
    // initialize steering output args
    let linear;
    let angular;

    // Get the naïve rotation to match the target
    let rotation = alignBehavior.k2.orientation - alignBehavior.k1.orientation;

    // Clamp to [-pi, pi]
    rotation = clampOreintation(rotation);
    let rotationSize = Math.abs(rotation);

    // Test for arrival
    if (rotationSize <= alignBehavior.targetThreshold) {
        angular = 0;
        linear = [0, 0];
        return newSteeringOutput(linear, angular);
    }

    let targetRotation = 0;

    // Test for max rotation
    if (rotationSize > alignBehavior.slowThreshold) {
        targetRotation = alignBehavior.maxRotation;
    }
    else {
        targetRotation =
            alignBehavior.maxRotation *
            rotationSize /
            alignBehavior.slowThreshold;
    }
    
    // make targetRotation combine speed and direction
    targetRotation *= rotation / rotationSize;

    // Accelerate to target rotation
    angular = targetRotation - alignBehavior.k1.rotation;
    angular /= alignBehavior.timeToTarget;

    // Test for > max acceleration
    let angAcc = Math.abs(angular);
    if (angAcc > alignBehavior.maxAngularAcc) {
        angular /= angAcc;
        angular *= alignBehavior.maxAngularAcc;
    }

    linear = [0,0];
    return newSteeringOutput(linear, angular);
}

function newFace(k1, k2, maxAngularAcc, maxRotation, slowThreshold, targetThreshold) { // Face a mover towards another mover
    // We just need to change the target field after calling Align (because we want to face towards it, not align with its movement); all else stays the same
    // That is to say: constructor params serve the same prupose as they do in Align, so see Align's constructor for info on those
    let result = newAlign(k1, k2, maxAngularAcc, maxRotation, slowThreshold, targetThreshold);
    result.type = "face";
    return result;
}

function getFaceSteering(faceBehavior) {
    // Compute direction vector from subject to target
    let direction = subtract(faceBehavior.k2.pos, faceBehavior.k1.pos);
    
    if (getLength(direction) == 0) {
        return newSteeringOutput([0,0], 0);
    }

    // Compute desired orientation to face the target
    let targetOrientation = Math.atan2(direction[1], direction[0]);

    // create a tempAlign behavior 
    let alignCopy = {
        ...faceBehavior, // copy all other behavior fields
        k2: { ...faceBehavior.k2, orientation: targetOrientation } // BUT override orientation
    };

    // Let Align take it from here
    return getAlignSteering(alignCopy);
}

function newWander(k1, maxAcceleration, maxAngularAcc, maxRotation, slowThreshold, targetThreshold, maxSpeed) {
    // note the lack of a target kinematic, since the "target" is a defined distance
    // Once more, see Align's constructor's comments for info on the constructor's args (maxSpeed included here since we introduce linear movement now)
    // Initiate target object for parent behaviors to use
    let target = {
        pos: [0,0],
        orientation: 0
    }

    let result = newFace(k1, target, maxAngularAcc, maxRotation, slowThreshold, targetThreshold);
    result.type = "wander";
    result.maxSpeed = maxSpeed; // linear movement introduced, so a maximum speed is specified

    // NOTE: hardcoded values; normally they'd be set by args of the constructor but this behavior should be more consistent 
    result.wanderOffset = 10; // forward offset from character of wander circle
    result.wanderRadius = 5; // radius of wander circle
    result.wanderRate = 6; // maximum wander orientation change
    result.wanderOrientation = 0; // holds current orientation of wander target; init at 0? i think?
    result.maxAcceleration = maxAcceleration; // max LINEAR acceleration; not used by super, rather by this specific behavior

    return result;
}


function getWanderSteering(wanderBehavior) {
    // Update wander orientation
    let wanderOrientation =
        wanderBehavior.wanderOrientation +
        (Math.random() * 2 - 1) * wanderBehavior.wanderRate;
    
    // Get the orientation we want to achieve
    let targetOrientation =
        wanderOrientation + wanderBehavior.k1.orientation;

    // Calculate center of wander circle's pos
    let center = add(
        wanderBehavior.k1.pos,
        scalarMult(
            orientationToVector(wanderBehavior.k1.orientation),
            wanderBehavior.wanderOffset
        )
    );

    // From there, find the target's location
    let targetPos = add(
        center,
        scalarMult(
            orientationToVector(targetOrientation),
            wanderBehavior.wanderRadius
        )
    );

    // create temp target for Face
    let tempTarget = {
        pos: targetPos,
        orientation: 0
    };

    // add temp Face behavior input fields
    let tempFaceBehavior = {
        k1: wanderBehavior.k1,
        k2: tempTarget,
        maxAngularAcc: wanderBehavior.maxAngularAcc,
        maxRotation: wanderBehavior.maxRotation,
        slowThreshold: wanderBehavior.slowThreshold,
        targetThreshold: wanderBehavior.targetThreshold,
        timeToTarget: wanderBehavior.timeToTarget
    };

    // let Face compute angular steering
    let faceResult = getFaceSteering(tempFaceBehavior);

    // Add linear acceleration 
    let linear = scalarMult(
        orientationToVector(wanderBehavior.k1.orientation),
        wanderBehavior.maxAcceleration
    );

    return newSteeringOutput(linear, faceResult.angular);
}
    
function newFollowPath(path, pathOffset, currentParam, k1, maxAcceleration) { // Advance a mover along a Path
    // no target kinematic needed in init; determined by other data
    let k2 = newKinematic([0,0], 0, [0,0], 0); // placeholder target kinematic so parent init can be called
    let result = newSeek(k1, k2, maxAcceleration); // init parent behavior (Seek)
    result.path = path; // output from newPath()
    result.pathOffset = pathOffset; // wait what does this do again im dumb
    result.currentParam = currentParam; // parametrized distance along the path, being "aimed at"
    result.maxAcceleration = maxAcceleration;
    result.type = "followPath"
    return result;
}
    
function getFollowPathSteering(followPathBehavior) {
    // Recalculate where we are on the path from current position
    const newParam = getPathParam(followPathBehavior.path, followPathBehavior.k1.pos);
    console.log('newParam:', newParam, '| currentParam:', followPathBehavior.currentParam);
    
    // Only advance currentParam forward, never let it go backward
    // This prevents latching onto a closer point on the return leg
    if (newParam > followPathBehavior.currentParam) {
        followPathBehavior.currentParam = newParam;
    }

    const targetParam = followPathBehavior.currentParam + followPathBehavior.pathOffset;
    const targetPos = getPathPosition(followPathBehavior.path, targetParam);
    console.log('targetPos:', targetPos, '| ship pos:', followPathBehavior.k1.pos);

    const tempSeekBehavior = {
        k1: followPathBehavior.k1,
        k2: { ...followPathBehavior.k2, pos: targetPos },
        maxAcceleration: followPathBehavior.maxAcceleration
    };

    return getSeekSteering(tempSeekBehavior);
}

function newPath(points, id) {  // functions as the path data structure necessary to implement path following
    return {
        id : id, // simple numerical identifier
        points : points, // will be a collection of Vectors
        segments : points.length - 1, // NUMBER OF segments
        distances : new Array(points.length).fill(0), // at each point, the sum of segment lengths leading up to that point
        params : new Array(points.length).fill(0), // will hold parametrizations (0-1) of distances
        totalLength : 0 // used in parametrization
    }
}
        
function assemblePath(path) {
    let distances = new Array(path.points.length).fill(0);
    let params = new Array(path.points.length).fill(0);

    for (let i = 1; i < path.points.length; i++) {
        let seg = subtract(path.points[i], path.points[i - 1]);
        let segLength = getLength(seg);
        distances[i] = segLength + distances[i - 1];
    }

    let totalLength = distances.at(-1);

    for (let i = 1; i < path.points.length; i++) {
        params[i] = distances[i] / totalLength;
    }

    return {
        ...path,
        distances: distances,
        params: params,
        totalLength: totalLength
    };
}

function getPathParam(path, point) {
    let leastDist = Infinity; // track the lowest distance seen
    let closestPoint = [Infinity, Infinity]; // track the closest point on the path to the given point
    let closestSegIndex = 0; // track index of closest 
    
    for (let i = 1; i < path.params.length; i++ ) { // find the closest point on the path
        let p = closestPointOnSegment(point, path.points[i], path.points[i-1]);
        let d = getLength(subtract(point, p));
        if (d < leastDist) {
            leastDist = d;
            closestPoint = p;
            closestSegIndex = i - 1;
        }
    }
    let A = path.points[closestSegIndex]; // line AB is the segment the segment on which the closest point to the input point lies
    let B = path.points[closestSegIndex + 1];
    let T = getLength(subtract(closestPoint, A)) / getLength(subtract(B, A)); // how far along this segment?
    let C = path.params[closestSegIndex] + T * (path.params[closestSegIndex + 1] - path.params[closestSegIndex]);
    return C;
}

function getPathPosition(path, param) {
    // return the vector that is the given parametrized distance along the given path
    // edge case handling
    if (param <= 0) {
        
        return path.points[0];
    }
    if (param >= 1) {
        return path.points.at(-1); // so js doesnt have normal negative arr indexing like python but the at method does??? why???
    }
    let segIndex = 0; // index of this Path's param that is directly ahead of the given param (i.e. given param lies between params[this] and params[this + 1])
    for (let i = 1; i < path.params.length; i++ ) {  // find which params the given param lies between
        if (path.params[i] > param) {
            segIndex = i - 1;
            break;
        }
    }
    let A = path.points[segIndex];
    let B = path.points[segIndex + 1]; // given param lies somewhere on segment AB
    let T = (param - path.params[segIndex])  / (path.params[segIndex + 1] - path.params[segIndex]); // how far along this segment?
    let P = add(A, scalarMult(subtract(B, A),T));
    return P;
}

function getSteering(behavior) {  // "Master" getSteering function to be called by step function, so it can just call this on every ship 
    switch (behavior.type) {
        case "seek":
            return(getSeekSteering(behavior));
        case "flee":
            return(getFleeSteering(behavior));
        case "arrive":
            return(getArriveSteering(behavior));
        case "face":
            return(getFaceSteering(behavior));
        case "align":
            return(getAlignSteering(behavior));
        case "wander":
            return(getWanderSteering(behavior));
        case "continue":
            return(getContinueSteering(behavior));
        case "followPath":
            return(getFollowPathSteering(behavior));
        case "pursue":
            return(getPursueSteering(behavior))
        default:
            console.log("getSteering error: Unrecognized behavior. Returning default 0 steering")
            return(newSteeringOutput([0,0],0))
    }
}
// ============================= Export everything =============================
// NOTE: import like this: 
// import * as Behaviors from "../data/behaviors.js";
// then instantiate/call like this: 
// let testArriver = new Behaviors.Mover(...)
// c = Behaviors.clampOreintation(...)

export  {getLength, normalize, add, subtract, scalarMult, dotProduct, closestPointOnSegment, orientationToVector, clampOreintation, newMover, newKinematic, newSteeringOutput, newSeek, newFlee,
    newArrive, newPursue, newPath, newFollowPath, newWander, newFace, newAlign, newContinue, updateMover, assemblePath, getSteering, getPathParam}

