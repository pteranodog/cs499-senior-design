// ============================= Vector math =============================

function getLength(vector) {
    return(((vector[0]**2) + vector[1]**2)**0.5)
}

function normalize(vector) {
    let length = getLength(vector)
    if (length == 0) {
        console.error("division by 0 attempted on: " + vector)
        return [0,0]
    }
    return [vector[0] / length, vector[1] / length]
}

function add(vector1, vector2) {
    return [vector1[0] + vector2[0], vector1[1] + vector2[1]]
}

function subtract(vector1, vector2) {
    return [vector1[0] - vector2[0], vector1[1] - vector2[1]]
}

function scalarMult(vector, c) {
    return ([vector[0] * c, vector[1] * c])
}

function dotProduct(vector1, vector2) {
    return (vector1[0] * vector2[0]) + (vector1[1] * vector2[1])
}

function closestPointOnSegment(vector, A, B) {
    let AB = subtract(B, A);
    let AQ = subtract(vector, A);
    if (dotProduct(AB, AB) === 0) return A;
    let T = (dotProduct(AQ, AB)) / (dotProduct(AB, AB))
    if (T <= 0) return A;
    else if (T >= 1) return B;
    else return add(A, (scalarMult(AB, T)))
}

function orientationToVector(orientation) {
    return [Math.cos(orientation), Math.sin(orientation)]
}

function clampOreintation(orientation) {
    let result = (orientation) % (6.28);
    if (Math.abs(result) > 3.14) {
        let sign = Math.sign(result);
        result = result - (6.28) * sign;
    }
    return result;
}

// ============================= Steering output =============================

function newSteeringOutput(linear, angular) {
    return { linear, angular }
}

// ============================= Ship update =============================
// Replaces updateMover. Takes a ship and steering output, returns updated ship.

function updateShip(ship, steering, timeStep) {
    let newPos = add(ship.pos, scalarMult(ship.velocity, timeStep));
    
    if (isNaN(newPos[0]) || isNaN(newPos[1])) {
        console.warn('\n\n\n\n\nNaN pos detected:', {
            type: ship.type,
            pos: ship.pos,
            velocity: ship.velocity,
            steering: steering.linear,
            timeStep
        });
        return ship; // bail out without corrupting pos
    }

    let newOrientation = ship.orientation + ship.rotation * timeStep;
    let newVelocity    = add(ship.velocity, scalarMult(steering.linear, timeStep));
    let newRotation    = ship.rotation + steering.angular * timeStep;

    if (getLength(newVelocity) > ship.maxSpeed) {
        newVelocity = scalarMult(normalize(newVelocity), ship.maxSpeed);
    }

    return {
        ...ship,
        pos:         newPos,
        orientation: newOrientation,
        velocity:    newVelocity,
        rotation:    newRotation,
    };
}

// ============================= Behavior constructors =============================
// Only store properties truly belonging to the behavior itself.
// Ship motion properties (maxSpeed, maxAcceleration etc.) live on the ship.
// All constructors accept a weight (0-1) for blended steering.

function newContinue(weight = 1) {
    return { type: 'continue', weight };
}

function newSeek(weight = 1) {
    return { type: 'seek', weight };
}

function newFlee(weight = 1) {
    return { type: 'flee', weight };
}

function newArrive(weight = 1) {
    return { type: 'arrive', weight };
}

function newPursue(maxPrediction, weight = 1) {
    return { type: 'pursue', maxPrediction, weight };
}

function newAlign(weight = 1) {
    return { type: 'align', weight };
}

function newFace(weight = 1) {
    return { type: 'face', weight };
}

function newWander(weight = 1) {
    return { type: 'wander', weight, wanderOrientation: 0 };
}

function newFollowPath(path, pathOffset, weight = 1) {
    return { type: 'followPath', path, pathOffset, currentParam: 0, weight };
}

// ============================= Steering constants =============================

const ARRIVE_TARGET_RADIUS  = 500;
const ARRIVE_SLOW_RADIUS    = 5000;
const ARRIVE_TIME_TO_TARGET = 0.1;

const ALIGN_SLOW_THRESHOLD   = 1.0;
const ALIGN_TARGET_THRESHOLD = 0.2;
const ALIGN_TIME_TO_TARGET   = 0.4;

const WANDER_OFFSET = 10;
const WANDER_RADIUS = 5;
const WANDER_RATE   = 6;

// ============================= Steering functions =============================

function getContinueSteering(ship, behavior) {
    return newSteeringOutput([0, 0], 0);
}

function getSeekSteering(ship, behavior, target) {
    let linear = subtract(target.pos, ship.pos);
    linear = normalize(linear);
    linear = scalarMult(linear, ship.maxAcceleration);
    return newSteeringOutput(linear, 0);
}

function getFleeSteering(ship, behavior, target) {
    let linear = subtract(ship.pos, target.pos);
    linear = normalize(linear);
    linear = scalarMult(linear, ship.maxAcceleration);
    return newSteeringOutput(linear, 0);
}

function getArriveSteering(ship, behavior, target) {
    let direction = subtract(target.pos, ship.pos);
    let distance  = getLength(direction);

    if (distance < ARRIVE_TARGET_RADIUS) {
        return newSteeringOutput([0, 0], 0);
    }

    let targetSpeed = distance > ARRIVE_SLOW_RADIUS
        ? ship.maxSpeed
        : ship.maxSpeed * (distance / ARRIVE_SLOW_RADIUS);

    let targetVelocity = scalarMult(normalize(direction), targetSpeed);
    let linear = subtract(targetVelocity, ship.velocity);
    linear = scalarMult(linear, 1 / ARRIVE_TIME_TO_TARGET);

    if (getLength(linear) > ship.maxAcceleration) {
        linear = scalarMult(normalize(linear), ship.maxAcceleration);
    }

    return newSteeringOutput(linear, 0);
}

function getPursueSteering(ship, behavior, target) {
    let direction = subtract(target.pos, ship.pos);
    let distance  = getLength(direction);
    let speed     = getLength(ship.velocity);

    let prediction = (speed <= distance / behavior.maxPrediction)
        ? behavior.maxPrediction
        : distance / speed;

    let predictedPos = add(target.pos, scalarMult(target.velocity ?? [0,0], prediction));
    let tempTarget   = { pos: predictedPos };

    return getSeekSteering(ship, behavior, tempTarget);
}

function getAlignSteering(ship, behavior, target) {
    let rotation     = target.orientation - ship.orientation;
    rotation         = clampOreintation(rotation);
    let rotationSize = Math.abs(rotation);

    if (rotationSize <= ALIGN_TARGET_THRESHOLD) {
        return newSteeringOutput([0, 0], 0);
    }

    let targetRotation = rotationSize > ALIGN_SLOW_THRESHOLD
        ? ship.maxRotation
        : ship.maxRotation * rotationSize / ALIGN_SLOW_THRESHOLD;

    targetRotation *= rotation / rotationSize;

    let angular = targetRotation - ship.rotation;
    angular /= ALIGN_TIME_TO_TARGET;

    if (Math.abs(angular) > ship.maxAngularAcc) {
        angular = Math.sign(angular) * ship.maxAngularAcc;
    }

    return newSteeringOutput([0, 0], angular);
}

function getFaceSteering(ship, behavior, target) {
    let direction = subtract(target.pos, ship.pos);
    if (getLength(direction) === 0) return newSteeringOutput([0, 0], 0);

    let targetOrientation = Math.atan2(direction[1], direction[0]);
    let tempTarget        = { orientation: targetOrientation };

    return getAlignSteering(ship, behavior, tempTarget);
}

function getWanderSteering(ship, behavior) {
    behavior.wanderOrientation += (Math.random() * 2 - 1) * WANDER_RATE;

    let targetOrientation = behavior.wanderOrientation + ship.orientation;
    let center    = add(ship.pos, scalarMult(orientationToVector(ship.orientation), WANDER_OFFSET));
    let targetPos = add(center, scalarMult(orientationToVector(targetOrientation), WANDER_RADIUS));

    let tempTarget = { pos: targetPos, orientation: 0 };
    let faceResult = getFaceSteering(ship, behavior, tempTarget);
    let linear     = scalarMult(orientationToVector(ship.orientation), ship.maxAcceleration);

    return newSteeringOutput(linear, faceResult.angular);
}

function getFollowPathSteering(ship, behavior) {

    if (!behavior.path || behavior.path.totalLength === 0) {
        return newSteeringOutput([0, 0], 0);
    }

    const newParam = getPathParam(behavior.path, ship.pos);
    const updatedParam = newParam > behavior.currentParam ? newParam : behavior.currentParam;

    // NEW: passing new param by reference
    behavior.currentParam = updatedParam;

    const targetParam = behavior.currentParam + behavior.pathOffset;
    const targetPos   = getPathPosition(behavior.path, targetParam);
    const tempTarget  = { pos: targetPos };

    return getSeekSteering(ship, behavior, tempTarget);
}

// ============================= Master steering dispatcher =============================

function getSteering(ship, behavior, target = null) {
    switch (behavior.type) {
        case 'continue':   return getContinueSteering(ship, behavior);
        case 'seek':       return getSeekSteering(ship, behavior, target);
        case 'flee':       return getFleeSteering(ship, behavior, target);
        case 'arrive':     return getArriveSteering(ship, behavior, target);
        case 'pursue':     return getPursueSteering(ship, behavior, target);
        case 'align':      return getAlignSteering(ship, behavior, target);
        case 'face':       return getFaceSteering(ship, behavior, target);
        case 'wander':     return getWanderSteering(ship, behavior);
        case 'followPath': return getFollowPathSteering(ship, behavior);
        default:
            console.warn('getSteering: unrecognized behavior type:', behavior.type);
            return newSteeringOutput([0, 0], 0);
    }
}

// ============================= Blended steering =============================

function getTotalSteering(ship, behaviors) {
    let totalLinear  = [0, 0];
    let totalAngular = 0;
    let totalWeight  = 0;

    for (const behavior of behaviors) {
        const target   = behavior.target ?? null;
        const steering = getSteering(ship, behavior, target);

        if (isNaN(steering.linear[0]) || isNaN(steering.linear[1])) {
            console.warn('NaN steering from behavior:', behavior.type, 'ship:', ship.type, 'behavior:', behavior);
            continue; // skip this behavior rather than corrupting total
        }

        totalLinear    = add(totalLinear, scalarMult(steering.linear, behavior.weight));
        totalAngular  += steering.angular * behavior.weight;
        totalWeight   += behavior.weight;
    }

    if (totalWeight > 0) {
        totalLinear  = scalarMult(totalLinear, 1 / totalWeight);
        totalAngular = totalAngular / totalWeight;
    }

    if (getLength(totalLinear) > ship.maxAcceleration) {
        totalLinear = scalarMult(normalize(totalLinear), ship.maxAcceleration);
    }

    if (Math.abs(totalAngular) > ship.maxAngularAcc) {
        totalAngular = Math.sign(totalAngular) * ship.maxAngularAcc;
    }

    return newSteeringOutput(totalLinear, totalAngular);
}

// ============================= Path functions =============================

function newPath(points, id) {
    return {
        id,
        points,
        segments:    points.length - 1,
        distances:   new Array(points.length).fill(0),
        params:      new Array(points.length).fill(0),
        totalLength: 0
    }
}

function assemblePath(path) {
    let distances = new Array(path.points.length).fill(0);
    let params    = new Array(path.points.length).fill(0);

    for (let i = 1; i < path.points.length; i++) {
        let seg = subtract(path.points[i], path.points[i - 1]);
        distances[i] = getLength(seg) + distances[i - 1];
    }

    let totalLength = distances.at(-1);

    if (!totalLength || totalLength === 0) {
        return null; // NEW: caller must handle null
    }

    for (let i = 1; i < path.points.length; i++) {
        params[i] = distances[i] / totalLength;
    }

    return { ...path, distances, params, totalLength };
}

function getPathParam(path, point) {
    let leastDist       = Infinity;
    let closestPoint    = [Infinity, Infinity];
    let closestSegIndex = 0;

    for (let i = 1; i < path.params.length; i++) {
        let p = closestPointOnSegment(point, path.points[i], path.points[i - 1]);
        let d = getLength(subtract(point, p));
        if (d < leastDist) {
            leastDist       = d;
            closestPoint    = p;
            closestSegIndex = i - 1;
        }
    }

    let A = path.points[closestSegIndex];
    let B = path.points[closestSegIndex + 1];

    // guard against div by 0
    const AB_length = getLength(subtract(B, A));
    if (AB_length === 0) return path.params[closestSegIndex];
    
    let T = getLength(subtract(closestPoint, A)) / AB_length;


    return path.params[closestSegIndex] + T * (path.params[closestSegIndex + 1] - path.params[closestSegIndex]);
}

function getPathPosition(path, param) {
    if (param <= 0) return path.points[0];
    if (param >= 1) return path.points.at(-1);

    let segIndex = 0;
    for (let i = 1; i < path.params.length; i++) {
        if (path.params[i] > param) { segIndex = i - 1; break; }
    }

    let A = path.points[segIndex];
    let B = path.points[segIndex + 1];
    let T = (param - path.params[segIndex]) / (path.params[segIndex + 1] - path.params[segIndex]);
    return add(A, scalarMult(subtract(B, A), T));
}

// ============================= Exports =============================

export {
    // Vector math
    getLength, normalize, add, subtract, scalarMult, dotProduct,
    closestPointOnSegment, orientationToVector, clampOreintation,
    // Core
    newSteeringOutput, updateShip, getSteering, getTotalSteering,
    // Behavior constructors
    newContinue, newSeek, newFlee, newArrive, newPursue,
    newAlign, newFace, newWander, newFollowPath,
    // Path
    newPath, assemblePath, getPathParam, getPathPosition,
}