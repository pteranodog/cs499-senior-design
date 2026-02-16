

import time
import math


# ============================= PART 1: Class definitions =============================
class Vector: # basic 2 element (x,z) vector class
    def __init__(self,x,z): # specify the x and z coordinates of this vector; both are floats
        self.x = x
        self.z = z
        self.length = self.getLength() # go ahead and create length attribute

    def getLength(self): # return the magnitude (length) of this vector
        return((((self.z)**2) + (self.x)**2)**0.5)
    
    def normalize(self): # make length = 1; retain direction
        length = self.getLength()
        if length == 0:
            return Vector(0,0) # prevent division by 0
        result = Vector(self.x/length, self.z/length)
        return result
    
    def add(self, b): # add some other vector to this one
        result = Vector((self.x + b.x),(self.z + b.z))
        return result
    
    def subtract(self, b): # subtract some other vector from this one
        result = Vector((self.x - b.x),(self.z - b.z))
        return result

    def scalarMult(self, c): # multiply this vector by a scalar
        result = Vector(self.x * c, self.z * c)
        return result
    
    def dotProduct(self, B): # return the dot product (scalar) of this vector with another vector B
        result = (self.x * B.x) + (self.z * B.z)
        return result
    
    def closestPointOnSegment(self, A, B): # return the point on line segment A,B that is closest to the X and Y of this vector
        AB = B.subtract(A) # get line segments (A to B, and A to self)
        AQ = self.subtract(A)

        T = (AQ.dotProduct(AB)) / (AB.dotProduct(AB)) # how "far along" AB is AQ's projection 

        if T <= 0:
            return A
        elif T >= 1:
            return B
        else:
            return A.add(AB.scalarMult(T))



class Kinematic: # class used to identify a character's position, orientation, velocity,and rotation
    def __init__(self, position, orientation, velocity, rotation):
        # position and velocity should be Vector instances, orientation and rotation should be floats
        self.pos = position
        self.orientation = orientation
        self.velocity = velocity
        self.rotation = rotation
    
class SteeringOutput: # class used to specify a rate of change in velocity(vector)/ rotation(float); used in character's update() method
    def __init__(self, linear = None, angular = 0):
        self.linear = linear # linear acceleration (Vector)
        self.angular = angular # angular acceleration (float)

class Timer: # class used to set movement changes in motion, define time step length, and the # of steps to execute
    def __init__(self, stepDelay, maxSteps):
        self.step = 0
        self.maxSteps = maxSteps
        self.stepDelay = stepDelay

class Character: # Holds all data and methods relevant to a character
    def __init__(self, initialKinematic, acceleration, maxSpeed, number, ID, behavior): # INITIAL values
        # initialKinematic should be a Kinematic instance; acceleration should be a Vector instance; maxSpeed, number, ID, behavior should all be floats
        self.kinematic = initialKinematic
        self.acceleration = acceleration
        self.maxSpeed = maxSpeed
        self.number = number
        self.ID = ID
        self.behavior = behavior
        self.isCollided = False

    def update(self, steering, maxSpeed, time):
        self.kinematic.pos = self.kinematic.pos.add(self.kinematic.velocity.scalarMult(time)) # advance position according to velocity
        self.kinematic.orientation += self.kinematic.rotation * time # change orientation according to rotation

        self.kinematic.velocity = self.kinematic.velocity.add(steering.linear.scalarMult(time)) # increase velocity according to acceleration
        self.kinematic.rotation += steering.angular * time # increase rotation according to angular acceleration

        self.acceleration = steering.linear # update this characters own acceleration value for printing purposes

        if (self.kinematic.velocity.getLength() > maxSpeed): # is this character going above their max speed?
            self.kinematic.velocity = self.kinematic.velocity.normalize()
            self.kinematic.velocity =  self.kinematic.velocity.scalarMult(maxSpeed) # if so, return to max speed

    def newOrientation(self, current, velocity): # unused in program 1
        if velocity.getLength() > 0:
            return math.atan2(velocity.x, velocity.z)
        else:
            return current

class Seek: # Move a character directly towards a target
    def __init__(self, characterKinematic, targetKinematic, maxAcceleration): # identify which character is seeking to which, and give max acceleration
        self.k1 = characterKinematic #k1 = character to steer
        self.k2 = targetKinematic #k2 = target
        self.maxAcceleration = maxAcceleration
    
    def getSteering(self): # output of this function used as an argument in update function of character
        result = SteeringOutput() # initialize output

        result.linear = self.k2.pos.subtract(self.k1.pos) # get difference between target pos and pos of character we want to steer
        result.linear = result.linear.normalize()
        result.linear = result.linear.scalarMult(self.maxAcceleration) # set the magnitude of this acceleration vector to the maximum

        result.angular = 0
        return result
    
class FollowPath(Seek): # Move a character along a Path
    def __init__(self, path, pathOffset, currentParam, characterKinematic, maxAcceleration): # no target kinematic needed in init; determined by other data
        self.path = path
        self.pathOffset = pathOffset
        self.currentParam = currentParam

        targetKinematic = Kinematic(Vector(0, 0), 0, Vector(0, 0), 0) # placeholder target kinematic so parent init can be called

        super().__init__(characterKinematic, targetKinematic, maxAcceleration) # init parent class (Seek)

    def getSteering(self):
        # find my path param
        self.currentParam = self.path.getParam(self.k1.pos)

        # offset: how far ahead (along path) to seek to?
        self.targetParam = self.currentParam + self.pathOffset

        # set actual target pos to the pos of the target path param
        self.k2.pos = self.path.getPosition(self.targetParam)

        # now get Seek's steering to steer towards that param pos ("my" position and target's position are now set)
        return super().getSteering()
    
class Path: # Defines the path data structure necessary to implement path following
    def __init__(self, points, id):
        self.id = id
        self.points = points # will be a collection of Vectors
        self.segments = len(points) - 1
        self.distances = [0] * (self.segments + 1)
        self.params = [0] * (self.segments + 1) # will hold parametrizations (0-1) of distances
        self.totalLength = 0 # used in parametrization

    def assemble(self): # Iterates through this path's points and assigns values to data members accordingly
        for i in range(1, len(self.points)): # find length of each segment
            thisSeg = self.points[i].subtract(self.points[i-1])
            thisSegLength = thisSeg.getLength()
            self.distances[i] = thisSegLength + self.distances[i-1]

        self.totalLength = self.distances[-1] # last member of distances holds total path distance

        for i in range(1, len(self.points)): # get parametrized lengths
            self.params[i] = self.distances[i] / self.totalLength # 0 -1    

    def getPosition(self, param): # return the vector that is the given parametrized distance along the given path
        # edge case handling
        if param <= 0:
            return self.points[0]
        if param >= 1:
            return self.points[-1]
        
        segIndex = 0 # index of this Path's param that is directly ahead of the given param (i.e. given param lies between params[this] and params[this + 1])
        for i in range(1, len(self.params)):  # find which params the given param lies between
            if self.params[i] > param:
                segIndex = i - 1
                break
        A = self.points[segIndex]
        B = self.points[segIndex + 1] # given param lies somewhere on segment AB
        T = (param - self.params[segIndex])  / (self.params[segIndex + 1] - self.params[segIndex]) # how far along this segment?
        P = A.add(B.subtract(A).scalarMult(T))
        return P
    
    def getParam(self, point): # return the param of the path that corresponds to the point on the path that is closest to the given point
        leastDist = math.inf # track the lowest distance seen
        closestPoint = Vector(math.inf, math.inf) # track the closest point on the path to the given point
        closestSegIndex = 0 # track index of closest 
        for i in range(1, len(self.points)): # find the closest point on the path
            p = point.closestPointOnSegment(self.points[i], self.points[i-1])
            d = point.subtract(p).getLength()
            if d < leastDist:
                leastDist = d
                closestPoint = p
                closestSegIndex = i - 1
        A = self.points[closestSegIndex] # line AB is the segment the segment on which the closest point to the input point lies
        B = self.points[closestSegIndex + 1]
        T = (closestPoint.subtract(A)).getLength() / (B.subtract(A)).getLength() # how far along this segment?
        C = self.params[closestSegIndex] + T * (self.params[closestSegIndex + 1] - self.params[closestSegIndex])
        return C

        


# ============================= PART 2: Instantiate characters, movement behaviors, and timer; define data printing function =============================
output = open("CS330 Assignment 2 output.txt", "w") # open output file to write to

# Initialize timer
TheTimer = Timer(0.5,250)

# Initialize path to be followed
followPath = Path([Vector(0, 90), Vector(-20, 65), Vector(20, 40), Vector(-40, 15), Vector(40, -10), Vector(-60, -35), Vector(60, -60), Vector(0, -85)], 1)
followPath.assemble()

# Character #1: Demonstrates Follow Path behavior on followpath
Kinematic1 = Kinematic(Vector(20,95),0,Vector(0,0),0)
PathFollower = Character(Kinematic1,Vector(0,0),4,1,2701,11)
FollowPathBehavior = FollowPath(followPath, 0.04, followPath.getParam(Kinematic1.pos), Kinematic1, 2) 


# Define function to print data for a character to the output file
def printData(character):
    output.write(str((TheTimer.step)*TheTimer.stepDelay)) # 1: write the simulation time
    output.write("," + str(character.number)) #2: write character number
    output.write("," + str(character.kinematic.pos.x)) #3: write character's x pos
    output.write("," + str(character.kinematic.pos.z)) #4: write character's z pos
    output.write("," + str(character.kinematic.velocity.x)) #5: write character's x velocity
    output.write("," + str(character.kinematic.velocity.z)) #6: write character's z velocity
    output.write("," + str(character.acceleration.x)) #7: write character's x acceleration
    output.write("," + str(character.acceleration.z)) #8: write character's z acceleration
    output.write("," + str(character.kinematic.orientation)) #9: write character's orientation
    output.write("," + str(character.behavior)) #10: write character's behavior ID (1 = continue, 6 = seek, 7 = flee, 8 = arrive)
    output.write("," + str(character.isCollided) + "\n") #11: write character's collision status (true/false)


# ============================= PART 3: Update in a loop =============================
for step in range(TheTimer.maxSteps + 1):
    printData(PathFollower) # first, output data for each character
    PathFollower.update(FollowPathBehavior.getSteering(), PathFollower.maxSpeed, TheTimer.stepDelay) # next, update characters' movement
    time.sleep(TheTimer.stepDelay) # wait for one timestep as defined by timer object
    TheTimer.step += 1 # increment timestep