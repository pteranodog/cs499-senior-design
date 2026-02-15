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
        result = [vector[0] / length, vector[1] / length]
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
        return (vector1[0] * vector2[0]) + (vector1[1] + vector2[1])
    }
    
    function closestPointOnSegment(vector, A, B){ // return the point on line segment A,B that is closest to the X and Y of this vector
        AB = subtract(B, A)
        AQ = subtract(vector, A)

        T = (dotProduct(AQ, AB)) / (dotProduct(AB, AB)) // how "far along" AB is AQ's projection?

        if (T <= 0) {
            return 
        }
        else if (T >= 1) { 
            return B
        }
        else {
            return add(A, (scalarMult(AB, T)))
        }
    }



class Kinematic { // class used to identify a ship's position, orientation, velocity,and rotation
    constructor(position, orientation, velocity, rotation) {
        // position and velocity should be Vector instances, orientation and rotation should be floats
        this.pos = position
        this.orientation = orientation
        this.velocity = velocity
        this.rotation = rotation
    }
}
    
class SteeringOutput { // class used to specify a rate of change in velocity and/or rotation; used in Mover's update() method
    constructor(linear, angular) {
        this.linear = linear // linear acceleration (Vector)
        this.angular = angular // angular acceleration (float)
    }
}

class Mover { // Holds all data and methods relevant to a behavior-based moving thing.
    constructor(initialKinematic, acceleration, maxSpeed, behavior) { // INITIAL values
        // initialKinematic should be a Kinematic instance; acceleration should be a Vector instance; maxSpeed, number, ID, behavior should all be numbers
        this.kinematic = initialKinematic
        this.acceleration = acceleration
        this.maxSpeed = maxSpeed
        this.behavior = behavior
        this.isCollided = False
    }

    update(steering, maxSpeed, time) {
        this.kinematic.pos = add(this.kinematic.pos, scalarMult(this.kinematic.velocity, time)) // advance position according to velocity
        this.kinematic.orientation += this.kinematic.rotation * time // change orientation according to rotation

        this.kinematic.velocity = add(this.kinematic.velocity, scalarMult(steering.linear,time)) // increase velocity according to acceleration
        this.kinematic.rotation += steering.angular * time // increase rotation according to angular acceleration

        this.acceleration = steering.linear // update this movers own acceleration value

        if (getLength(this.kinematic.velocity) > maxSpeed) { // is this mover going above their max speed?
            this.kinematic.velocity = normalize(this.kinematic.velocity.normalize)
            this.kinematic.velocity = scalarMult(this.kinematic.velocity, maxSpeed) // if so, return to max speed
        }
    }
}

class Seek { // Mover advances directly towards a target
    constructor(moverKinematic, targetKinematic, maxAcceleration) {  // identify which mover is seeking to which, and give max acceleration
        this.k1 = moverKinematic //k1 = mover to steer
        this.k2 = targetKinematic //k2 = target
        this.maxAcceleration = maxAcceleration
    }
    
    getSteering() { // output of this method used as an argument in update function of mover
        result = SteeringOutput() // initialize output

        result.linear = subtract(this.k2.pos, this.k1.pos) // get difference between target pos and pos of mover we want to steer
        result.linear = normalize(result.linear)
        result.linear = scalarMult(result.linear, this.maxAcceleration) // set the magnitude of this acceleration vector to the maximum

        result.angular = 0
        return result
    }
}

class Flee { // Mover travels  directly away from a target
    constructor(moverKinematic, targetKinematic, maxAcceleration) { // identify which mover is fleeing from which, and give max acceleration
        this.k1 = moverKinematic // k1 = mover that will be fleeing
        this.k2 = targetKinematic // k2 = target (mover being fled from)
        this.maxAcceleration = maxAcceleration
    }
    
    getSteering() { // output of this function used as an argument in update function of mover
        result = SteeringOutput() // initialize output

        result.linear = this.k1.pos.subtract(this.k2.pos) // get difference between target pos and pos of mover we want to steer (inverted args between seek/flee)
        result.linear = result.linear.normalize()
        result.linear = result.linear.scalarMult(this.maxAcceleration) // set the magnitude of this acceleration vector to the maximum

        result.angular = 0
        return result
    }
}
    
class Arrive { // Send a mover towards a target, slowing down as it gets close to the target
    constructor(moverKinematic, targetKinematic, maxAcceleration, maxSpeed, targetRadius, slowRadius) { // identify which mover is arriving to which; gice radii and max speed/acceleration
        this.k1 = moverKinematic //k1 = mover to steer
        this.k2 = targetKinematic //k2 = target
        this.maxAcceleration = maxAcceleration
        this.maxSpeed = maxSpeed
        this.targetRadius = targetRadius
        this.slowRadius = slowRadius
        this.timeToTarget = 0.1
    }

    
    getSteering(this) {  // output of this function used as an argument in update function of mover
        result = SteeringOutput() // initialize output

        direction = subtract(this.k2.pos,this.k1.pos) // get difference between target pos and pos of mover we want to steer; this time, save separately as a direction
        distance = getLength(direction) // save distance between the two
        
        if (distance < this.targetRadius) { // has this mover reached its target?
            this.k1.isCollided = True
            return SteeringOutput([0,0], 0) // if so, no need to steer; return a 0 steering output
        }
        if (distance > this.slowRadius) { // is this mover far away enough from its target that it doesn't need to start slowing down (to prevent overshot)?
            this.targetSpeed = this.maxSpeed // if so, stay at max speed
        }
        else { // if not, slow down:
            this.targetSpeed = this.maxSpeed * (distance / this.slowRadius)
        }

        // combine the direction of the difference in position with the speed obtained from the logic above to obtain a new velocity 
        targetVelocity = direction
        targetVelocity = normalize(targetVelocity)
        targetVelocity = scalarMult(targetVelocity, this.targetSpeed)

        // finally, use this new velocity and the given time to get the new acceleration
        result.linear = subtract(targetVelocity, this.k1.velocity)
        result.linear = scalarMult(result.linear, (this.timeToTarget)**-1)

        // if acceleration's magnitude is above max, correct it
        if (getLength(result.linear) > this.maxAcceleration) {
            result.linear = normalize(result.linear)
            result.linear = scalarMult(result.linear, this.maxAcceleration)
        }
        
        result.angular = 0
        return result
    }
}

class Pursue extends Seek {
    
}

function clampOreintation (orientation) { // Returns a clamped orientation value (rotation angle in rads) of a particular Kinematic instance to a [-pi, pi] boundary
    result = (orientation) % (6.28) 

    if(Math.abs(result) > 3.14) {
        sign = Math.sign(result)
        result = result - (6.28) * sign
    }
    return result
}

class Align { // Align the movement of one mover with the movement of another
    constructor(moverKinematic, targetKinematic, maxAngularAcc, maxRotation, slowThreshold, targetThreshold) {
        this.moverKinematic = moverKinematic // The Kinematic of the mover to be aligned. (Henceforth called "Focused Mover")
        this.targetKinematic = targetKinematic // The Kinematic of mover whose orientation is being aligned to by the previous.
        this.maxAngularAcc = maxAngularAcc // The max rate of change of the rotation rate of the mover to be aligned.
        this.maxRotation = maxRotation // The max rate of change of the orientation (in rads) of the mover to be aligned.
        this.slowThreshold = slowThreshold // When the focused mover's orientation is within this many rads of the target's, slow down rotation
        this.targetThreshold = targetThreshold // When the focused mover's orientation is within this many rads of the target's, stop rotating entirely
        this.timeToTarget = 0.1 // Time over which to achieve target orientation (NOTE: could need tweaked/ made variable?)
    }

    getSteering() { // output of this function used as an argument in update function of mover
        result = SteeringOutput() // initialize output

        // Get the naïve rotation to match the target
        let rotation = this.targetKinematic.orientation - this.moverKinematic.orientation

        // Clamp to [-pi, pi] 
        rotation = clampOreintation(rotation)
        let rotationSize = Math.abs(rotation)

        // Test for arrival
        if (rotationSize < this.targetThreshold) {
            return null
        }

        let targetRotation = 0

        // Test for max rotation
        if (rotationSize > this.slowThreshold) {
            targetRotation = this.maxRotation
        }
        else { // Between intervals, scale rotation to slow down
            targetRotation = this.maxRotation * rotationSize / slowRadius
        }
        
        // make targetRotation combine speed and direction
        targetRotation *= rotation/rotationSize

        // Accelerate to target rotation
        result.angular = targetRotation - this.moverKinematic.rotation
        result.angular /= this.timeToTarget

        // Test for > max acceleration
        let angAcc = Math.abs(result.angular)
        if (angAcc > this.maxAngularAcc) {
            result.angular /= angAcc // Set to magnitude 1, keeping sign
            result.angular *= this.maxAngularAcc // Set back to max
        }

        result.linear = 0
        return result
    }
}

class Face extends Align { // Face a mover towards another mover
    constructor(moverKinematic, targetKinematic, maxAngularAcc, maxRotation, slowThreshold, targetThreshold) {
        // We just need to change the target field after calling Align (because we want to face towards it, not align with its movement); all else stays the same
        super(moverKinematic, targetKinematic, maxAngularAcc, maxRotation, slowThreshold, targetThreshold)
    }

        getSteering() {
            let direction = targetKinematic.pos - moverKinematic.pos // Direction and distance vector between subject mover and target mover

            if (length(direction) == 0) {
                result = SteeringOutput(0, 0)
                return result
            }
            faceTarget = this.targetKinematic
            faceTarget.orientation = Math.atan2(direction[0], direction[1])

            return super.getSteering()
        }
}


class Wander extends Face {
    constructor(moverKinematic, maxAcceleration, maxAngularAcc, maxRotation, slowThreshold, targetThreshold) { // note the lack of a target kinematic, since the "target" is a defined distance
        // Initiate target object for parent behaviors to use
        let target = {
            pos: [0,0],
            orientation: 0
        }

        super(moverKinematic, target, maxAngularAcc, maxRotation, slowThreshold, targetThreshold)

        // NOTE: hardcoded values; normally they'd be set by args of the constructor but rn im desperate to just FINISH this; might make sense for other args to  be hardcoded? idk
        this.wanderOffset = 60 // forward offset from character of wander circle
        this.wanderRadius = 10// radius of wander circle
        this.wanderRate = 8 // maximum wander orientation change
        this.wanderOrientation = float // holds current orientation of wander target
        this.maxAcceleration = maxAcceleration // max LINEAR acceleration; not used by super, rather by this specific behavior
    }

    getSteering() {
        // Update wander orientation

        // Jiggle target randomly

    }
}


    
class FollowPath { // Advance a mover along a Path
    constructor(path, pathOffset, currentParam, moverKinematic, maxAcceleration): // no target kinematic needed in init; determined by other data
        this.path = path
        this.pathOffset = pathOffset
        this.currentParam = currentParam

        targetKinematic = Kinematic(Vector(0, 0), 0, Vector(0, 0), 0) // placeholder target kinematic so parent init can be called

        super().__init__(moverKinematic, targetKinematic, maxAcceleration) // init parent class (Seek)

    function getSteering(this):
        // find my path param
        this.currentParam = this.path.getParam(this.k1.pos)

        // offset: how far ahead (along path) to seek to?
        this.targetParam = this.currentParam + this.pathOffset

        // set actual target pos to the pos of the target path param
        this.k2.pos = this.path.getPosition(this.targetParam)

        // now get Seek's steering to steer towards that param pos ("my" position and target's position are now set)
        return super().getSteering()
}
    
class Path: // functionines the path data structure necessary to implement path following
    function __init__(this, points, id):
        this.id = id
        this.points = points // will be a collection of Vectors
        this.segments = len(points) - 1
        this.distances = [0] * (this.segments + 1)
        this.params = [0] * (this.segments + 1) // will hold parametrizations (0-1) of distances
        this.totalLength = 0 // used in parametrization

    function assemble(this): // Iterates through this path's points and assigns values to data members accordingly
        for i in range(1, len(this.points)): // find length of each segment
            thisSeg = this.points[i].subtract(this.points[i-1])
            thisSegLength = thisSeg.getLength()
            this.distances[i] = thisSegLength + this.distances[i-1]

        this.totalLength = this.distances[-1] // last member of distances holds total path distance

        for i in range(1, len(this.points)): // get parametrized lengths
            this.params[i] = this.distances[i] / this.totalLength // 0 -1    

    function getPosition(this, param): // return the vector that is the given parametrized distance along the given path
        // edge case handling
        if param <= 0:
            return this.points[0]
        if param >= 1:
            return this.points[-1]
        
        segIndex = 0 // index of this Path's param that is directly ahead of the given param (i.e. given param lies between params[this] and params[this + 1])
        for i in range(1, len(this.params)):  // find which params the given param lies between
            if this.params[i] > param:
                segIndex = i - 1
                break
        A = this.points[segIndex]
        B = this.points[segIndex + 1] // given param lies somewhere on segment AB
        T = (param - this.params[segIndex])  / (this.params[segIndex + 1] - this.params[segIndex]) // how far along this segment?
        P = A.add(B.subtract(A).scalarMult(T))
        return P
    
    function getParam(this, point): // return the param of the path that corresponds to the point on the path that is closest to the given point
        leastDist = math.inf // track the lowest distance seen
        closestPoint = Vector(math.inf, math.inf) // track the closest point on the path to the given point
        closestSegIndex = 0 // track index of closest 
        for i in range(1, len(this.points)): // find the closest point on the path
            p = point.closestPointOnSegment(this.points[i], this.points[i-1])
            d = point.subtract(p).getLength()
            if d < leastDist:
                leastDist = d
                closestPoint = p
                closestSegIndex = i - 1
        A = this.points[closestSegIndex] // line AB is the segment the segment on which the closest point to the input point lies
        B = this.points[closestSegIndex + 1]
        T = (closestPoint.subtract(A)).getLength() / (B.subtract(A)).getLength() // how far along this segment?
        C = this.params[closestSegIndex] + T * (this.params[closestSegIndex + 1] - this.params[closestSegIndex])
        return C

        


// ============================= PART 2: Instantiate movers, movement behaviors, and timer; functionine data printing function =============================
output = open("CS330 Assignment 2 output.txt", "w") // open output file to write to

// Initialize timer
TheTimer = Timer(0.5,250)

// Initialize path to be followed
followPath = Path([Vector(0, 90), Vector(-20, 65), Vector(20, 40), Vector(-40, 15), Vector(40, -10), Vector(-60, -35), Vector(60, -60), Vector(0, -85)], 1)
followPath.assemble()

// mover //1: Demonstrates Follow Path behavior on followpath
Kinematic1 = Kinematic(Vector(20,95),0,Vector(0,0),0)
PathFollower = mover(Kinematic1,Vector(0,0),4,1,2701,11)
FollowPathBehavior = FollowPath(followPath, 0.04, followPath.getParam(Kinematic1.pos), Kinematic1, 2) 


// functionine function to print data for a mover to the output file
function printData(mover):
    output.write(str((TheTimer.step)*TheTimer.stepDelay)) // 1: write the simulation time
    output.write("," + str(mover.number)) //2: write mover number
    output.write("," + str(mover.kinematic.pos.x)) //3: write mover's x pos
    output.write("," + str(mover.kinematic.pos.z)) //4: write mover's z pos
    output.write("," + str(mover.kinematic.velocity.x)) //5: write mover's x velocity
    output.write("," + str(mover.kinematic.velocity.z)) //6: write mover's z velocity
    output.write("," + str(mover.acceleration.x)) //7: write mover's x acceleration
    output.write("," + str(mover.acceleration.z)) //8: write mover's z acceleration
    output.write("," + str(mover.kinematic.orientation)) //9: write mover's orientation
    output.write("," + str(mover.behavior)) //10: write mover's behavior ID (1 = continue, 6 = seek, 7 = flee, 8 = arrive)
    output.write("," + str(mover.isCollided) + "\n") //11: write mover's collision status (true/false)


// ============================= PART 3: Update in a loop =============================
for step in range(TheTimer.maxSteps + 1):
    printData(PathFollower) // first, output data for each mover
    PathFollower.update(FollowPathBehavior.getSteering(), PathFollower.maxSpeed, TheTimer.stepDelay) // next, update movers' movement
    time.sleep(TheTimer.stepDelay) // wait for one timestep as functionined by timer object
    TheTimer.step += 1 // increment timestep

