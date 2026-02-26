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
    let testSeekerKinematic = new Behaviors.Kinematic([20,20], 0, [1,1], 0.3) // This guy seeks ^

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


arriveTest()
seekTest()
fleeTest()

pursueTest()