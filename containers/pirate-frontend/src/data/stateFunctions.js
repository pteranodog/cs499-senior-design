import * as data from './classes.js'
import * as behvaiors from './behaviors.js'

function canSee(ship1, ship2) // can ship1 see ship 2?
{
  let dist = behvaiors.getLength(behvaiors.subtract(ship1.pos, ship2.pos))
  if (dist <= ship1.sightRange) {
    return true
  }
  else {
    return false;
  }
}

function processShipStates(shipArray) {
  for (let i = 0; i < shipArray.length; i++) {
    const thisShip = shipArray[i];

    // First, check the "idle" (state = 1, symbolizing default behavior) ships for transition cases
    checkForIdleTransition(thisShip, shipArray);

    // Second, check the "seeking/pursuing" (state = 2) ships for transition cases

    // Third, check the "fleeing/evading" (state = 3) ships for transition cases

    // Fourth, advnace combating (state = 10) ships through their fight

    // Finally, call all behavior updates and increment time

  }
}

function checkForIdleTransition(thisShip, shipArray) { // Takes in a ship that is idle (state 1) 
// and checks if it should transition to another state. This requires checking info on every other ship

  if (thisShip.state != 1) { // If this ship isn't idle, this function is misused
    console.log("attempted to check for idle transition on non-idle ship");
    return;
  }

  // Check for different conditions depending on ship type:
  switch (thisShip.type) {

    // What should Idle Patrol ships check for?
    case "Patrol":
      for (let j = 0; j < shipArray.length; j++) { // Check out every other ship
        const otherShip = shipArray[j];

        if (!canSee(thisShip, otherShip)) { // If I can't see this ship, disregard it
          continue; // i.e. move on to next ship
        }

        if (otherShip.type === "Pirate") {
          thisShip.state = 2;
          // TODO: update ship behavior to Seek/pursue, w/ otherShip as target
        }
      }

    // What should Idle Pirate ships check for?
    case "Pirate":
      for (let j = 0; j < shipArray.length; j++) { // Check out every other ship
        const otherShip = shipArray[j];

        if (!canSee(thisShip, otherShip)) { // If I can't see this ship, disregard it
          continue; // i.e. move on to next ship
        }

        if (otherShip.type === "Merchant") { // If I see a merchant, chase it
          thisShip.state = 2;
          
          // Switch to new behavior, intialized with current behavior's movement stats (speed etc)
          thisShip.behavior = new behvaiors.Pursue(
            // note maxPrediction may need adjusted here
          thisShip.behavior.moverKinematic, otherShip.behavior.moverKinematic, thisShip.behavior.maxAcceleration, 1);
        }

        else if (otherShip.type === "Patrol") { // If I see a patrol ship, move away from it
          thisShip.state = 3; 

          // Switch to new behavior, intialized with current behavior's movement stats (speed etc)
          thisShip.behavior = new behvaiors.Flee(
          thisShip.behavior.moverKinematic, otherShip.behavior.moverKinematic, thisShip.behavior.maxAcceleration);
        }
      }

    // What should Idle Merchant ships check for?
    case "Merchant":
      for (let j = 0; j < shipArray.length; j++) { // Check out every other ship
        const otherShip = shipArray[j];
        if (!canSee(thisShip, otherShip)) { // If I can't see this ship, disregard it
          continue; // i.e. move on to next ship
        }
        else if (otherShip.type === "Pirate") {
          thisShip.state = 3; 
          // TODO: update ship behavior to flee/evade, w/ otherShip as "target"
        }

      }
    }
  }

  let testPirate = data.newPirateShip([0,0], "medium", data.newPirateCove("testCove", [0,0], 0.1));
  testPirate.behavior = behvaiors.
  console.log(testPirate);

