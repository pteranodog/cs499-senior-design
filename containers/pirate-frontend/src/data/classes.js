// import * as behvaiors from './behaviors.js'
// Class definitions; for ships, points, regions, runs
// TODOs: 
// fill out const values for accelerations/speeds of ships
// finish assigning initial behaviors to all ships 
// make predetermined Paths for patrols and merchants?


const MAX_SMALL_PIRATE_SPEED = 10;
const MAX_MED_PIRATE_SPEED = 10;
const MAX_SMALL_MERCHANT_SPEED = 10;
const MAX_MED_MERCHANT_SPEED = 10;
const MAX_SMALL_PATROL_SPEED = 10;
const MAX_MED_PATROL_SPEED = 10;
const MAX_LARGE_PATROL_SPEED = 10;

const MAX_SMALL_PIRATE_ACC = 10;
const MAX_MED_PIRATE_ACC = 10;
const MAX_SMALL_MERCHANT_ACC = 10;
const MAX_MED_MERCHANT_ACC = 10;
const MAX_SMALL_PATROL_ACC = 10;
const MAX_MED_PATROL_ACC = 10;
const MAX_LARGE_PATROL_ACC = 10;

const GLOBAL_MAX_ANGULAR_ACC = 5;
const GLOBAL_MAX_ROTATION = 20;

// const fs = require("fs")

// ================= Ship Objects =================
/** The base class for all simulated vessels in the simulation. */
function newShip(type, startPos, size, sightRange, crewSize, armament, durability) {
  return {
    type: type,
    pos: startPos, 
    size: size, // String expected; small, medium, or large
    sightRange: sightRange, // Unit is miles?

    crewSize: crewSize,
    armament: armament,
    durability: durability,

    state: 1,
    fuel: 100, // Default value; unit is gallons.
    inCombat: false
  }; 
}

/** Subclass of Ships that seek + attack merchant Ships, and
 * flee from patrol ships.
 */
function newPirateShip(startPos, size, homeCove) {
  // Using ? operator for shorthand if-else, since current research only mentions two sizes of pirate ships
  // NEW: speed/acc
  let maxAcc = (size === "small" ? MAX_SMALL_PIRATE_ACC : MAX_MED_MERCHANT_ACC);
  let maxSpeed = (size === "small" ? MAX_SMALL_PIRATE_SPEED : MAX_MED_MERCHANT_SPEED);
  let crewSize = (size === "small" ? 7 : 19);
  let durability = (size === "small" ? 15 : 30); // assumed
  let armament = (size === "small" ? 45 : 15);
  let sightRange = (size === "small" ? 10 : 20);
  let heldSkiffs = {};
  if (size !== "small") {
    for (let i = 0; i < 2; i++) {
      heldSkiffs[crypto.randomUUID()] = newPirateShip(startPos, "small", homeCove);
    }
  }

  let ship = newShip("pirate", startPos, size, sightRange, crewSize, armament, durability);
  ship.heldSkiffs = heldSkiffs;
  ship.homeCove = homeCove; // Spawn point. PirateCove object expected.
  return ship;
}

/** Subclass of Ships that seek + attack merchant Pirates, and
 * seek + defend distressed Merchants.
 */
function newPatrolShip(startPos, size, homePort) {

  // Before calling super, initialize size-dependent ship properties
  let crewSize = 0
  let durability = 0
  let armament = 0
  let sightRange = 0
  let carriedSmallPatrols = {}

  switch (size) {
    case "small": // Will spawn from large patrol ships
      crewSize = 4
      durability = 10
      armament = 30
      sightRange = 1 // estimated
      break;
    case "medium": // "Loners"
      crewSize = 10 // estimated
      durability = 20
      armament = 60
      sightRange = 2 // estimated
      break;
    case "large":
      crewSize = 30 // Includes the 16 from carried small patrol ships
      durability = 40 // estimated
      armament = 60 // estimated
      sightRange = 3 // estimated
      for (let i = 0; i < 4; i++) {
        carriedSmallPatrols[crypto.randomUUID()] = newPatrolShip(startPos, "small", homePort);
      }
      break;
    default: // identical to small
      crewSize = 4
      durability = 10
      armament = 30
      sightRange = 1
      break;
  }

  // Call super with the inferred size-specific stats
  let ship = newShip("patrol", startPos, size, sightRange, crewSize, armament, durability)
  ship.carriedSmallPatrols = carriedSmallPatrols      
  ship.homePort = homePort // Spawn point / "Point A" in this ship's trade route. Port object expected
  return ship;
}

/** Subclass of Ships that follow defined trade routes, flee from Pirates,
 * and send distress calls to nearby Patrol Ships when fleeing.
 */
function newMerchantShip(startPos, size, homePort) {
  // Before calling super, initialize size-dependent ship properties
  // TODO: Currently only have research for one size of merchant; more to come?
  let crewSize = 21;
  let durability = 70;
  let armament = 25;
  let sightRange = 1;

  // switch/if-else statement here for sizes if last comment is correct

  let ship = newShip("merchant", startPos, size, sightRange, crewSize, armament, durability);
  ship.homePort = homePort; // Spawn point / "Point A" of patrol path. Port object expected.
  return ship;
}

// ================= Map-object classes: for use by the simulation's designers =================
/** A defined area for the simulation to take place in. Consists of various
 * ports and pirate coves. Things to note: 
 *  - (MIGHT CHANGE) Strictly rectangular (length/width boundaries in args). TODO: decide if centered on a point or justified
 *  - Persists between Runs.
 *  - pointsArr is assumed to be an array of all points within the region boundaries
 */
function newRegion(center, pointsArr, regionName, length, width, defaultZoom) {
  return {
    name: regionName,
    points: pointsArr, // array of Point instances
    center: center, // two-tuple of x/y coords
    length: length,
    width: width,
    defaultZoom: defaultZoom
  };
}

/** Base class for any important points within the simulation regions(s). */
function newPoint(name, pointType, pointPos) {
  return {
    name: name,
    type: pointType,
    pos: pointPos // two-tuple of x/y coords
  };
}

/** Subclass of Points; each instance represents a point where merchant
 * ships either pick up or drop off goods. These points also "spawn"
 * new merchant ships.
 */
function newPort(name, portPos, spawnWeight, toPorts, fromPorts, destWeight, visible)
{
  let point = newPoint(name, "port", portPos)

  /// probability for this port to be chosen as the location when a merchant spawns (0-1)
  point.spawnWeight = spawnWeight;

  // Merchants export goods from this port *to* where?
  point.toPorts = toPorts // array of Ports 

  // Merchants import goods to this port *from* where?
  point.fromPorts = fromPorts // array of Ports 

  // probability for this port to be chosen as the destination when a merchant spawns (0-1)
  point.destWeight = destWeight;

  // render this in leaflet map? t/f
  point.visible = visible;

  return point;
}

/** Subclass of Points; each instance represents a point from which
 * Pirates emerge. */
function newPirateCove(name, covePos, pirateSpawnChance)
{
  let point = newPoint(name, "pirateCove", covePos)

  // Probability at each step that this Cove spawns a new Pirate 
  point.pirateSpawnChance = pirateSpawnChance

  return point;
}

/** Subclass of Points; each instance represents a point from which
 * naval Patrol ships emerge. */
function newBase(name, basePos, patrolSpawnChance)
{
  let point = newPoint(name, "patrolBase", basePos);

  // Probability at each step that this Base spawns a new Patrol
  point.patrolSpawnChance = patrolSpawnChance;

  return point;
}

// ================= Run and Config classes: pre-run configuration by user + run data  =================

/** Holds the configuration data that the user sets prior to starting the run.
 * TODO: probably needs more arguments, will refer to docs + update to include 
 * all the user settings */
function newConfig(seed, startHour, startMinute, duration, weatherType, maxPirates, maxMerchants, maxPatrols) {
  return {
    seed: seed,
    startHour: startHour,
    startMinute: startMinute,
    duration: duration,
    weatherType: weatherType,
    maxPirates: maxPirates,
    maxMerchants: maxMerchants,
    maxPatrols: maxPatrols
  }
}

/** Used to record data from each session of the simulation:
 * Starting configuration, chosen region and statistics
 */
function newRun(name, runConfig, regionId) {
  // Set up basic unchanging run properties
  let run = {
    name: name,
    regionId: regionId, // Region ID
    status: 'new',
    speed: 1,
    ticksPerMinute: 1,
    elapsedTime: 0, // stored as elapsed simulation ticks; use ticksPerMinute to format clock time
    selected: false,
    // Infer initial run state info from config. currentState is comprised of all the CHANGING values of this run:
    currentState: {
      // Stats is a simple atomic object containing mostly numeric statistics of the run.
      stats: {
        captures: 0,
        rescues: 0,
        sinks: 0,
        merchantPirateEncounters: 0,
        patrolPirateEncounters: 0,
        totalPirateEncounters: 0,
        merchantsSpawned: 0,
        piratesSpawned: 0
      },
      // Ships is an ID-indexed object of all active Ship objects.
      ships: {},
      // New: List of encounter events (combat, evasion, sink, etc.)
      encounterEvents: []
    }
  }
  return {...runConfig, ...run};
}

export { newPirateShip, newPatrolShip, newMerchantShip, newRegion, newPort, newBase, newPirateCove, newConfig, newRun };
