import * as behaviors from './behaviors.js';
import { aStar } from './aStar.js';
import * as data from './classes.js'
import { getOceanCurrent } from './oceanCurrents.js'
import { isOcean } from '../utils/isOcean.js';
import { cartesianToLatLng, latLngToCartesian } from '../utils/coords.js';
import { regionBoundingBoxes } from './regions.js';

const COMBAT_RANGE   = 500;
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

  // LAND AVOIDANCE
  
  // Keep brand-new ships from doing this to avoid getting stuck on the slightly more "inland" spawn points
  if (!(ship.type == "patrol" && ship.state == 1) && ship.stepsAlive > 9) { 

    // Using these to project velocity progressively farther to "smooth" the avoidance
    const projectionTimes = [3, 5, 7];
    let landTarget = null;

    // Project velocity forward for each of those times, and check for land

    for (const t of projectionTimes) {
      const proj = behaviors.add(ship.pos, behaviors.scalarMult(ship.velocity, t));
      const ll = cartesianToLatLng(proj[0], proj[1], {
        originLat: region.center[0],
        originLon: region.center[1],
        metersPerUnit: 1,
        headingDegrees: 0,
      });
      if (!isOcean(ll.lat, ll.lng)) {
        landTarget = proj;
        break; // use the closest land hit
      }
  }

    // if the above loop found a land target, add a flee from it to this ship's behaviors
    if (landTarget) {
      const hitTime = projectionTimes.find(t => {
        const proj = behaviors.add(ship.pos, behaviors.scalarMult(ship.velocity, t));
        const ll = cartesianToLatLng(proj[0], proj[1], { originLat: region.center[0], originLon: region.center[1], metersPerUnit: 1, headingDegrees: 0 });
        return !isOcean(ll.lat, ll.lng);
      });
      // "how close am I to land?"
      const urgency = hitTime === 3 ? 4.0 : hitTime === 5 ? 3.0 : 2.0;
      behaviorList.push({ ...behaviors.newFlee(), target: { pos: landTarget }, weight: urgency });
    }
  }

  // get all other ships, collected into 3 lists based on their type
  const visiblePirates   = visibleShips.filter(s => s.type === 'pirate');
  const visibleMerchants = visibleShips.filter(s => s.type === 'merchant');
  const visiblePatrols   = visibleShips.filter(s => s.type === 'patrol');

  // always include persistent behavior (A* followPath)
  if (ship.behavior) {
    behaviorList.push(Object.assign(ship.behavior, { weight: 1.0 }));
  }

  if (ship.type === 'merchant') { // merchants should check for pirates to flee
    if (visiblePirates.length > 0) {
      const nearest = nearestShip(ship, visiblePirates); // flee the nearest pirate
      if (canSee(ship, nearest)) { //...if I can see it
        ship.inDistress = true; // set distress flag so a patrol knows to answer the call
        ship.distressAnswered = false; // this will be set to true once a patrol answers the call
        console.log("A merchant is fleeing a pirate");
        behaviorList.push({ ...behaviors.newFlee(), target: nearest, weight: 2.5 });
      }
    }
  }

  if (ship.type === 'pirate') {
    if ((visibleMerchants.length > 0) && (ship.state == 1)) { 
      const nearest = nearestShip(ship, visibleMerchants); // pursue the nearest merchant
      if (canSee(ship, nearest)) { //...if I can see it
        ship.state = 2;
        console.log("A pirate is pursuing a merchant");
        behaviorList.push({ ...behaviors.newPursue(1), target: nearest, weight: 2.0 });
      }
    }
    if ((visiblePatrols.length > 0) && (ship.state <= 2)) { 
      const nearest = nearestShip(ship, visiblePatrols); // flee the nearest patrol ship
      if (canSee(ship, nearest)) { //...if I can see it
        ship.state = 3;
        console.log("A pirate is fleeing a patrol");
        behaviorList.push({ ...behaviors.newFlee(), target: nearest, weight: 3.0 });
      }
    }
    if (ship.fuel <= 15) {
      ship.state = 4;
      ship.behavior = behaviors.newFollowPath(
        aStar(region.navgraph, ship.pos, ship.homeCove, 'pirate', pathIdRef.value++),
        0.04
      );
    }
  }

  if (ship.type === 'patrol') {
    if (visiblePirates.length > 0) {
      const nearest = nearestShip(ship, visiblePirates);
      behaviorList.push({ ...behaviors.newPursue(1), target: nearest, weight: 2.0 });
    }
  }

  // fallback to wander (SHOULDNT happen)
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

// ============================= Destination choosing =============================
// (For pirates and patrols)

export function choosePirateDestination(ship, region) {
  const biggestDim = Math.max(region.width, region.height) * 1000; // km to meters
  const maxDist = biggestDim / 2;
  const minDist = biggestDim / 8;
  const targetDist = (minDist + maxDist) / 2; // aim for middle of the range
  const n = 5;
  const bounds = region.bounds;
  const points = [];

  let attempts = 0;
  while (points.length < n && attempts < 100) {
    attempts++;

    const randLat = bounds.bottom + Math.random() * (bounds.top - bounds.bottom);
    const randLon = bounds.left  + Math.random() * (bounds.right - bounds.left);

    if (!isOcean(randLat, randLon)) continue;

    const randCart = latLngToCartesian(randLat, randLon, {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });

    const dist = behaviors.getLength(behaviors.subtract(ship.pos, randCart));
    if (dist < minDist || dist > maxDist) continue;

    points.push([randLat, randLon]); // store lat/lon instead of cartesian; more compatible with ship building funcs in reducer
  }

  if (points.length === 0) return null;

  // pick the point whose distance from ship is closest to targetDist
  return points.reduce((best, p) => {
    const bestCart = latLngToCartesian(best[0], best[1], {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });
    const pCart = latLngToCartesian(p[0], p[1], {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });
    const dBest = Math.abs(behaviors.getLength(behaviors.subtract(ship.pos, bestCart)) - targetDist);
    const dP    = Math.abs(behaviors.getLength(behaviors.subtract(ship.pos, pCart))    - targetDist);
    return dP < dBest ? p : best;
  });
}

// ============================= A* repath =============================
// Recomputes path from current position to destination
// every REPATH_INTERVAL steps. Swaps in new path if found.

function maybeRepath(ship, navgraph, pathIdRef) {
  if ( /* ship.type !== 'merchant' || */ !ship.destination || !navgraph) return ship;

  const steps = (ship.stepsSinceRepath ?? 0) + 1;

  if (steps < REPATH_INTERVAL) {
    return { ...ship, stepsSinceRepath: steps };
  }

  // Time to repath
  const newPath = aStar(navgraph, ship.pos, ship.destination, ship.type, pathIdRef.value++);

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
// Make a ship engage with its enemy. Combat takes place over one step
function advanceCombat(thisShip, shipId, shipsById) {
  if (thisShip.state !== 10 || !thisShip.currentEnemyId) return shipsById;

  const enemyId = thisShip.currentEnemyId;
  const enemy = shipsById[enemyId];
  if (!enemy) return shipsById;

  if (thisShip.type === 'patrol') {
    const newShips = { ...shipsById };
    delete newShips[enemyId];
    newShips[shipId] = { ...thisShip, inCombat: false, state: 1, currentEnemyId: null };
    return newShips;
  }

  if (thisShip.type === 'merchant') {
    const newShips = { ...shipsById };
    if (Math.random() < 0.33) {
      delete newShips[enemyId]; // pirate loses
    } else {
      delete newShips[shipId]; // merchant loses
      newShips[enemyId] = { ...enemy, inCombat: false, state: 1, currentEnemyId: null };
    }
    return newShips;
  }

  return shipsById;
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
  if (ship.state === 10) return { shipsById, encounterIncrements: null }; // ignore ships already in combat

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

function checkForDestinationArrival(ship, region) {
  if (!ship.behavior?.path) return ship; // ignore ships who don't have a path
  if (ship.behavior.currentParam < 0.97) return ship; // ignore ships who aren't within 3% of completing their path

  // If we reach this point, the ship in question is very near the end of its path; determine what to do based on type + state:

  if ((ship.type === "merchant" ) && ship.state === 1) {
    return null; // merchant arrives at its destination port; succesful delivery
    // TODO: track total succesful deliveries? would need to pass in run
  }

  if (ship.type === "pirate") {
    const destLatLng = choosePirateDestination(ship, region);
    const destCart = destLatLng ? latLngToCartesian(destLatLng[0], destLatLng[1], {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    }) : null;

    if (ship.state === 4) { // state 4 means this pirate must be arriving to refuel
      return { ...ship, fuel: 100, state: 1, destination: destCart };
    } else {
      return { ...ship, destination: destCart };
    }
  }

  if ((ship.type === "patrol" ) && ship.state === 1) {
    // Hit end of patrol path without a distress call or pirate encounter; reverse course + keep looking
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

function updateShipMovement(ship, visibleShips, timeStep, region) {
  if (ship.inCombat) return ship; // ships in combat do NOT move

  const behaviorList = buildBehaviors(ship, visibleShips, region); // determine what behaviors this ship
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
    updatedShip = checkForDestinationArrival(updatedShip, region);
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

    // Performing combat
    shipsById = advanceCombat(updatedShip, id, shipsById);
    updatedShip = shipsById[id];

    // Movement
    updatedShip = updateShipMovement(updatedShip, visibleShips, timeStep, region);
    shipsById[id] = { ...updatedShip, stepsAlive: (updatedShip.stepsAlive ?? 0) + 1 };
    // For pirates: decrement fuel
    if (updatedShip.type === 'pirate') {
      updatedShip = { ...updatedShip, fuel: updatedShip.fuel - 0.00534 };
      shipsById[id] = updatedShip;
    }
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
