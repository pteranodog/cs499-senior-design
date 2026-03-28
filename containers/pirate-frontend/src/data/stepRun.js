import { simState } from "./simState";

function stepRun(state, runId) {
  newState = state;
  currentRun = state.runs.at(runId); // Started here
  for (let i = 0; i <= currentRun.currentState.ships.size; i++) {
    thisShip = currentRun.currentState.ships.at(i)
    if(!thisShip.state.inCombat) { 
      thisShip.behavior.update()
      thisShip.pos = thisShip.behavior.kinematic.pos
    }
    else {
      // TODO: combat functionality
    }
  }


}


// THESE FUNCTIONS MAY BE HELPFUL LATER

function releaseSkiff(id) {
  if (this.heldSkiffs) {    
    let releasedSkiff = new PirateShip(id, this.pos, "small")
    this.crewSize -= 7
    this.heldSkiffs -= 1
    return this.releaseSkiff // Return this new ship so it can be added to the state data
  }
  else {
    console.log("Pirate ship w/ id " + this.id + " has no skiffs to release.")
  }
}

// TODO: Remove this once it's in the reducer function
// Add method to release small patrol ships (for large patrol ships)
function releaseSmallPatrolShip(id) {
  if (this.carriedSmallPatrols) {   
    releasedPatrol = new PatrolShip(id, this.pos, "small")
    this.crewSize -= 4
    this.carriedSmallPatrols -= 1
    return releasedPatrol // Return this new ship so it can be added to the state data
  }
  else {
    console.log("Patrol ship w/ id " + this.id + " has no small patrol ships to release.")
  }
}

// TODO: Reducer function
// Spawn a new merchant ship at this port's location.
function spawnMerchant(id, size) {
  thisMerchant = new MerchantShip(id, this.pos, size, this)
  return thisMerchant
}

// TODO: Reducer function
// Spawn a new patrol ship at this port's location.
function spawnPatrol(id, size) {
  thisPatrol = new PatrolShip(id, this.pos, size, this)
  return thisPatrol
}


// TODO: Reducer function
// Spawn a new pirate ship at this cove's location.
function spawnPirate(id, size) {
  thisPirate = new PirateShip(id, this.pos, size, this)
  return thisPirate
}
