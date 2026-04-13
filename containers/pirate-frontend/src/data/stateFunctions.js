import * as behaviors from './behaviors.js';
import { aStar } from './aStar.js';
import { getSomaliaHotspot } from '../utils/pointChoosing.js';
import * as data from './classes.js'
import { getOceanCurrent } from './oceanCurrents.js'
import { isOcean } from '../utils/isOcean.js';
import { cartesianToLatLng, latLngToCartesian } from '../utils/coords.js';

const COMBAT_RANGE   = 40;
const REPATH_INTERVAL = 20; // steps between A* recomputes for merchants

// ============================= Sight =============================

function canSee(ship1, ship2) {
  const dist = behaviors.getLength(behaviors.subtract(ship1.pos, ship2.pos));
  return dist <= ship1.sightRange;
}

// ============================= Behavior building =============================
// Constructs a weighted behavior array for a ship each step based on what it
// can currently see. Also handles state transitions since it is directly related 
// to said steering

function buildBehaviors(ship, visibleShips, region) { 
  const behaviorList = [];
  /* ======== SHIP STATE INFORMATION ===========================================
  Listing behaviors, in descending order of weight/priority of each ship state 
  (states listed in ascending order of prio):
  - Merchants:
  --- State 1: Avoids land, follows A* path to its destination, and flees nearest pirate (iff visible)
  --- State 10: In combat; i.e. standing still

  - Patrols:
  --- State 1: Follows strict patroling path
  --- State 2: Avoids land, pursues a pirate (target achieved via distress call or pirate simply being within its range)
  --- State 10: In combat; i.e. standing still

  - Pirates:
  --- State 1: Avoids land, follows A* path to its destination
  --- State 2: Avoids land, pursues nearest visible merchant 
  --- State 3: Avoids land, flees nearest patrol ship
  --- State 4: Avoids land, follows A* path back to its home cove to refuel
  --- State 10: In combat; i.e. standing still
  */

  // Patrols in default state don't need land avoidance since they follow a 
  // strict path; all other ships should though!
  if (ship.type != "patrol" && ship.state != 1) { 
    // Project velocity forward ~5 time units (minutes in our case?) and check for land
    let veloProjection = (behaviors.add(ship.pos, behaviors.scalarMult(ship.velocity, 5)));
    if (!isOcean(cartesianToLatLng(veloProjection[0], veloProjection[1], {
      originLat: region.center[0],
      originLon: region.center[1]
      } )))
    {
      // If we found land there, "hard" flee from it 
      behaviorList.push({  ...behaviors.newFlee(), target: veloProjection, weight: 3.0 })
    }
  }
  // get all other ships, collected into 3 lists based on their type
  const visiblePirates   = visibleShips.filter(s => s.type === 'pirate');
  const visibleMerchants = visibleShips.filter(s => s.type === 'merchant');
  const visiblePatrols   = visibleShips.filter(s => s.type === 'patrol');

  // Always include persistent behavior (followPath)
  if (ship.behavior) {
    behaviorList.push(Object.assign(ship.behavior, { weight: 1.0 }));
  }

  if (ship.type === 'merchant') { // merchants should check for pirates to flee
    if (visiblePirates.length > 0) {
      const nearest = nearestShip(ship, visiblePirates); // flee the nearest pirate
      ship.inDistress = true;
      ship.distressAnswered = false; // this will be set to true once a patrol answers the call
      if (canSee(ship, nearest)) { //...if I can see it
        behaviorList.push({ ...behaviors.newFlee(), target: nearest, weight: 2.5 });
      }
    }
  }

  if (ship.type === 'pirate') {
    if (visibleMerchants.length > 0) { 
      const nearest = nearestShip(ship, visibleMerchants); // pursue the nearest merchant
      if (canSee(ship, nearest)) { //...if I can see it
        behaviorList.push({ ...behaviors.newPursue(1), target: nearest, weight: 2.0 });
      }
    }
    if (visiblePatrols.length > 0) { 
      const nearest = nearestShip(ship, visiblePatrols); // flee the nearest patrol ship
      if (canSee(ship, nearest)) { //...if I can see it
        behaviorList.push({ ...behaviors.newFlee(), target: nearest, weight: 3.0 });
      }
    }
  }

  if (ship.type === 'patrol') {
    if (visiblePirates.length > 0) {
      const nearest = nearestShip(ship, visiblePirates);
      behaviorList.push({ ...behaviors.newPursue(1), target: nearest, weight: 2.0 });
    }
  }

  // Fallback wander if nothing else applies
  if (behaviorList.length === 0) {
    behaviorList.push({ ...behaviors.newWander(), weight: 1.0 });
  }

  return behaviorList;
}

function nearestShip(ship, candidates) {
  return candidates.reduce((nearest, candidate) => {
    const d        = behaviors.getLength(behaviors.subtract(candidate.pos, ship.pos));
    const dNearest = behaviors.getLength(behaviors.subtract(nearest.pos, ship.pos));
    return d < dNearest ? candidate : nearest;
  });
}

// ============================= A* repath =============================
// For merchants only — recomputes path from current position to destination
// every REPATH_INTERVAL steps. Swaps in new path if found.

function maybeRepath(ship, navgraph, pathIdRef) {
  if (ship.type !== 'merchant' || !ship.destination || !navgraph) return ship;

  const steps = (ship.stepsSinceRepath ?? 0) + 1;

  if (steps < REPATH_INTERVAL) {
    return { ...ship, stepsSinceRepath: steps };
  }

  // Time to repath
  const newPath = aStar(navgraph, ship.pos, ship.destination, 'merchant', pathIdRef.value++);

  if (newPath) {
    return {
      ...ship,
      behavior: behaviors.newFollowPath(newPath, 0.04),
      stepsSinceRepath: 0,
    };
  }

  // A* failed — keep existing behavior, reset counter
  return { ...ship, stepsSinceRepath: 0 };
}

// ============================= Combat =============================

function advanceCombat(thisShip, shipsById) {
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

  return { ...shipsById, [enemyId]: updatedEnemy };
}

function getEncounterIncrements(ship, otherShip) {
  const types = [ship?.type, otherShip?.type];
  const hasPirate = types.includes('pirate');
  if (!hasPirate) {
    return null;
  }

  if (types.includes('merchant')) {
    return {
      merchantPirateEncounters: 1,
      patrolPirateEncounters: 0,
      totalPirateEncounters: 1,
    };
  }

  if (types.includes('patrol')) {
    return {
      merchantPirateEncounters: 0,
      patrolPirateEncounters: 1,
      totalPirateEncounters: 1,
    };
  }

  return null;
}

function checkForCombatScenario(ship, shipId, shipsById) { // return updated shipsById + encounter increments if combat begins
  if (ship.state === 10 || ship.state === 1) { // if this ship is in combat already or idle, ignore
    return { shipsById, encounterIncrements: null };
  }

  const otherEntries = Object.entries(shipsById).filter(([id]) => id !== shipId);

  for (const [otherId, otherShip] of otherEntries) {
    // Only pirates and merchants/patrols can enter combat with each other
    const isHostile = (ship.type === 'pirate' && otherShip.type !== 'pirate') ||
                      (ship.type !== 'pirate' && otherShip.type === 'pirate');

    if (!isHostile) continue;

    const dist = behaviors.getLength(behaviors.subtract(ship.pos, otherShip.pos));

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
        shipsById: {
          ...shipsById,
          [shipId]: updatedShip,
          [otherId]: updatedOther
        },
        encounterIncrements: getEncounterIncrements(ship, otherShip),
      };
    }
  }

  return { shipsById, encounterIncrements: null }; // no combat triggered
}

// ============================= Dest arrival / path reversal =============================

function checkForDestinationArrival(ship) {
  console.log('checkForDestinationArrival:', ship.type, 'currentParam:', ship.behavior?.currentParam, 'has path:', !!ship.behavior?.path, "ship state: ", ship.state);
  if (!ship.behavior?.path) return ship; // ignore ships who don't have a path
  if (ship.behavior.currentParam < 0.97) return ship; // ignore ships who aren't within 3% of completing their path

  // If we reach this point, the ship in question is very near the end of its path; determine what to do based on type + state:

  if ((ship.type === "merchant" ) && ship.state === 1) {
    return null; // merchant arrives at its destination port; succesful delivery
    // TODO: track total succesful deliveries? would need to pass in run
  }

  if ((ship.type === "pirate" ) && ship.state === 1) {
    return {...ship,
      destPos: getSomaliaHotspot() // reached hotspot target without finding merchant to attack; check out a diff area
    }
  }

  if ((ship.type === "patrol" ) && ship.state === 1) {
    // Hit end of patrol path without a distress call or pirate encounter; reverse course + keep looking
    console.log("\nREVERSING A PATROL PATH, IF THIS IS BEING SPAMMED SOMETHING IS WRONG\n")
    const reversedPoints = [...ship.behavior.path.points].reverse();
    const rebuiltPath = behaviors.assemblePath(behaviors.newPath(reversedPoints, ship.behavior.path.id));

    if (!rebuiltPath) {
      return ship; // zero length path, keep going
    }

    // WEIRD MERGE ISSUE
    // I don't think the following block of code is supposed to be here
    // I'm also not sure where it's supposed to go
    // So I've just gotta comment it out for the time being
    // And we'll figure out where it goes soon

//   // Apply ocean current displacement to the ship's new position
//   const pos = newMover.kinematic.pos;
//   const [cx, cy] = getOceanCurrent(pos[0], pos[1]);
//   const currentOffset = [cx * timeStep, cy * timeStep];
//   const adjustedPos = behaviors.add(pos, currentOffset);
//
//   const moverWithCurrent = {
//     ...newMover,
//     kinematic: {
//       ...newMover.kinematic,
//       pos: adjustedPos,
//     },
//     behavior: {
//       ...newMover.behavior,
//       k1: {
//         ...newMover.kinematic,
//         pos: adjustedPos,
//       },
//     },
//   };
//
//   return {
//     ...ship,
//     mover: moverWithCurrent
//   };
// }

    return {
      ...ship,
      behavior: {
        ...ship.behavior,
        path: rebuiltPath, // only change path
        currentParam: 0, // and "reset progress"
      }
    };
  }
  return ship; // no change to this ship needed if we hit this point
}

// ============================= Movement =============================

function updateShipMovement(ship, visibleShips, timeStep) {
  if (ship.inCombat) return ship; // ships in combat do NOT move

  const behaviorList = buildBehaviors(ship, visibleShips); // determine what behaviors this ship
  // should currently exhibit based on what ships are visible to it
  const steering     = behaviors.getTotalSteering(ship, behaviorList); // combine those behaviors
  // to get ONE steering output

  // return updated version of the passed in ship, whose movement stats now reflect the updated steering
  return behaviors.updateShip(ship, steering, timeStep);
}

// ============================= Step =============================

// pathIdRef is a simple counter object so repath calls get unique path IDs
// without needing global state
const pathIdRef = { value: 10000 };

function step(run, regions, timeStep = 1) {
  let shipsById = { ...run.currentState.ships };
  let points = {...run.points};
  let encounterTotals = {
    merchantPirateEncounters: 0,
    patrolPirateEncounters: 0,
    totalPirateEncounters: 0,
  };

  

  // Get navgraph for this run's region (may be undefined for non-Somalia regions)
  const region   = regions?.[run.regionId];
  const navgraph = region?.navgraph ?? null;

  for (const [id, ship] of Object.entries(shipsById)) {
    let updatedShip = shipsById[id];

    // If this ship is a merchant who has arrived at its port, despawn it
    updatedShip = checkForDestinationArrival(updatedShip);
    if (updatedShip === null) {
      delete shipsById[id];
      continue;
    }

    // Build visible ships list
    const visibleShips = Object.values(shipsById)
      .filter(other => other !== updatedShip)
      .filter(other => behaviors.getLength(behaviors.subtract(other.pos, updatedShip.pos)) <= updatedShip.sightRange);

    // Repath merchants periodically
    updatedShip = maybeRepath(updatedShip, navgraph, pathIdRef);
    shipsById[id] = updatedShip;

    // Check if this ship should enter combat with anyone
    const combatResult = checkForCombatScenario(updatedShip, id, shipsById);
    shipsById = combatResult.shipsById;
    if (combatResult.encounterIncrements) {
      encounterTotals = {
        merchantPirateEncounters:
          encounterTotals.merchantPirateEncounters + combatResult.encounterIncrements.merchantPirateEncounters,
        patrolPirateEncounters:
          encounterTotals.patrolPirateEncounters + combatResult.encounterIncrements.patrolPirateEncounters,
        totalPirateEncounters:
          encounterTotals.totalPirateEncounters + combatResult.encounterIncrements.totalPirateEncounters,
      };
    }
    updatedShip = shipsById[id];

    // Damage dealing
    shipsById   = advanceCombat(updatedShip, shipsById);
    updatedShip = shipsById[id];

    // Movement
    updatedShip = updateShipMovement(updatedShip, visibleShips, timeStep);
    shipsById[id] = updatedShip;

    shipsById[id] = updatedShip;
  }

  return {
    ...run,
    currentState: {
      ...run.currentState,
      stats: {
        ...run.currentState?.stats,
        merchantPirateEncounters:
          (run.currentState?.stats?.merchantPirateEncounters ?? 0) + encounterTotals.merchantPirateEncounters,
        patrolPirateEncounters:
          (run.currentState?.stats?.patrolPirateEncounters ?? 0) + encounterTotals.patrolPirateEncounters,
        totalPirateEncounters:
          (run.currentState?.stats?.totalPirateEncounters ?? 0) + encounterTotals.totalPirateEncounters,
      },
      ships: shipsById
    }
  };
}

export { step };
