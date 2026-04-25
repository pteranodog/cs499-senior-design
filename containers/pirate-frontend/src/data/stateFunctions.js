import seedrandom from 'seedrandom';
import * as behaviors from './behaviors.js';
import { aStar } from './aStar.js';
import { getOceanCurrent } from './oceanCurrents.js'
import { isOcean } from '../utils/isOcean.js';
import { cartesianToLatLng, latLngToCartesian } from '../utils/coords.js';
import { getTimeOfDayInfo } from '../utils/timeOfDay.js';

const COMBAT_RANGE   = 2000;
const REPATH_INTERVAL = 20; // steps between A* recomputes for merchants
const NIGHT_SIGHT_RANGE_MULTIPLIER = 0.5;

function getEffectiveSightRange(ship, isNight) {
  const baseSightRange = Number(ship.baseSightRange ?? ship.sightRange ?? 0);

  if (!isNight || (ship.type !== 'merchant' && ship.type !== 'pirate')) {
    return baseSightRange;
  }

  return baseSightRange * NIGHT_SIGHT_RANGE_MULTIPLIER;
}

// ============================= Sight =============================

// can ship1 see ship2? (note order)
function canSee(ship1, ship2) {
  const dist = behaviors.getLength(behaviors.subtract(ship1.pos, ship2.pos));
  return dist <= ship1.sightRange;
}

// assuming ship2 is a target of ship1, should ship1 "forget" ship2?
function shouldForget(ship1, ship2) {
  const dist = behaviors.getLength(behaviors.subtract(ship1.pos, ship2.pos));
  return dist > ship1.forgetRange;
}

function nearestShip(ship, candidateEntries) {
  return candidateEntries.reduce((best, [id, candidate]) => {
    const d = behaviors.getLength(behaviors.subtract(candidate.pos, ship.pos));
    const dBest = behaviors.getLength(behaviors.subtract(best[1].pos, ship.pos));
    return d < dBest ? [id, candidate] : best;
  });
}

function getTrackedTarget(ship, shipsByID) {
  if (!ship.currentTargetId) return null;
  return shipsByID.find(([id]) => id === ship.currentTargetId)?.[1] ?? null;
}

// Return copy of ship w/updated (non-combat) state & flags
function updateShipState(ship, shipsByID, region) {
  /* ======== SHIP STATE INFORMATION ===========================================
  Listing behaviors, in descending order of weight/priority of each ship state 
  (states listed in ascending order of prio):
  - Merchants:
  --- State 1: Avoids land, follows A* path to its destination
  --- State 2: Avoids land, follows A* path to its destination, AND flees nearest pirate 
  --- State 10: In combat; i.e. standing still

  - Patrols:
  --- State 1: Follows A* path to its destination
  --- State 2: Avoids land, pursues a pirate (target achieved via distress call or pirate simply being within its range)
  --- State 10: In combat; i.e. standing still

  - Pirates:
  --- State 1: Avoids land, follows A* path to its destination
  --- State 2: Avoids land, pursues nearest visible merchant 
  --- State 3: Avoids land, flees nearest patrol ship
  --- State 4: Avoids land, follows A* path back to its home cove to refuel
  --- State 10: In combat; i.e. standing still
  */

  if (ship.state === 10) return { updatedShip: ship, sideEffects: [] }; // if this somehow checked a ship in combat ignore it;
  // combat state is managed by different functions

  let updatedShip =  {
  ...ship
  };


  // get all other ships, collected into 3 lists based on their type
  const allPirates = shipsByID.filter(([, s]) => s.type === 'pirate');
  const allMerchants = shipsByID.filter(([, s]) => s.type === 'merchant');
  const allPatrols = shipsByID.filter(([, s]) => s.type === 'patrol');

  if (ship.type === 'merchant') {

    // ==================== "Forget" check ==================== 
    if (ship.state == 2 ) { // if i'm fleeing a pirate,
      const trackedTarget = getTrackedTarget(ship, shipsByID);
      if(!trackedTarget || shouldForget(ship,trackedTarget)) { // but it's outside my "care" range...
        updatedShip.state = 1; // then forget it and go back to strictly following trade route
        updatedShip.currentTargetId = null;

        return { updatedShip, sideEffects: [] }
      }
    }

    // ==================== "should flee" check ==================== 
    if (allPirates.length > 0) {
      const [nearestId, nearest] = nearestShip(ship, allPirates); // flee the nearest pirate
      if ((ship.state === 1) && (canSee(ship, nearest))) { //...if I can see it and i'm idle
        updatedShip.currentTargetId = nearestId; // save ID of this pirate for flee init + patrol target
        updatedShip.state = 2;
        console.log("A merchant is fleeing a pirate");

        // force nearest patrol to answer my distress call
        let nearestPatrolID;
        let nearestPatrol;
        if (allPatrols.length > 0) {
          [nearestPatrolID, nearestPatrol] = nearestShip(ship, allPatrols);
        }

        // unique return structure since, in this specific case, we want to alter more than one ship
        return {
          updatedShip: { ...updatedShip, currentTargetId: nearestId },
          // returning the array sideEffects, along with updatedShip here, is my way of modifying 
          // the state/target/etc of more than one ship here, while stil maintaining
          // a functional paradigm; if we need to tell the nearest patrol to respond to distress, 
          // then sideEffects will contain an object with two fields: the ID of the "savior" patrol ship,
          // and a sub-object of the fields of that patrol ship that will change (its pursue target and state).
          // If modification to ships besides the passed one are not needed, the array remains empty:                                                         1.6x as fast
          sideEffects: nearestPatrolID ? [{ targetId: nearestPatrolID, changes: { currentTargetId: nearestId, respondingToDistress: true, state: 2, maxSpeed: 1234.672 } }] : []
        };
      } 
    }
  }


  
  else if (ship.type === 'pirate') {

    // ==================== "Forget" checks ==================== 
    if((ship.state == 2)) { // if i'm chasing a merchant
      const trackedTarget = getTrackedTarget(ship, shipsByID);
      if (!trackedTarget || shouldForget(ship, trackedTarget)) { // and it's outside my "care" range
        updatedShip.state = 1; // forget it and go back to idling
        updatedShip.currentTargetId = null;
        return { updatedShip, sideEffects: [] }
      }
    }

    if((ship.state == 3)) { // if i'm fleeing a patrol
      const trackedTarget = getTrackedTarget(ship, shipsByID);
      if (!trackedTarget || shouldForget(ship, trackedTarget)) { // and it's outside my "care" range
        updatedShip.fuelBurnMultiplier = 1;
        updatedShip.maxSpeed = 766.67; // slow back down to normal max speed,
        updatedShip.state = 1; // forget it and go back to idling
        updatedShip.currentTargetId = null;
        return { updatedShip, sideEffects: [] }
      }
    }


    // ==================== "Should flee/pursue/refuel" checks ====================
    if ((allMerchants.length > 0) && (ship.state == 1)) { 
      const [nearestId, nearest] = nearestShip(ship, allMerchants); // pursue the nearest merchant
      if (canSee(ship, nearest)) { //...if I can see it
        updatedShip.currentTargetId = nearestId; // save ID of this merchant for pursue init
        updatedShip.state = 2;
        console.log("A pirate is pursuing a merchant");

        return { updatedShip, sideEffects: [] }
      }
    }
    if ((allPatrols.length > 0) && (ship.state <= 2)) { 
      const [nearestId, nearest] = nearestShip(ship, allPatrols); // flee the nearest patrol ship
      if (canSee(ship, nearest)) { //...if I can see it
        updatedShip.maxSpeed = 843.34; // speed up in desparation
        updatedShip.fuelBurnMultiplier = 1.5; // this will burn 50% more fuel, which sucks for them but anything to not sink!
        updatedShip.currentTargetId = nearestId; // save ID of this patrol for flee init
        updatedShip.state = 3;
        console.log("A pirate is fleeing a patrol");

        return { updatedShip, sideEffects: [] }
      }
    }

    if (ship.fuel <= 15 && ship.state !== 4) {
      if ((ship.state === 3)) {
        updatedShip.maxSpeed = 766.67;
      }
      updatedShip.destination = ship.homeCove; 
      updatedShip.stepsSinceRepath = REPATH_INTERVAL; // force immediate repath
      updatedShip.state = 4; // forget everything and go HOME for fuel
      console.log("A pirate is running low on fuel and attempting to return home");
      return { updatedShip, sideEffects: [] }
    }
  }



  else if (ship.type === 'patrol') {

    // ==================== "Forget" checks ==================== 

    if((ship.state == 2)) { // if i'm chasing a pirate
      const trackedTarget = getTrackedTarget(ship, shipsByID);
      if (!trackedTarget || shouldForget(ship, trackedTarget)) { // and it's outside my "care" range OR no longer exists...
        updatedShip.maxSpeed = 771.67; // slow back down to normal max speed...
        updatedShip.respondingToDistress = false;
        updatedShip.state = 1; // forget it and go back to idling
        updatedShip.currentTargetId = null;

        return { updatedShip, sideEffects: [] }
      }
    }

    // ==================== "Should pursue" check ==================== 
    else if ((allPirates.length > 0) && (ship.state == 1)) {
      const [nearestId, nearest] = nearestShip(ship, allPirates); // pursue the nearest pirate
      if (canSee(ship, nearest)) { // if i can see it
        updatedShip.currentTargetId = nearestId; // save ID of this patrol for flee init
        updatedShip.maxSpeed = ship.respondingToDistress? 1234.67 : 1080.34; // speed up
        updatedShip.state = 2;

        return { updatedShip, sideEffects: [] }
      }
    }
  }


  // "what is sideEffects??" see giant blurb ~ 80 lines up about it
  return { updatedShip, sideEffects: [] }
}

// Return the land node (an object) in the passed navgraph that is closest to a given position
function findNearestLandNode(pos, navgraph) {
  let nearest = null;
  let bestDist = Infinity;
  for (const node of Object.values(navgraph)) {
    if (node.passable) continue; // only care about land nodes
    const d = behaviors.getLength(behaviors.subtract(pos, node.cartesian));
    if (d < bestDist) {
      bestDist = d;
      nearest = node;
    }
  }
  return nearest;
}


// ============================= Behavior building =============================
// Constructs a weighted behavior array for a ship each step based on what it
// can currently see. Also handles state transitions since it is directly related 
// to said steering

function buildBehaviors(ship, shipsById, region) {
  if (!ship) return null;

  const behaviorList = [];

  // LAND AVOIDANCE
  // Active ONLY FOR SHIPS WHO ARE PURSUING/SEEKING; rely on navgraph
  // to avoid land if the ship is strictly following a path in it
  const useLandAvoidance = (ship.state === 2 || ship.state === 3 || ship.stepsAlive <= 9);

  if (useLandAvoidance) {
    const nearestLandNode = findNearestLandNode(ship.pos, region.navgraph);
    if (nearestLandNode) {
      const distToLand = behaviors.getLength(behaviors.subtract(ship.pos, nearestLandNode.cartesian));
      let danger_dist;
      if (ship.type === 'patrol') {
        danger_dist = 10000; // 10km; significantly less than pirates so they dont both get corner trapped
      } 
      else {
        danger_dist = 150000; // 150km 
      }
      if (distToLand < danger_dist) {
        const urgency = 1 - (distToLand / danger_dist); // 0 at edge, 1 at land
        behaviorList.push({ 
          ...behaviors.newFlee(), 
          target: { pos: nearestLandNode.cartesian }, 
          weight: urgency * 4.0 
        });
      }
    }
  }

  // FOLLOW PATH
  // Active in state 1 ("idle") for all ship types, and state 4 for pirates (refueling path), and NEW: state 2 patrols responding to distress calls
  // Carried over from ship.behaviorList so path progress persists
  const shouldFollowPath = ship.state === 1 || ((ship.type === 'merchant' && ship.state === 2) || (ship.type === 'pirate' && ship.state === 4)
  || (ship.type === 'patrol' && ship.respondingToDistress && ship.state === 2));
  if (shouldFollowPath) {
    const existingFollowPath = ship.behaviorList?.find(b => b.type === 'followPath');
    if (existingFollowPath) { // if I was already following a path, and should keep doing so, include follow in this updated behavior list.
      behaviorList.push(Object.assign(existingFollowPath, { weight: 1.0 }));
    }
  }

  // STATE-DRIVEN SITUATIONAL BEHAVIORS
  // Reconstructed each step
  // currentTargetId, if it exists, is either the ID of the ship I'm fleeing from or the ID of the ship I'm pursuing
  const target = ship.currentTargetId ? shipsById[ship.currentTargetId] : null;

  if (ship.type === 'merchant') {
    if (ship.state === 2 && target) {
      // flee the pirate that triggered distress
      behaviorList.push({ ...behaviors.newFlee(), target, weight: 2.5 });
    }
  }

  if (ship.type === 'pirate') {
    if (ship.state === 2 && target) {
      // pursue the merchant
      behaviorList.push({ ...behaviors.newPursue(1), target, weight: 2.0 });
    }
    if (ship.state === 3 && target) {
      // flee the patrol
      behaviorList.push({ ...behaviors.newFlee(), target, weight: 2.0 });
    }
  }

  if (ship.type === 'patrol') {
    if (ship.state === 2 && target && !ship.respondingToDistress) {
      // pursue the pirate
      behaviorList.push({ ...behaviors.newPursue(4), target, weight: 2.0 });
    }
  }

  // fallback to wander (SHOULDN'T happen)
  if (behaviorList.length === 0) {
    const ll = cartesianToLatLng(ship.pos[0], ship.pos[1], {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });
    console.warn(
      `Behavior builder falling back to wander — this should not happen!\n` +
      `  Type: ${ship.type}\n` +
      `  State: ${ship.state}\n` +
      `  Location: ${ll.lat.toFixed(3)}, ${ll.lng.toFixed(3)}\n` +
      `  currentTargetId: ${ship.currentTargetId ?? 'none'}\n` +
      `  target exists in shipsById: ${ship.currentTargetId ? !!shipsById[ship.currentTargetId] : 'N/A'}\n` +
      `  behaviorList on ship: ${JSON.stringify(ship.behaviorList?.map(b => b.type))}\n` +
      `  stepsAlive: ${ship.stepsAlive}\n` +
      `  fuel: ${ship.fuel?.toFixed(1) ?? 'N/A'}`
    );
    behaviorList.push({ ...behaviors.newWander(), weight: 1.0 });
  }

  return behaviorList;
}


// ============================= Destination choosing =============================
// (For pirates and patrols)

export function choosePirateDestination(ship, region, seed, step, index) {

  const rng = seedrandom(seed + '-' + step + '-' + index);
  const largestSide = Math.max(region.width, region.length) * 1000; // have to convert km to m
  // min/max distances are fractions of the largest side of the region boundary:
  const maxDist = largestSide / 1.8;
  const minDist = largestSide / 8; 
  const targetDist = (minDist + maxDist) / 2; // TEMPORARY?: prioritize the middle distance between the two
  const n = 3; // # of possible points to choose from CHANGED TO 3 BECAUSE 5 WAS CAUSING PERFORMANCE PROBLEMS
  const bounds = region.bounds;
  const points = [];

  let attempts = 0;
  while (points.length < n && attempts < 100) { // limit to 100 tries
    attempts++;

    // choose random latlon in the region bounds
    const randLat = bounds.bottom + rng() * (bounds.top - bounds.bottom);
    const randLon = bounds.left  + rng() * (bounds.right - bounds.left);

    // disregard that point if it's on land
    if (!isOcean(randLat, randLon)) continue;

    // convert that latlon to cartesian so we can check its distance from this ship
    // and compare that distance against max, min and target dist
    const randCart = latLngToCartesian(randLat, randLon, {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });

    const dist = behaviors.getLength(behaviors.subtract(ship.pos, randCart));

    // discard this point if it's completely out of range
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
    const dP = Math.abs(behaviors.getLength(behaviors.subtract(ship.pos, pCart)) - targetDist);
    return dP < dBest ? p : best;
  });
}

// provide a point for an idle patrol to path towards, prioritized based on distance from its home base
export function choosePatrolDestination(homeBase, ship, region, seed, step, index) {
  const rng = seedrandom(seed + '-' + step + '-' + index);
  const largestSide = Math.max(region.width, region.length) * 1000;

  const maxDist = largestSide / 1.5; 

  const minDist = largestSide / 4; 
  const targetDist = (minDist + maxDist) / 2; // prioritize the middle distance between the two
  const n = 3; // # of possible points to choose from CHANGED TO 3 BECAUSE 5 WAS CAUSING PERFORMANCE PROBLEMS
  const bounds = region.bounds;
  const points = [];

  let attempts = 0;
  while (points.length < n && attempts < 100) { // limit to 100 tries
    attempts++;

    // choose random latlon in the region bounds
    const randLat = bounds.bottom + rng() * (bounds.top - bounds.bottom);
    const randLon = bounds.left  + rng() * (bounds.right - bounds.left);

    // disregard that point if it's on land
    if (!isOcean(randLat, randLon)) continue; // POTENTIAL PERFORMANCE TODO: this should probably just check if a land node is nearby

    // convert that latlon to cartesian so we can check its distance from this ship
    // and compare that distance against max, min and target dist
    const randCart = latLngToCartesian(randLat, randLon, {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });

    const dist = behaviors.getLength(behaviors.subtract(homeBase.pos, randCart));

    // discard this point if it's completely out of range
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
    const dBest = Math.abs(behaviors.getLength(behaviors.subtract(homeBase.pos, bestCart)) - targetDist);
    const dP    = Math.abs(behaviors.getLength(behaviors.subtract(homeBase.pos, pCart))    - targetDist);
    return dP < dBest ? p : best;
  });
}

// ============================= A* repath =============================
// Recomputes path from current position to destination
// every REPATH_INTERVAL steps. Swaps in new path if found.

function maybeRepath(ship, navgraph, pathIdRef, shipsByID) {
  if ( /* ship.type !== 'merchant' || */ !ship.destination || !navgraph) return ship;


  // NEW: since patrols responding to distress are pathing to a moving target, they need to repath very frequently
  const steps = (ship.stepsSinceRepath ?? 0) + (ship.respondingToDistress? 5 : 1); 

  if (steps < REPATH_INTERVAL) {
    return { ...ship, stepsSinceRepath: steps };
  }

  // If we got here, time for this ship to repath
  let dest = ship.destination;
  // NEW: updated path for patrols responding to distress should set their destination to location of target
  if (ship.respondingToDistress) {
    // get reference to the pirate that caused distress
    const trackedTarget = getTrackedTarget(ship, shipsByID);
    if (trackedTarget) {
      // set destination to trackedTargets location
      dest = trackedTarget.pos;
    }
  }
  const newPath = aStar(navgraph, ship.pos, dest, ship.type, pathIdRef.value++);

  if (newPath) {
    return {
      ...ship,
      behaviorList: ship.behaviorList.map(b => // replace old path w/new
        b.type === 'followPath' 
          ? behaviors.newFollowPath(newPath, 0.04)
          : b
      ),
      stepsSinceRepath: 0,
    };
  }

  // A* failed — keep existing behavior, reset counter
  return { ...ship, stepsSinceRepath: 0 };
}

// ============================= Combat =============================
// Make a ship engage with its enemy. Combat takes place over one step
function advanceCombat(thisShip, shipId, shipsById, seed, step, index) {
  if (thisShip.state !== 10 || !thisShip.currentEnemyId) {
    return { shipsById, liveCountIncrements: null};
  }

  const enemyId = thisShip.currentEnemyId;
  const enemy = shipsById[enemyId];
  if (!enemy) {
    return { shipsById, liveCountIncrements: null };
  }

  const rng = seedrandom(seed + '-' + step + '-' + index);
  if (thisShip.type === 'pirate') {
    return { shipsById, liveCountIncrements: null }; // outcome handled by patrol/merchant's advanceCombat call
  }

  if (thisShip.type === 'patrol') {
    const newShips = { ...shipsById };
    delete newShips[enemyId];
    newShips[shipId] = { ...thisShip, inCombat: false, state: 1, currentEnemyId: null, maxSpeed: 771.67 };
    if (!thisShip.respondingToDistress) {
      return { shipsById: newShips, 
        liveCountIncrements: {
        sinks: 1,   // patrol sinks pirate
      } };
    } else {
      return { shipsById: newShips, 
        liveCountIncrements: {
        rescues: 1,   // patrol rescued a distressed merchant
      } };
    }
  }

  if (thisShip.type === 'merchant') {
    const newShips = { ...shipsById };
    if (rng() < 0.33) {

      delete newShips[enemyId]; // pirate loses
      newShips[shipId] = { ...thisShip, inCombat: false, state: 1, currentEnemyId: null,  maxSpeed: 633.4}; // remove combat state from victor
      return { 
        shipsById: newShips, 
        liveCountIncrements: {
            evasions: 1, // merchant evades capture
            sinks: 1,   // pirate sinks
        } };
      
    } else {
      delete newShips[shipId]; // merchant loses
      newShips[enemyId] = { ...enemy, inCombat: false, state: 1, currentEnemyId: null, maxSpeed: 766.67 };
      return {
        shipsById: newShips,
        liveCountIncrements: {
          captures: 1,  //merchant is captured
        },
      };
    }
  }

  return { shipsById, liveCountIncrements: null };
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
// Handle any and all Path destination arrivals.
function checkForDestinationArrival(ship, region, seed, step, index) {
  if (!ship) return null; // bandaid fix for weird combat thing

  let cutoff = 0.97;
  if (ship.respondingToDistress) {
    cutoff = 0.99;
  }

  const followPath = ship.behaviorList?.find(b => b.type === 'followPath');
  if (!followPath?.path) return ship; // ignore ships who don't have a path
  if (followPath.currentParam < cutoff) return ship; // ignore ships who aren't within 3% of completing their path

  // IF WE REACH THIS POINT, the ship in question is *very* near the end of its path; determine what to do based on type + state:

  if ((ship.type === "merchant" ) && ship.state === 1) {
    return null; // merchant arrives at its destination port; succesful delivery
  }

  if (ship.type === "pirate") {
    // choose new destination; arrived at this one and didn't find anything to flee/chase on the way
    const destLatLng = choosePirateDestination(ship, region, seed, step, index);
    const destCart = destLatLng ? latLngToCartesian(destLatLng[0], destLatLng[1], {
      originLat: region.center[0],
      originLon: region.center[1]
    }) : null;


    if (ship.state === 4) { // state 4 means this pirate must be arriving to refuel
      return null; // NEW: delete to represent pirate "taking a break" so as to not allow theoretically infinite pirates
    } else {
      return { ...ship, destination: destCart };
    }
  }

  // only concerned w/ patrols who are in default "search" state
  if ((ship.type === "patrol" ) && ship.state === 1) { 
    const destLatLng = choosePatrolDestination(ship.homeBase, ship, region, seed, step, index);
    const destCart = destLatLng ? latLngToCartesian(destLatLng[0], destLatLng[1], {
      originLat: region.center[0],
      originLon: region.center[1]
    }) : null;
    return { ...ship, destination: destCart };
  }
  return ship; // no change to this ship needed if we hit this point
}

// ============================= Movement =============================

function updateShipMovement(ship, shipsById, timeStep, region) {
  if (ship.inCombat) return ship; // ships in combat don't move

  const behaviorList = buildBehaviors(ship, shipsById, region); // determine what behaviors this ship
  // should currently exhibit based on what ships are visible to it
  const steering     = behaviors.getTotalSteering(ship, behaviorList); // combine those behaviors
  // to get ONE steering output

  // return updated version of the passed in ship, whose movement stats now reflect the updated steering
  const updatedShip = behaviors.updateShip(ship, steering, timeStep);

  // NEW: apply ocean current 

  const [currentX, currentY] = getOceanCurrent(updatedShip.pos[0], updatedShip.pos[1],
    {
      originLat: region.center[0],
      originLon: region.center[1]
    }
  )

  return {
    ...updatedShip,
    pos: [updatedShip.pos[0] + currentX * 60, updatedShip.pos[1] + currentY * 60]
  }
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
  let liveCountTotals = {
    captures: 0,
    evasions: 0,
    sinks: 0,
    rescues: 0
  };
  // New: List of encounter events (copied from previous state)
  let encounterEvents = Array.isArray(run.currentState.encounterEvents) ? [...run.currentState.encounterEvents] : [];

  // Get navgraph for this run's region (may be undefined for non-Somalia regions)
  const region   = regions?.[run.regionId];
  const navgraph = region?.navgraph ?? null;
  const timeOfDayInfo = getTimeOfDayInfo({
    regionName: region?.name,
    startHour: run?.startHour,
    startMinute: run?.startMinute,
    elapsedTicks: run?.elapsedTime || 0,
    ticksPerMinute: run?.ticksPerMinute || 1,
  });

  for (const [id, ship] of Object.entries(shipsById)) {
    const currentShip = shipsById[id];
    if (!currentShip) continue;

    let updatedShip = {
      ...currentShip,
      baseSightRange: currentShip.baseSightRange ?? currentShip.sightRange,
      sightRange: getEffectiveSightRange(currentShip, timeOfDayInfo.isNight),
    };
    shipsById[id] = updatedShip;

    // If this ship is a merchant who has arrived at its port, despawn it
    updatedShip = checkForDestinationArrival(updatedShip, region, run.seed, run.elapsedTime, id);
    if (updatedShip === null) {
      delete shipsById[id];
      continue;
    }

    // process this ship's state (as in, if ship.state and various flags should change, do so)
    // in passing shipsByID to this function, we filter out the current ship and pass it as an array rather than an object:
    const stateMachineResult = updateShipState(updatedShip, Object.entries(shipsById).filter(([otherId]) => otherId !== id), region);

    updatedShip = stateMachineResult.updatedShip; // apply state changes to this ship
    shipsById[id] = updatedShip;

    // now, the above result might include side effects (i.e. the closest
    // patrol to this ship needs to respond to its distress; get the needed
    // changes to said patrol from sideEffects and apply those too)
    for (const sideEffect of stateMachineResult.sideEffects ?? []) { 
      // affectedShip = the respondant patrol ship to this ship' distress
      const affectedShip = shipsById[sideEffect.targetId];
      if (affectedShip) {
        shipsById[sideEffect.targetId] = { ...affectedShip, ...sideEffect.changes };
      }
    }



    // Repath periodically
    updatedShip = maybeRepath(updatedShip, navgraph, pathIdRef, Object.entries(shipsById));
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
      // New: Save encounter event (combat start)
      const shipA = updatedShip;
      const shipB = shipsById[combatResult.shipsById[id]?.currentEnemyId];
      if (shipA && shipB) {
        encounterEvents.push({
          type: 'combat',
          time: run.elapsedTime,
          pos: [...shipA.pos],
          shipAType: shipA.type,
          shipBType: shipB.type,
        });
      }
    }
    updatedShip = shipsById[id];

    // Performing combat
    const combatOutcome = advanceCombat(updatedShip, id, shipsById, run.seed, run.elapsedTime);
    shipsById = combatOutcome.shipsById;
    if (combatOutcome.liveCountIncrements) {
      // New: Save outcome event(s)
      const eventTypes = Object.keys(combatOutcome.liveCountIncrements);
      eventTypes.forEach(type => {
        if (combatOutcome.liveCountIncrements[type] > 0) {
          encounterEvents.push({
            type,
            time: run.elapsedTime,
            pos: [...updatedShip.pos],
            shipType: updatedShip.type,
          });
        }
      });
      liveCountTotals = {
        captures: liveCountTotals.captures + (combatOutcome.liveCountIncrements.captures ?? 0),
        evasions: liveCountTotals.evasions + (combatOutcome.liveCountIncrements.evasions ?? 0),
        sinks: liveCountTotals.sinks + (combatOutcome.liveCountIncrements.sinks ?? 0),
        rescues: liveCountTotals.rescues + (combatOutcome.liveCountIncrements.rescues ?? 0)
      };
    }
    updatedShip = shipsById[id];
    if (!updatedShip) continue; // If this ship lost (was deleted) in combat, skip it

    // Movement
    updatedShip = updateShipMovement(updatedShip, shipsById, timeStep, region);
    
    const stepsAliveUpdate = { stepsAlive: (updatedShip.stepsAlive ?? 0) + 1 };
    // @ this fuel consumption rate, pirates should last ~2 days out at sea
    const fuelUpdate = updatedShip.type === 'pirate' ? { fuel: updatedShip.fuel - (0.034744 * ship.fuelBurnMultiplier * 2)  } : {};


    // Delete this ship if it ventured outside the bounds of the region, or if it ran out of fuel
    if (region && (
      updatedShip.pos[0] < region.cartesianBounds.minX ||
      updatedShip.pos[0] > region.cartesianBounds.maxX ||
      updatedShip.pos[1] < region.cartesianBounds.minY ||
      updatedShip.pos[1] > region.cartesianBounds.maxY
    ) || ship.fuel <= 0) {
      delete shipsById[id];
      continue;
    }

    

    shipsById[id] = { ...updatedShip, ...stepsAliveUpdate, ...fuelUpdate };
  }

  

  return {
    ...run,
    currentState: {
      ...run.currentState,
      stats: {
        ...run.currentState?.stats,
        captures: (run.currentState?.stats?.captures ?? 0) + liveCountTotals.captures,
        sinks: (run.currentState?.stats?.sinks ?? 0) + liveCountTotals.sinks,
        evasions: (run.currentState?.stats?.evasions ?? 0) + liveCountTotals.evasions,
        rescues: (run.currentState?.stats?.rescues ?? 0) + liveCountTotals.rescues,
        merchantPirateEncounters:
          (run.currentState?.stats?.merchantPirateEncounters ?? 0) + encounterTotals.merchantPirateEncounters,
        patrolPirateEncounters:
          (run.currentState?.stats?.patrolPirateEncounters ?? 0) + encounterTotals.patrolPirateEncounters,
        totalPirateEncounters:
          (run.currentState?.stats?.totalPirateEncounters ?? 0) + encounterTotals.totalPirateEncounters,
      },
      ships: shipsById,
      encounterEvents
    }
  };
}

export { step };
