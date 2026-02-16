# ============================ PART 0: Program info ==============================
# Author: Jonathan Poling
# For class: CS 330-1
# Filename: Poling_CS330_Assignment1.py
# Purpose: Implement and demonstrate (via printing data to a text file) the following Game AI behaviors: Seek, Flee, Arrive, Continue
# Date of submission: 10/5/2025

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
    
class Continue: # Keep a character moving in its current trajectory; no change in orientation or velocity
    def __init__(self, characterKinematic): # identify which character is continuing (retaining initial values), and give max acceleration
        self.k1 = characterKinematic #k1 = character to continue
    def getSteering(self): # since we want to continue (rate of change of velocity + orientation = 0), return a 0 vector for acceleration, and return 0 for angular
        result = SteeringOutput() # initialize output
        result.linear = Vector(0,0)
        result.angular = 0
        return result

class Flee: # Move a character directly away from a target
    def __init__(self, characterKinematic, targetKinematic, maxAcceleration): # identify which character is fleeing from which, and give max acceleration
        self.k1 = characterKinematic #k1 = character that will be fleeing
        self.k2 = targetKinematic #k2 = target (character being fled from)
        self.maxAcceleration = maxAcceleration
    
    def getSteering(self): # output of this function used as an argument in update function of character
        result = SteeringOutput() # initialize output

        result.linear = self.k1.pos.subtract(self.k2.pos) # get difference between target pos and pos of character we want to steer (inverted args between seek/flee)
        result.linear = result.linear.normalize()
        result.linear = result.linear.scalarMult(self.maxAcceleration) # set the magnitude of this acceleration vector to the maximum

        result.angular = 0
        return result
    
class Arrive: # Move a character towwards a target, slowing down as it gets close to the target
    def __init__(self, characterKinematic, targetKinematic, maxAcceleration, maxSpeed, targetRadius, slowRadius): # identify which character is arriving to which; gice radii and max speed/acceleration
        self.k1 = characterKinematic #k1 = character to steer
        self.k2 = targetKinematic #k2 = target
        self.maxAcceleration = maxAcceleration
        self.maxSpeed = maxSpeed
        self.targetRadius = targetRadius
        self.slowRadius = slowRadius
        self.timeToTarget = 0.1
    
    def getSteering(self): # output of this function used as an argument in update function of character
        result = SteeringOutput() # initialize output

        direction = self.k2.pos.subtract(self.k1.pos) # get difference between target pos and pos of character we want to steer; this time, save separately as a direction
        distance = direction.getLength() # save distance between the two
        
        if distance < self.targetRadius: # has this character reached its target?
            self.k1.isCollided = True
            return SteeringOutput(Vector(0,0), 0) # if so, no need to steer; return a 0 steering output
        if distance > self.slowRadius: # is this character far away enough from its target that it doesn't need to start slowing down (to prevent overshot)?
            self.targetSpeed = self.maxSpeed # if so, stay at max speed
        else: # if not, slow down:
            self.targetSpeed = self.maxSpeed * (distance / self.slowRadius)
        
        # combine the direction of the difference in position with the speed obtained from the logic above to obtain a new velocity 
        targetVelocity = direction
        targetVelocity = targetVelocity.normalize()
        targetVelocity = targetVelocity.scalarMult(self.targetSpeed)

        # finally, use this new velocity and the given time to get the new acceleration
        result.linear = targetVelocity.subtract(self.k1.velocity)
        result.linear = result.linear.scalarMult((self.timeToTarget)**-1)

        # if acceleration's magnitude is above max, correct it
        if result.linear.getLength() > self.maxAcceleration:
            result.linear = result.linear.normalize()
            result.linear = result.linear.scalarMult(self.maxAcceleration)
        
        result.angular = 0
        return result
    

# ============================= PART 2: Instantiate characters, movement behaviors, and timer; define data printing function =============================
output = open("data.txt", "w") # open output file to write to

# Character #1: Demonstrates Continue; remains at origin
Kinematic1 = Kinematic(Vector(0,0),0,Vector(0,0),0)
Continuer = Character(Kinematic1,Vector(0,0),0,1,2601,1)
ContinueBehavior = Continue(Continuer.kinematic)

# Character #2: Demonstrates Flee from Character 1
Kinematic2 = Kinematic(Vector(-30,-50),0.7853,Vector(2,7),0)
Fleer = Character(Kinematic2,Vector(0,0),8,2,2602,7)
FleeBehavior = Flee(Fleer.kinematic, Continuer.kinematic,1.5)

# Character #3: Demonstrates Seek towards Character 1
Kinematic3 = Kinematic(Vector(-50,40),4.7124,Vector(0,8),0)
Seeker = Character(Kinematic3,Vector(0,0),8,3,2603,6)
SeekBehavior = Seek(Seeker.kinematic, Continuer.kinematic, 2)

# Character #4: Demonstrates Arrive towards Character 1
Kinematic4 = Kinematic(Vector(50,75),3.1416,Vector(-9,4),0)
Arriver = Character(Kinematic4,Vector(0,0),10,4,2604,8)
ArriveBehavior = Arrive(Arriver.kinematic, Continuer.kinematic, 2, Arriver.maxSpeed, 4, 32)


# Initialize timer
TheTimer = Timer(0.5,100)

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
    printData(Continuer) # first, output data for each character
    printData(Fleer)
    printData(Seeker)
    printData(Arriver)
    Continuer.update(ContinueBehavior.getSteering(), Continuer.maxSpeed, TheTimer.stepDelay) # next, update characters' movement
    Fleer.update(FleeBehavior.getSteering(), Fleer.maxSpeed, TheTimer.stepDelay)
    Seeker.update(SeekBehavior.getSteering(), Seeker.maxSpeed, TheTimer.stepDelay)
    Arriver.update(ArriveBehavior.getSteering(), Arriver.maxSpeed, TheTimer.stepDelay)
    time.sleep(TheTimer.stepDelay) # wait for one timestep as defined by timer object
    TheTimer.step += 1 # increment timestep