import * as Behaviors from "../data/behaviors.js";

// Define dedicated behavior testing functions
function arriveTest()
{    
    let testTargetKinematic = new Behaviors.Kinematic([0,0], 0, [0,0], 0) // This guy doesn't move.
    let testArriverKinematic = new Behaviors.Kinematic([20,20], 0, [1,1], 0.3) // This guy demonstrates Arrive ^

    let testArrive = new Behaviors.Arrive(testArriverKinematic, testTargetKinematic, 2,2,1,1) // Give testArriverKinematic an Arrive behavior

    let testArriver = new Behaviors.Mover(testArriverKinematic, 2, 10, testArrive) // Define movement stats for arriver

    console.log("\nArrive demonstration\n\nThese are the coordinates of the (stationary) target for this test:")
    console.log(testTargetKinematic.pos)
    console.log("\nThese are the starting coordinates of the Arriving mover:")
    console.log(testArriverKinematic.pos)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates of the mover after each second. It should:"
        ,"\n- turn + accelarate towards its target"
        ,"\n- decelarate once it is close, remaining very near it once it gets there"
    )
    for (let i = 0; i < 20; i++) {
        testArriver.update(testArrive.getSteering(),testArriver.maxSpeed, 1)
        console.log(testArriverKinematic.pos)
    }
    console.log("\n\n========== Arrive Test Concluded ==========\n\n")
}

function seekTest()
{    
    let testTargetKinematic = new Behaviors.Kinematic([0,0], 0, [0,0], 0) // This guy doesn't move.
    let testSeekerKinematic = new Behaviors.Kinematic([-20,-20], 0, [-1,-1], 0.3) // This guy seeks ^

    let testSeek = new Behaviors.Seek(testSeekerKinematic, testTargetKinematic, 2,2,1,1) // Give testSeekerKinematic a Seek behavior

    let testSeeker = new Behaviors.Mover(testSeekerKinematic, 2, 10, testSeek) // Define movement stats for seeker

    console.log("\nSeek demonstration\n\nThese are the coordinates of the (stationary) target for this test:")
    console.log(testTargetKinematic.pos)
    console.log("\nThese are the starting coordinates of the Seeking mover:")
    console.log(testSeekerKinematic.pos)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates of the mover after each second. It should:"
        ,"\n- turn + accelarate towards its target"
        ,"\n- ... and kind of keep doing just that, meaning it 'overshoots' the target, loops back towards it, and repeats"
    )
    for (let i = 0; i < 20; i++) {
        testSeeker.update(testSeek.getSteering(),testSeeker.maxSpeed, 1)
        console.log(testSeekerKinematic.pos)
    }
    console.log("\n\n========== Seek Test Concluded ==========\n\n")
}

function fleeTest()
{    
    let testTargetKinematic = new Behaviors.Kinematic([0,0], 0, [0,0], 0) // This guy doesn't move.
    let testFleerKinematic = new Behaviors.Kinematic([1,1], 0, [1,1], 0.3) // This guy Flees from ^ (note that I put them close together to make initial steering more drastic)

    let testFlee = new Behaviors.Flee(testFleerKinematic, testTargetKinematic, 2,2,1,1) // Give testFleerKinematic a Flee behavior

    let testFleer = new Behaviors.Mover(testFleerKinematic, 2, 10, testFlee) // Define movement stats for Fleer

    console.log("\nFlee demonstration\n\nThese are the coordinates of the (stationary) target for this test:")
    console.log(testTargetKinematic.pos)
    console.log("\nThese are the starting coordinates of the Fleeing mover:")
    console.log(testFleerKinematic.pos)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates of the mover after each second. It should:"
        ,"\n- turn + accelarate directly away from its target"
        ,"\n- ... and kind of keep doing just that"
    )
    for (let i = 0; i < 20; i++) {
        testFleer.update(testFlee.getSteering(),testFleer.maxSpeed, 1)
        console.log(testFleerKinematic.pos)
    }
    console.log("\n\n========== Flee Test Concluded ==========\n\n")
}

function pursueTest()
{    
    let testTargetKinematic = new Behaviors.Kinematic([0,0], 0, [1,0], 0) // This guy moves directly rightward, (in cartesian terms)
    // It moves very predictably: 1 unit at a time. This makes verifying his pursuer's behavior more simple

    let testPursuerKinematic = new Behaviors.Kinematic([-10,-10], 0, [1,1], 0.3) // This guy Pursues ^ 

    let testContinue = new Behaviors.Continue(testTargetKinematic) // Continue behavior does not steer at all; mover retains its set velocity and rotation. Again,
    // we use this to make this test target move predictably from our POV
    let testPursue = new Behaviors.Pursue(testPursuerKinematic, testTargetKinematic, 2, 1) // Give testPursuerKinematic a Pursue behavior (predicts at most 1s ahead)

    let testPursuer = new Behaviors.Mover(testPursuerKinematic, 2, 10, testPursue) // Define movement stats for Pursuer
    let testContinuer = new Behaviors.Mover(testTargetKinematic, 0, 1, testContinue) // dont let the target accelarate + set max velocity to 1 so its motion remains as described

    console.log("\nPursue demonstration\n\nThese are the coordinates of the (directly-right moving) target for this test:")
    console.log(testTargetKinematic.pos)
    console.log("\nThese are the starting coordinates of the Pursuing mover:")
    console.log(testPursuerKinematic.pos)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates of the mover after each second. It should:"
        ,"\n- Predict its targets future position (up to 1s ahead; the predicted pos is printed before any other coords)"
        ,"\n- Seek towards that point"
        ,"\n- Repeat these two steps over and over"
    )
    for (let i = 0; i < 20; i++) {

        testPursuer.update(testPursue.getSteering(),testPursuer.maxSpeed, 1)
        console.log("Predicted position: ",testPursue.predictedPos, "\nPursuer's coords:")
        testContinuer.update(testContinue.getSteering(), testContinuer.maxSpeed, 1)
        console.log(testPursuerKinematic.pos, "\nTarget's coords: ",testTargetKinematic.pos)
    }
    console.log("\n\n========== Pursue Test Concluded ==========\n\n")
}

function alignTest()
{    
    let testTargetKinematic = new Behaviors.Kinematic([0,0], 1, [0,0], 0) // This guy stays here, retains orientation = 1

    let testAlignerKinematic = new Behaviors.Kinematic([-10,-10], -0.3, [1,0], 0) // This guy aligns his orientation w/ ^ 


    let testAlign = new Behaviors.Align(testAlignerKinematic, testTargetKinematic, 0.2, 0.4, 0.3, 0.1) // Give testAlignerKinematic an Align behavior

    let testAligner = new Behaviors.Mover(testAlignerKinematic, 2, 10, testAlign) // Define movement stats for aligner

    console.log("\nAlign demonstration\n\nThis is the orientation of the stationary target for this test:")
    console.log(testTargetKinematic.orientation)
    console.log("\nThese are the starting coordinates +orientation of the Aligning mover:")
    console.log("coords: ", testAlignerKinematic.pos, "\norientation: ", testAlignerKinematic.orientation)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates + orientation of the mover after each second. It should:"
        ,"\n- Steer towards the same direction the target is facing"
        ,"\n- Move in that direction"
    )
    for (let i = 0; i < 20; i++) {

        testAligner.update(testAlign.getSteering(),testAligner.maxSpeed, 1)
        console.log("Mover's pos: ",testAlignerKinematic.pos, "\nMover's orientation:", testAlignerKinematic.orientation)
    }
    console.log("\n\n========== Align Test Concluded ==========\n\n")
}

function faceTest()
{    
    let testTargetKinematic = new Behaviors.Kinematic([-100,0], 1, [0,0], 0) // This guy stays here, retains orientation = 1

    let testFacerKinematic = new Behaviors.Kinematic([-10,0], -0.3, [0,0], 0) // This guy Faces this guy ^ 


    let testFace = new Behaviors.Face(testFacerKinematic, testTargetKinematic, 0.2, 0.4, 0.4, 0.2) // Give testFacerKinematic a Face behavior

    let testFacer = new Behaviors.Mover(testFacerKinematic, 2, 10, testFace) // Define movement stats for Facer

    console.log("\nFace demonstration\n\nThis is the position of the stationary target for this test:")
    console.log(testTargetKinematic.pos)
    console.log("\nThese are the starting coordinates + orientation of the Facing mover:")
    console.log("coords: ", testFacerKinematic.pos, "\norientation: ", testFacerKinematic.orientation)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates + orientation of the mover after each second. It should:"
        ,"\n- Steer towards the target"
        ,"\n- Move according to its initial stats (Face only applies rotational changes, not linear)"
    )
    for (let i = 0; i < 20; i++) {

        testFacer.update(testFace.getSteering(),testFacer.maxSpeed, 1)
        console.log("Mover's pos: ",testFacerKinematic.pos, "\nMover's orientation:", testFacerKinematic.orientation)
    }
    console.log("\n\n========== Face Test Concluded ==========\n\n")
}

function wanderTest()
{    
    let testWandererKinematic = new Behaviors.Kinematic([-10,0], -0.3, [0,0], 0) // This guy Wanders about


    let testWander = new Behaviors.Wander(testWandererKinematic, 1, 0.4, 0.6, 0.5,0.1, 5) // Give testWandererKinematic a Wander behavior

    let testWanderer = new Behaviors.Mover(testWandererKinematic, 2, 8, testWander) // Define movement stats for Wanderr

    console.log("\nWander demonstration")
    console.log("\nThese are the starting coordinates + orientation of the mover:")
    console.log("coords: ", testWandererKinematic.pos, "\norientation: ", testWandererKinematic.orientation)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates + orientation of the mover after each second. It should:"
        ,"\n- Wander about randomly, but not too jarringly"
    )
    for (let i = 0; i < 20; i++) {

        testWanderer.update(testWander.getSteering(),testWanderer.maxSpeed, 1)
        console.log("Mover's pos: ",testWandererKinematic.pos, "\nMover's orientation:", testWandererKinematic.orientation)
    }
    console.log("\n\n========== Wander Test Concluded ==========\n\n")
}





function pathFollowTest()
{    
    let testPath = new Behaviors.Path([[0,0],[3,4],[6,8],[9,12]], 20)
    testPath.assemble()
    
    
    let testPathFollowerKinematic = new Behaviors.Kinematic([-5,-5], -0.1, [0,0], 0) // This guy follows testPath
    
    
    let testPathFollow = new Behaviors.FollowPath(testPath, 0.04, testPath.getParam(testPathFollowerKinematic.pos),testPathFollowerKinematic, 1)
    
    
    let testPathFollower = new Behaviors.Mover(testPathFollowerKinematic, 0.5, 1, testPathFollow) // Define movement stats for the path follower
    
    console.log("\nPath Follow demonstration\n\nThis is the starting pos of the mover:")
    console.log(testPathFollowerKinematic.pos)
    console.log("\nThese are the points that make up the path: ")
    console.log(testPath.points)
    console.log("\nNow we will step through 20 seconds of activity, printing the new coordinates + orientation of the mover after each second. It should:"
        ,"\n- Move towards whichever point (not necessarily a major, i.e. listed, point) on the path is closest to it"
        ,"\n- Once it reaches such a point, it does the same for the next point on the path"
    )
    for (let i = 0; i < 20; i++) {
            testPathFollower.update(testPathFollow.getSteering(),testPathFollower.maxSpeed, 1)
            console.log("\nMover's pos: ",testPathFollowerKinematic.pos)
            console.log("Targeted point: ", testPath.getPosition(testPathFollow.currentParam))
    }
    console.log("\n\n========== Path follow Test Concluded ==========\n\n")
}


// Call test functions
arriveTest()
seekTest()
fleeTest()
pursueTest()

alignTest()
faceTest()
wanderTest()

pathFollowTest()
