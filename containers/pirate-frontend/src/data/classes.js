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
    constructor(id, type, startPos, size, sightRange, crewSize, armament, durability){
        this.id = id
        this.type = type
        this.pos = startPos 
        this.size = size // String expected; small, medium, or large
        this.sightRange = sightRange // Unit is miles?

        this.crewSize = crewSize
        this.armament = armament
        this.durability = durability

        this.state = 1
        this.fuel = 100 // Default value; unit is gallons.
    }
}

/** Subclass of Ships that seek + attack merchant Ships, and
 * flee from patrol ships.
 */
class PirateShip extends Ship {
    constructor(id, startPos, size, homeCove) {
        // Before calling super, initialize size-dependent ship properties
        let crewSize = 0
        let durability = 0
        let armament = 0
        let sightRange = 0
        let heldSkiffs = 0
        

        // Using ? operator for shorthand if-else, since current research only mentions two sizes of pirate ships
        crewSize = (size === "small" ? 7 : 19)
        durability = (size === "small" ? 15 : 30) // assumed
        armament = (size === "small" ? 45 : 15)
        sightRange = (size === "small" ? 10 : 20)
        heldSkiffs = (size === "small" ? 0 : 2) // assumed-ish



        super(id, "Pirate", startPos, size, sightRange, crewSize, armament, durability)     
        this.heldSkiffs = heldSkiffs
        this.homeCove = homeCove // Spawn point. PirateCove object expected.
    }

    releaseSkiff(id) {
        if (this.heldSkiffs) {    
        releasedSkiff = new PirateShip(id, this.pos, "small")
            this.crewSize -= 7
            this.heldSkiffs -= 1
            return this.releaseSkiff // Return this new ship so it can be added to the state data
        }
        else {
            console.log("Pirate ship w/ id " + this.id + " has no skiffs to release.")
        }
    }
}


/** Subclass of Ships that seek + attack merchant Pirates, and
 * seek + defend distressed Merchants.
 */
class PatrolShip extends Ship {
    constructor(id, startPos, size, homePort) {

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
        super(id, "Patrol", startPos, size, sightRange, crewSize, armament, durability)
        this.carriedSmallPatrols = carriedSmallPatrols      
        this.homePort= homePort // Spawn point / "Point A" in this ship's trade route. Port object expected
    }

    // Add method to release small patrol ships (for large patrol ships)
    releaseSmallPatrolShip(id) {
        if (this.carriedSmallPatrols)
        {   
            releasedPatrol = new PatrolShip(id, this.pos, "small")
            this.crewSize -= 4
            this.carriedSmallPatrols -= 1
            return releasedPatrol // Return this new ship so it can be added to the state data
        }
        else {
            console.log("Patrol ship w/ id " + this.id + " has no small patrol ships to release.")
        }
    }
}


/** Subclass of Ships that follow defined trade routes, flee from Pirates,
 * and send distress calls to nearby Patrol Ships when fleeing.
 */
class MerchantShip extends Ship {
    constructor(id, startPos, size, homePort) {
        
        // Before calling super, initialize size-dependent ship properties
        // TODO: Currently only have research for one size of merchant; more to come?
        let crewSize = 21
        let durability = 70
        let armament = 25
        let sightRange = 1

        // switch/if-else statement here for sizes if last comment is correct

        super(id, "Merchant", startPos, size, sightRange, crewSize, armament, durability)
        this.homePort = homePort // Spawn point / "Point A" of patrol path. Port object expected.
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
        this.name = regionName
        this.id = regionId
        this.points = pointsArr // array of Point instances
        this.center = center // two-tuple of x/y coords

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

    // Spawn a new merchant ship at this port's location.
    spawnMerchant(id, size) {
        thisMerchant = new MerchantShip(id, this.pos, size, this)
        return thisMerchant
    }

    // Spawn a new patrol ship at this port's location.
    spawnPatrol(id, size) {
        thisPatrol = new PatrolShip(id, this.pos, size, this)
        return thisPatrol
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
    
    // Spawn a new pirate ship at this cove's location.
    spawnPirate(id, size) {
        thisPirate = new PirateShip(id, this.pos, size, this)
        return thisPirate
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
        // Set up basic unchanging run properties
        this.runId = runId
        this.config = runConfig // Config object
        this.chosenRegion = chosenRegion // Region object (TODO: or just a region's ID?)
        this.currentState = {}
        // Infer initial run state info from config. currentState is comprised of all the CHANGING values of this run:


        // Stats is a simple atomic object containing mostly numeric statistics of the run.
        this.currentState.stats = {
            captures: 0,
            rescues: 0,
            sinks: 0
        }


        // Ships is an array of all active Ship objects.
        this.currentState.ships = [];
    }


    step() {
        // TODO: this advances the run a single step; call ship methods to update, advance time, etc.
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

testRegion = new Region([0,0], Points, 15, "The fiery pits of hell", 20, 10)

Regions.push(testRegion)

testShip1 = new PirateShip(20, [50.8, -40.7], "medium"),
testShip2 = new MerchantShip(30, [75, 55], "medium"),
testShip3 = new PatrolShip(40, [-32.1, 12.9], "medium")

Ships.push(testShip1, testShip2, testShip3)

testConfig = new Config(1500, "clear", 200, 500, 400)
testRun = new Run(testConfig, 1, testRegion)
testRun.currentState.ships.push(testShip1, testShip2, testShip3)

Runs.push(testRun)

printData("data.json", Regions, Runs)