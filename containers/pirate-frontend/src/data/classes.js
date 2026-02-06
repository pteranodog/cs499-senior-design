// Class definitions; for ships, points, regions, runs
// TODOs: 
// - add "advance/move" methods? i.e. SomePirate.advance() will 
// cause SomePirate to "make the next move" based on its own fields/ target info/ environment
// (would be called on each ship at every step of the sim)
// - create classes/functions for steering behaviors (flee, pursue, evade, wander...)

const fs = require("fs")


// ================= Ship Classes =================
/** The base class for all simulated vessels in the simulation. */
class Ship {
    constructor(id, type, startPos, size, sightRange){
        this.id = id
        this.type = type
        this.pos = startPos
        this.size = size
        this.sightRange = sightRange

        this.state = 1
        this.fuel = 100
    }
}

/** Subclass of Ships that seek + attack merchant Ships, and
 * flee from patrol ships.
 */
class PirateShip extends Ship {
    
    constructor(id, startPos, size) {
        // note placeholdersight range based on size & type. more properties will be added once combat system is fleshed out
        super(id, "Pirate", startPos, size, size * 3.5)     
    }
}

/** Subclass of Ships that seek + attack merchant Pirates, and
 * seek + defend distressed Merchants.
 */
class PatrolShip extends Ship {
    constructor(id, startPos, size) {
        // note placeholder sight range based on size & type. more properties will be added once combat system is fleshed out
        super(id, "Patrol", startPos, size, size * 5)      
    }
}

/** Subclass of Ships that follow defined trade routes, flee from Pirates,
 * and send distress calls to nearby Patrol Ships when fleeing.
 */
class MerchantShip extends Ship {
    constructor(id, startPos, size) {
        // note placeholder sight range based on size & type. more properties will be added once combat system is fleshed out
        super(id, "Merchant", startPos, size, size * 3)     
    }
}


// ================= Map-object classes: for use by the simulation's designers =================
/** A defined area for the simulation to take place in. Consists of various
 * ports and pirate coves. Things to note: 
 *  - (MIGHT CHANGE) Strictly rectangular (length/width boundaries in args). TODO: decide if centered on a point or justified
 *  - Persists between Runs.
 *  - pointsArr is assumed to be an array of all points within the region boundaries
 */
class Region {
    constructor(center, pointsArr, regionId, regionName, length, width) {
        this.center = center // two-tuple of x/y coords

        this.points = pointsArr // array of Point instances
        this.id = regionId
        this.name = regionName
        this.length = length
        this.width = width
    }
}

/** Base class for any important points within the simulation regions(s). */
class Point {
    constructor(pointId, pointType, pointPos) {
        this.id = pointId
        this.type = pointType 
        this.pos = pointPos // two-tuple of x/y coords
    }
}

/** Subclass of Points; each instance represents a point where merchant
 * ships either pick up or drop off goods. These points also "spawn"
 * new merchant ships (this functionality will be added once additional key
 * decisions regarding combat, trade routes, and ship data are made)
 */
class Port extends Point {
    constructor(PointId, portPos, merchantSpawnChance, toPorts, fromPorts)
    {
        super(PointId, "Port", portPos)

        // Probability at each step that this Port spawns a brand new Merchant
        // (NOTE: merchant count should not exceed a certain maximum)
        this.merchantSpawnChance = merchantSpawnChance

        // Merchants export goods from this port *to* where?
        this.toPorts = toPorts // array of Ports (or maybe just IDs?)

        // Merchants import goods to this port *from* where?
        this.fromPorts = fromPorts // array of Ports (TODO: or maybe just IDs?)
    }
}

/** Subclass of Points; each instance represents a point from which
 * Pirates emerge. */
class PirateCove extends Point {
    constructor(PointId, covePos, pirateSpawnChance)
    {
        super(PointId, "PirateCove", covePos)

        // Probability at each step that this Cove spawns a new Pirate 
        // (NOTE: pirate count should not exceed a certain maximum)
        this.pirateSpawnChance = pirateSpawnChance
    }
}


// ================= Run and Config classes: pre-run configuration by user + run data  =================

/** Holds the configuration data that the user sets prior to starting the run.
 * TODO: probably needs more arguments, will refer to docs + update to include 
 * all the user settings */
class Config {
    constructor(duration, weatherType, maxPirates, maxMerchants, maxPatrols) {
        this.duration = duration
        this.weatherType = weatherType
        this.maxPirates = maxPirates
        this.maxMerchants = maxMerchants
        this.maxPatrols = maxPatrols
    }
}

/** Used to record data from each session of the simulation:
 * Starting configuration, chosen region and statistics
 */
class Run {
    constructor(runConfig, runId, chosenRegion) {
        this.runId = runId
        this.config = runConfig // Config object
        this.chosenRegion = chosenRegion // Region object (TODO: or just a region's ID?)
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

testPort1 = new Port(12, [0,0], 0.01, [18, 31], [17,81])
testPort2 = new Port(22, [30,10], 0.01, [55,70,61], [12,15])
testCove = new PirateCove(67, [-10, 5], 0.02)

Points.push(testPort1, testPort2, testCove)

testRegion = new Region([0,0], Points, 15, "Bomboclat", 20, 10)

Regions.push(testRegion)

testShip1 = new PirateShip(20, [50.8, -40.7], 2),
testShip2 = new MerchantShip(30, [75, 55], 2),
testShip3 = new PatrolShip(40, [-32.1, 12.9], 2)

Ships.push(testShip1, testShip2, testShip3)

testConfig = new Config(1500, "clear", 200, 500, 400)
testRun = new Run(testConfig, 1, testRegion)

Runs.push(testRun)

printData("data.json", Regions, Runs)