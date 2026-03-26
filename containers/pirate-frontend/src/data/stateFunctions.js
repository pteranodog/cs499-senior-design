import * as data from './classes.js'
import * as behaviors from './behaviors.js'

const COMBAT_RANGE = 40;

function canSee(ship1, ship2) // can ship1 see ship2?
{
  let dist = behaviors.getLength(behaviors.subtract(ship1.pos, ship2.pos))
  return dist <= ship1.sightRange;
}

function checkForIdleTransition(thisShip, thisId, shipsById) { // return updated ship after idle transitions (no mutation)

  if (thisShip.state != 1) { // If this ship isn't idle, this function has nothing to do
    return thisShip;
  }

  let updatedShip = { ...thisShip };

  // Build an array of OTHER ships only (exclude self)
  const otherShips = Object.entries(shipsById)
    .filter(([id]) => id !== thisId)
    .map(([, ship]) => ship);

  switch (thisShip.type) {

    case "Patrol": // What should Idle Patrol ships check for?
      for (const otherShip of otherShips) { // Check out every other ship
        if (!canSee(updatedShip, otherShip)) continue; // If I can't see this ship, disregard it
        if (otherShip.type === "Pirate") {
          updatedShip = { ...updatedShip, state: 2 }; // Pursue pirates
        }
      }
      break;

    case "Pirate": // What should Idle Pirate ships check for?
      for (const otherShip of otherShips) { // Check out every other ship
        if (!canSee(updatedShip, otherShip)) continue; // If I can't see this ship, disregard it
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
        } else if (otherShip.type === "Patrol") { // Flee from patrols
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
      for (const otherShip of otherShips) { // Check out every other ship
        if (!canSee(updatedShip, otherShip)) continue; // If I can't see this ship, disregard it
        if (otherShip.type === "Pirate") {
          updatedShip = { ...updatedShip, state: 3 };
        }
      }
      break;
  }

  return updatedShip;
}

function advanceCombat(thisShip, shipsById) { // return updated shipsById after this ship deals damage
  if (thisShip.state !== 10 || !thisShip.currentEnemyId) {
    return shipsById;
  }

  const enemyId = thisShip.currentEnemyId;
  const enemy = shipsById[enemyId];
  if (!enemy) return shipsById;

  const atk = thisShip.armament * (thisShip.crewSize * 0.5);
  const updatedEnemy = {
    ...enemy,
    hp: enemy.hp - atk / (enemy.durability / 2)
  };

  // Return a new shipsById with the updated enemy
  return {
    ...shipsById,
    [enemyId]: updatedEnemy
  };
}

function checkForCombatScenario(ship, shipId, shipsById) { // return updated shipsById if combat begins
  if (ship.state === 10 || ship.state === 1) { // if this ship is in combat already or idle, ignore
    return shipsById;
  }

  const otherEntries = Object.entries(shipsById).filter(([id]) => id !== shipId);

  for (const [otherId, otherShip] of otherEntries) {
    const dist = behaviors.getLength(
      behaviors.subtract(ship.mover.kinematic.pos, otherShip.mover.kinematic.pos)
    );

    // prepare both ships for combat
    if (dist <= COMBAT_RANGE) {
      const updatedShip = {
        ...ship,
        inCombat: true,
        state: 10,
        currentEnemyId: otherId, // store ID, not the object
        hp: ship.hp ?? 100       // don't reset hp if already set
      };
      const updatedOther = {
        ...otherShip,
        inCombat: true,
        state: 10,
        currentEnemyId: shipId,
        hp: otherShip.hp ?? 100
      };

      return {
        ...shipsById,
        [shipId]: updatedShip,
        [otherId]: updatedOther
      };
    }
  }

  return shipsById; // no combat triggered
}

function checkForPortArrival(ship) { // Reverses this ship's course if it has reached its home port
  if (!ship.homePort || !ship.mover.behavior?.path) {
    return ship;
  }

  const dist = behaviors.getLength(
    behaviors.subtract(ship.mover.kinematic.pos, ship.homePort.pos)
  );

  if (dist > COMBAT_RANGE) return ship;

  const reversePath = arr => [...arr].reverse();

  return {
    ...ship,
    mover: {
      ...ship.mover,
      behavior: {
        ...ship.mover.behavior,
        path: {
          ...ship.mover.behavior.path,
          points: reversePath(ship.mover.behavior.path.points),
          distances: reversePath(ship.mover.behavior.path.distances),
          segments: reversePath(ship.mover.behavior.path.segments),
          params: reversePath(ship.mover.behavior.path.params),
        }
      }
    }
  };
}

function updateShipBehavior(ship, timeStep) {
  if (ship.state >= 10) { // in combat, don't move
    return ship;
  }

  const newMover = behaviors.updateMover(
    ship.mover,
    behaviors.getSteering(ship.mover.behavior),
    ship.maxSpeed,
    timeStep
  );

  return {
    ...ship,
    mover: newMover
  };
}

function step(run, timeStep = 1) {
  // Work from a fresh copy of ships
  let shipsById = { ...run.currentState.ships };
  let points = {...run.points};

  // Process each ship in turn
  for (const [id, ship] of Object.entries(shipsById)) {
    let updatedShip = shipsById[id]; // always read fresh (another ship may have updated this one)



    // Idle -> active transitions (sight-based)
    updatedShip = checkForIdleTransition(updatedShip, id, shipsById);
    shipsById[id] = updatedShip;

    // Check if this ship should enter combat with anyone
    shipsById = checkForCombatScenario(updatedShip, id, shipsById);
    updatedShip = shipsById[id];

    // This ship deals damage to its enemy (if in combat)
    shipsById = advanceCombat(updatedShip, shipsById);
    updatedShip = shipsById[id];

    // Move!
    updatedShip = updateShipBehavior(updatedShip, timeStep);
    shipsById[id] = updatedShip;

    // Reverse course if merchant + arrived at port
    updatedShip = checkForPortArrival(updatedShip);
    shipsById[id] = updatedShip;
  }


  shipsById = processShipSpawns(run, shipsById);
  

  return {
    ...run,
    currentState: {
      ...run.currentState,
      ships: shipsById
    }
  };
}

// Spawn a new merchant ship at this port's location.
function spawnMerchant(id, size) {
  thisMerchant = new MerchantShip(id, this.pos, size, this)
  return thisMerchant
}

// Spawn a new patrol ship at this port's location.
function spawnPatrol(id, size) {
  thisPatrol = new PatrolShip(id, this.pos, size, this)
  return thisPatrol
}

// Spawn a new pirate ship at this cove's location.
function spawnPirate(id, size) {
  thisPirate = new PirateShip(id, this.pos, size, this)
  return thisPirate
}


function processShipSpawns(run, shipArr) {
  let updatedShipList = {...shipArr};
  let pointList = {...run.points}
  for (let i = 0; i < pointList.length; i++) {
    const thisPoint = pointList[i];
    switch (thisPoint.type) {
      case "port":
        if (Math.random()<= thisPoint.merchantSpawnChance) { // TODO: replace math.random with seed functionality
          updatedShipList.push(spawnMerchant(updatedShipList.size + 1,"small" )); // TODO decide sizes i forgot about this
        }

        if (Math.random()<= thisPoint.patrolSpawnChance) { // TODO: replace math.random with seed functionality
          updatedShipList.push(spawnPatrol(updatedShipList.size + 1,"small" )); // TODO decide sizes i forgot about this
        }
        break;
      case "cove":
        if (Math.random()<= thisPoint.pirateSpawnChance) { // TODO: replace math.random with seed functionality
          updatedShipList.push(spawnPirate(updatedShipList.size + 1,"small" )); // TODO decide sizes i forgot about this
        }
      default:
        break;
    }
    
  }
  return updatedShipList;
}

export { step }