// Class definitions; for ships, points, regions, runs
// TODOs: 
// - add "advance/move" methods? i.e. SomePirate.advance() will 
// cause SomePirate to "make the next move" based on its own fields/ target info/ environment
// (would be called on each ship at every step of the sim)
// - create classes/functions for steering behaviors (flee, pursue, evade, wander...)

const fs = require("fs")

// ================= Ship Objects =================
/** The base class for all simulated vessels in the simulation. */
function newShip(id, type, startPos, size, sightRange, crewSize, armament, durability){
  return {
    id: id,
    type: type,
    pos: startPos, 
    size: size, // String expected; small, medium, or large
    sightRange: sightRange, // Unit is miles?

    crewSize: crewSize,
    armament: armament,
    durability: durability,

    state: 1,
    fuel: 100 // Default value; unit is gallons.
  };
}

/** Subclass of Ships that seek + attack merchant Ships, and
 * flee from patrol ships.
 */
function newPirateShip(id, startPos, size, homeCove) {
  // Using ? operator for shorthand if-else, since current research only mentions two sizes of pirate ships
  let crewSize = (size === "small" ? 7 : 19);
  let durability = (size === "small" ? 15 : 30); // assumed
  let armament = (size === "small" ? 45 : 15);
  let sightRange = (size === "small" ? 10 : 20);
  let heldSkiffs = (size === "small" ? 0 : 2); // assumed-ish

  let ship = newShip(id, "Pirate", startPos, size, sightRange, crewSize, armament, durability);
  ship.heldSkiffs = heldSkiffs;
  ship.homeCove = homeCove; // Spawn point. PirateCove object expected.
  return ship;
}

/** Subclass of Ships that seek + attack merchant Pirates, and
 * seek + defend distressed Merchants.
 */
function newPatrolShip(id, startPos, size, homePort) {

  // Before calling super, initialize size-dependent ship properties
  let crewSize = 0
  let durability = 0
  let armament = 0
  let sightRange = 0
  let carriedSmallPatrols = 0

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
      carriedSmallPatrols = 4 // uinique to large control ships; needs function to release them
      break;
    default: // identical to small
      crewSize = 4
      durability = 10
      armament = 30
      sightRange = 1
      break;
  }

  // Call super with the inferred size-specific stats
  let ship = newShip(id, "Patrol", startPos, size, sightRange, crewSize, armament, durability)
  ship.carriedSmallPatrols = carriedSmallPatrols      
  ship.homePort= homePort // Spawn point / "Point A" in this ship's trade route. Port object expected
  return ship;
}

/** Subclass of Ships that follow defined trade routes, flee from Pirates,
 * and send distress calls to nearby Patrol Ships when fleeing.
 */
function newMerchantShip(id, startPos, size, homePort) {
  // Before calling super, initialize size-dependent ship properties
  // TODO: Currently only have research for one size of merchant; more to come?
  let crewSize = 21;
  let durability = 70;
  let armament = 25;
  let sightRange = 1;

  // switch/if-else statement here for sizes if last comment is correct

  let ship = newShip(id, "Merchant", startPos, size, sightRange, crewSize, armament, durability);
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
function newRegion(center, pointsArr, regionId, regionName, length, width) {
  return {
    name: regionName,
    id: regionId,
    points: pointsArr, // array of Point instances
    center: center, // two-tuple of x/y coords
    length: length,
    width: width
  };
}

/** Base class for any important points within the simulation regions(s). */
function newPoint(pointId, pointType, pointPos) {
  return {
    id: pointId,
    type: pointType,
    pos: pointPos // two-tuple of x/y coords
  };
}

/** Subclass of Points; each instance represents a point where merchant
 * ships either pick up or drop off goods. These points also "spawn"
 * new merchant ships (this functionality will be added once additional key
 * decisions regarding combat, trade routes, and ship data are made)
 */
function newPort(PointId, portPos, merchantSpawnChance, toPorts, fromPorts)
{
  let point = newPoint(PointId, "Port", portPos)

  // Probability at each step that this Port spawns a brand new Merchant
  // (NOTE: merchant count should not exceed a certain maximum)
  point.merchantSpawnChance = merchantSpawnChance

  // Merchants export goods from this port *to* where?
  point.toPorts = toPorts // array of Ports (or maybe just IDs?)

  // Merchants import goods to this port *from* where?
  point.fromPorts = fromPorts // array of Ports (TODO: or maybe just IDs?)

  return point;
}

/** Subclass of Points; each instance represents a point from which
 * Pirates emerge. */
function newPirateCove(PointId, covePos, pirateSpawnChance)
{
  let point = newPoint(PointId, "PirateCove", covePos)

  // Probability at each step that this Cove spawns a new Pirate 
  // (NOTE: pirate count should not exceed a certain maximum)
  point.pirateSpawnChance = pirateSpawnChance

  return point;
}

// ================= Run and Config classes: pre-run configuration by user + run data  =================

/** Holds the configuration data that the user sets prior to starting the run.
 * TODO: probably needs more arguments, will refer to docs + update to include 
 * all the user settings */
function newConfig(duration, weatherType, maxPirates, maxMerchants, maxPatrols) {
  return {
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
function newRun(runConfig, runId, regionId) {
  // Set up basic unchanging run properties
  return {
    runId: runId,
    config: runConfig, // Config object
    regionId: regionId, // Region ID
    // Infer initial run state info from config. currentState is comprised of all the CHANGING values of this run:
    currentState: {
      // Stats is a simple atomic object containing mostly numeric statistics of the run.
      stats: {
        captures: 0,
        rescues: 0,
        sinks: 0
      },
      // Ships is an array of all active Ship objects.
      ships: []
    }
  }
}


// ================= Helpful Functions  =================

function printData(file, regions, runs) {
  fs.writeFile(file, JSON.stringify([{regions}, {runs}], null, "\t"), err => {
    if (err) {
      console.error("Could not find " + file)
    }
  })
}


// ================= Testing the above =================
var Points = []
var Ships = []

var Regions = []
var Runs = []

testPort1 = newPort(12, [0,0], 0.01, [18, 31], [17,81])
testPort2 = newPort(22, [30,10], 0.01, [55,70,61], [12,15])
testCove = newPirateCove(67, [-10, 5], 0.02)

Points.push(testPort1, testPort2, testCove)

testRegion = newRegion([0,0], Points, 15, "The fiery pits of hell", 20, 10)

Regions.push(testRegion)

testShip1 = newPirateShip(20, [50.8, -40.7], "medium"),
testShip2 = newMerchantShip(30, [75, 55], "medium"),
testShip3 = newPatrolShip(40, [-32.1, 12.9], "medium")

Ships.push(testShip1, testShip2, testShip3)

testConfig = newConfig(1500, "clear", 200, 500, 400)
testRun = newRun(testConfig, 1, 15)
testRun.currentState.ships.push(testShip1, testShip2, testShip3)

Runs.push(testRun)

printData("data.json", Regions, Runs)
