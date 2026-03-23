import * as data from './classes.js'
import * as behvaiors from './behaviors.js'

const COMBAT_RANGE = 40;

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

function processShipStates(shipArray, timeStep) {
  for (let i = 0; i < shipArray.length; i++) {
    const thisShip = shipArray[i];

    // First, check the "idle" (state = 1, symbolizing default behavior) ships for transition cases 
    checkForIdleTransition(thisShip, shipArray);

    // Second, check the "seeking/pursuing" (state = 2) ships for transition cases (out of sight range or in combat range)
    checkForCombatScenario(thisShip, shipArray);
    // Third, check the "fleeing/evading" (state = 3) ships for transition cases (out of sight range or in combat range.. anyhting else?)


    // Fourth, advance combating (state = 10) ships through their fight
    advanceCombat(thisShip);

    // Finally, call all behavior updates and increment time
    updateShipBehavior(thisShip, timeStep);
  }
}

function checkForIdleTransition(thisShip, shipArray) { // Takes in a ship that is idle (state 1) 
// and checks if it should transition to another state. This requires checking info on every other ship

  if (thisShip.state != 1) { // If this ship isn't idle, this function has nothing to do
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

function advanceCombat (thisShip) { // Have each ship in the array "take its turn" in combat
  if (thisShip.state != 10) { // ignore ships not in combat
    return;
  }
  let atk = thisShip.armament * (thisShip.crewSize * 0.5);
  thisShip.currentEnemy.hp -= atk / (thisShip.currentEnemy.durability / 2);
}

function checkForCombatScenario(ship, shipArray) {
  if((ship.state === 10) || (ship.state === 1)) {
    // If this ship is already in combat, or idle, then this function has nothing to do
    return;
  }

  // So, for ships that are fleeing or pursuing, check if they are close enough to engage in combat:

  for (let i = 0; i < shipArray.length; i++) {
    const otherShip = shipArray[i];
    let dist = behvaiors.getLength(behvaiors.subtract(ship.pos, otherShip.pos))
    if (dist <= COMBAT_RANGE) { // NOTE: THIS NUMBER MAY NEED TWEAKED! Once ships are this close together they enter combat with each other (and stop moving)
      // Set up combat scenario for both ships
      ship.inCombat = true;
      ship.state = 10;
      ship.currentEnemy = otherShip;
      ship.hp = 100; // this is a %age

      otherShip.inCombat = true;
      otherShip.state = 10;
      otherShip.currentEnemy = otherShip;
      otherShip.hp = 100; // this is a %age
      return true
    }
    else {
      return false;
    }
    
  }
}

function checkForPortArrival(ship, port) {
  if (behvaiors.length(behvaiors.subtract(ship.pos, ship.homePort.pos)) <= COMBAT_RANGE) {
    // Perform dropoff; set course to home port
    ship.behavior.path.points = reverse(ship.behavior.path.points);
    ship.behavior.path.distances = reverse(ship.behavior.path.distances);
    ship.behavior.path.segments = reverse(ship.behavior.path.segments);
    ship.behavior.path.params = reverse(ship.behavior.path.params);
  }
}


function updateShipBehavior(ship, timeStep) {
  if (ship.state < 10)  { // only move if not in combat
    ship.mover = behvaiors.updateMover(ship.mover, behvaiors.getSteering(ship.behavior), ship.maxSpeed, timeStep);
  }
}