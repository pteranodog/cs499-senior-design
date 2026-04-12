import * as behaviors from './behaviors.js';
import { aStar } from './aStar.js';
import { getSomaliaHotspot } from '../utils/pointChoosing.js';

const COMBAT_RANGE   = 40;
const REPATH_INTERVAL = 20; // steps between A* recomputes for merchants

// ============================= Sight =============================

function canSee(ship1, ship2) {
  const dist = behaviors.getLength(behaviors.subtract(ship1.pos, ship2.pos));
  return dist <= ship1.sightRange;
}

// ============================= Behavior building =============================
// Constructs a weighted behavior array for a ship each step based on what it
// can currently see. The ship's persistent behavior (followPath/wander) is
// always included at weight 1.0. Situational behaviors (flee, pursue) are
// layered on top with higher weights.

function buildBehaviors(ship, visibleShips) {
  const behaviorList = [];

  const visiblePirates   = visibleShips.filter(s => s.type === 'pirate');
  const visibleMerchants = visibleShips.filter(s => s.type === 'merchant');
  const visiblePatrols   = visibleShips.filter(s => s.type === 'patrol');

  // Always include persistent behavior (followPath or wander)
  if (ship.behavior) {
    behaviorList.push(Object.assign(ship.behavior, { weight: 1.0 }));
  }

  if (ship.type === 'merchant') {
    if (visiblePirates.length > 0) {
      const nearest = nearestShip(ship, visiblePirates);
      behaviorList.push({ ...behaviors.newFlee(), target: nearest, weight: 2.5 });
    }
  }

  if (ship.type === 'pirate') {
    if (visibleMerchants.length > 0) {
      const nearest = nearestShip(ship, visibleMerchants);
      behaviorList.push({ ...behaviors.newPursue(1), target: nearest, weight: 2.0 });
    }
    if (visiblePatrols.length > 0) {
      const nearest = nearestShip(ship, visiblePatrols);
      behaviorList.push({ ...behaviors.newFlee(), target: nearest, weight: 3.0 });
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

function checkForCombatScenario(ship, shipId, shipsById) {
  if (ship.inCombat) return shipsById;

  const otherEntries = Object.entries(shipsById).filter(([id]) => id !== shipId);

  for (const [otherId, otherShip] of otherEntries) {
    // Only pirates and merchants/patrols can enter combat with each other
    const isHostile = (ship.type === 'pirate' && otherShip.type !== 'pirate') ||
                      (ship.type !== 'pirate' && otherShip.type === 'pirate');

    if (!isHostile) continue;

    const dist = behaviors.getLength(behaviors.subtract(ship.pos, otherShip.pos));

    if (dist <= COMBAT_RANGE) {
      return {
        ...shipsById,
        [shipId]: { ...ship,      inCombat: true, state: 10, currentEnemyId: otherId, hp: ship.hp      ?? 100 },
        [otherId]: { ...otherShip, inCombat: true, state: 10, currentEnemyId: shipId,  hp: otherShip.hp ?? 100 },
      };
    }
  }

  return shipsById;
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
  if (ship.inCombat) return ship;

  const behaviorList = buildBehaviors(ship, visibleShips);
  const steering     = behaviors.getTotalSteering(ship, behaviorList);

  return behaviors.updateShip(ship, steering, timeStep);
}

// ============================= Step =============================

// pathIdRef is a simple counter object so repath calls get unique path IDs
// without needing global state
const pathIdRef = { value: 10000 };

function step(run, regions, timeStep = 1) {
  let shipsById = { ...run.currentState.ships };

  

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

    // Combat check
    shipsById   = checkForCombatScenario(updatedShip, id, shipsById);
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
      ships: shipsById
    }
  };
}

export { step };