import * as data from './classes.js'
import * as behaviors from './behaviors.js'

const COMBAT_RANGE = 40;

function canSee(ship1, ship2) // can ship1 see ship 2?
{
  let dist = behaviors.getLength(behaviors.subtract(ship1.pos, ship2.pos))
  if (dist <= ship1.sightRange) {
    return true
  }
  else {
    return false;
  }
}

function checkForIdleTransition(thisShip, shipArray) { // return updated ship after idle transitions (no mutation)

  if (thisShip.state != 1) { // If this ship isn't idle, this function has nothing to do
    return thisShip;
  }

  let updatedShip = { ...thisShip }; // make shallop copy of ship to return as updated version

  switch (thisShip.type) { // Check for different conditions depending on ship type:

    case "Patrol": // What should Idle Patrol ships check for?
      for (let j = 0; j < shipArray.length; j++) { // Check out every other ship
        const otherShip = shipArray[j];

        if (!canSee(updatedShip, otherShip)) { // If I can't see this ship, disregard it
          continue;
        }

        if (otherShip.type === "Pirate") {  // Pursue pirates
          updatedShip = {
            ...updatedShip,
            state: 2
          };
        }
      }
      break;

    case "Pirate": // What should Idle Pirate ships check for?
      for (let j = 0; j < shipArray.length; j++) { // Check out every other ship
        const otherShip = shipArray[j];

        if (!canSee(updatedShip, otherShip)) { // If I can't see this ship, disregard it
          continue;
        }

        if (otherShip.type === "Merchant") { // Pursue merchants
          updatedShip = {
            ...updatedShip,
            state: 2,
            behavior: behaviors.newPursue(
              updatedShip.mover.behavior.moverKinematic,
              otherShip.mover.behavior.moverKinematic,
              updatedShip.mover.behavior.maxAcceleration,
              1
            )
          };
        }

        else if (otherShip.type === "Patrol") { // Flee from patrols
          updatedShip = {
            ...updatedShip,
            state: 3,
            behavior: behaviors.newFlee(
              updatedShip.mover.behavior.moverKinematic,
              otherShip.mover.behavior.moverKinematic,
              updatedShip.mover.behavior.maxAcceleration
            )
          };
        }
      }
      break;

    case "Merchant": // What should Idle Merchant ships check for?
      for (let j = 0; j < shipArray.length; j++) {
        const otherShip = shipArray[j];

        if (!canSee(updatedShip, otherShip)) { // If I can't see this ship, disregard it
          continue;
        }
        else if (otherShip.type === "Pirate") { // Flee from pirates
          updatedShip = {
            ...updatedShip,
            state: 3
          };
        }
      }
      break;
  }

  return updatedShip;
}

function advanceCombat(thisShip) { // allow this ship to "have its turn" in combat, return updated version of this ship and its enemy
  if (thisShip.state !== 10 || !thisShip.currentEnemy) {
    return { self: thisShip, enemy: thisShip.currentEnemy || null };
  }

  const atk = thisShip.armament * (thisShip.crewSize * 0.5);

  const updatedEnemy = {
    ...thisShip.currentEnemy,
    hp: thisShip.currentEnemy.hp - atk / (thisShip.currentEnemy.durability / 2),
  };

  return {
    self: thisShip,
    enemy: updatedEnemy,
  };
}

function checkForCombatScenario(ship, shipArray) { // return updated ships if combat begins
  if ((ship.state === 10) || (ship.state === 1)) { // if this ship is in combat already or idle, ignore
    return {
      self: ship,
      other: null
    };
  }

  for (let i = 0; i < shipArray.length; i++) {
    const otherShip = shipArray[i];
    let dist = behaviors.getLength(
      behaviors.subtract(ship.mover.kinematic.pos, otherShip.mover.kinematic.pos)
    );

    if (dist <= COMBAT_RANGE) {

      // prepare both ships for combat
      let updatedShip = { 
        ...ship,
        inCombat: true,
        state: 10,
        currentEnemy: otherShip,
        hp: 100
      };

      let updatedOther = {
        ...otherShip,
        inCombat: true,
        state: 10,
        currentEnemy: ship,
        hp: 100
      };

      return {
        self: updatedShip,
        other: updatedOther
      };
    }
  }

  // no combat triggered (still need to return original ship)
  return {
    self: ship,
    other: null
  };
}

function checkForPortArrival(ship) { // Reverses this ship's course in the event that it's reached one of its ports
  if (!ship.homePort || !ship.mover.behavior?.path) // If this ship doesn't have a home port, ignore
  {
    return ship;
  }

  const dist = behaviors.getLength(
    behaviors.subtract(ship.pos, ship.homePort.pos)
  );

  if (dist > COMBAT_RANGE) return ship; 

  const reversePath = arr => [...arr].reverse();

  return {
    ...ship,
    behavior: {
      ...ship.mover.behavior,
      path: {
        ...ship.mover.behavior.path,
        points: reversePath(ship.mover.behavior.path.points),
        distances: reversePath(ship.mover.behavior.path.distances),
        segments: reversePath(ship.mover.behavior.path.segments),
        params: reversePath(ship.mover.behavior.path.params),
      },
    },
  };
}


function updateShipBehavior(ship, timeStep) {
  // Only move if not in combat
  if (ship.state >= 10) {
    return ship;
  }

  const newMover = behaviors.updateMover(
    ship.mover,
    behaviors.getSteering(ship.mover.behavior),
    ship.maxSpeed,
    timeStep
  );

  // Return a new ship object with updated Mover
  return {
    ...ship,
    mover: newMover
  };
}

function step(run, timeStep = 1) {
  // Keep track of all ships, indexed by ID
  const shipsById = { ...run.currentState.ships };

  // Step 1: process each ship
  const processedShips = Object.entries(shipsById).map(([id, ship]) => {
    let updatedShip = ship;

    // Idle transitions
    updatedShip = checkForIdleTransition(updatedShip, Object.values(shipsById));

    // Combat scenarios
    const combatResult = checkForCombatScenario(updatedShip, id, Object.values(shipsById).filter(s => s !== ship)); // weird filter thing prevents ships fighting themselves
    updatedShip = combatResult.self;

    // If combat started, update the enemy ship as well
    if (combatResult.other) {
      shipsById[combatResult.other.id || id] = combatResult.other;
    }

    // Advance combat (if in combat)
    const combatAdvance = advanceCombat(updatedShip);
    updatedShip = combatAdvance.self;
    if (combatAdvance.enemy) {
      shipsById[combatAdvance.enemy.id || id] = combatAdvance.enemy;
    }

    // Update movement / behavior
    updatedShip = updateShipBehavior(updatedShip, timeStep);

    // Check for port arrival
    updatedShip = checkForPortArrival(updatedShip);

    return [id, updatedShip];
  });

  // Step 2: reconstruct updated ships object
  const newShips = Object.fromEntries(processedShips);

  // Step 3: return updated run object
  return {
    ...run,
    currentState: {
      ...run.currentState,
      ships: newShips
    }
  };
}

export {step}