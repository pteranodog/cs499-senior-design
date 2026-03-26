import * as data from './classes.js';
import * as behaviors from './behaviors.js';
import { step } from './stateFunctions.js'; 

// ----------------- Setup Test Region -----------------
const portA = data.newPort("PortA", [0, 0], 0.5, [], []);
const portB = data.newPort("PortB", [100, 0], 0.5, [], []);
const pirateCove = data.newPirateCove("Cove1", [50, 50], 0.5);

const testRegion = data.newRegion([50, 25], [portA, portB, pirateCove], "TestRegion", 100, 50);

let merchantShip = {};
let patrolShip = {};
let pirateShip = {};

// Create kinematic for ship

const merchantKinematic = behaviors.newKinematic([0, 0], 0, [0, 0], 0);
const patrolKinematic = behaviors.newKinematic([100, 100], 0, [0, 0], 0);
const pirateKinematic = behaviors.newKinematic([500, 500], 0, [0, 0], 0);

// Assign behaviors
const merchantBehavior = new behaviors.newWander(merchantKinematic, 1, 0.1, 0.05, 1, 0.5, 2);
const patrolBehavior = new behaviors.newWander(patrolKinematic, 1, 0.1, 0.05, 1, 0.5, 2);
const pirateBehavior = new behaviors.newWander(pirateKinematic, 1, 0.1, 0.05, 1, 0.5, 2);

// Wrap in movers
const merchantMover = behaviors.newMover(merchantKinematic, [0, 0], 2, merchantBehavior);
const patrolMover = behaviors.newMover(patrolKinematic, [0, 0], 2, patrolBehavior);
const pirateMover = behaviors.newMover(pirateKinematic, [0, 0], 2, pirateBehavior);

// Assign movers to ships
merchantShip.mover = merchantMover;
patrolShip.mover = patrolMover;
pirateShip.mover = pirateMover;

// ----------------- Setup Run -----------------
const testRun = data.newRun("TestRun", { seed: 123, duration: 10 }, "TestRegion");

// Inject ships into run
testRun.currentState.ships = {
  merchant1: merchantShip,
  patrol1: patrolShip,
  pirate1: pirateShip
};

// ----------------- Step the Simulation -----------------
let currentRun = testRun;

console.log("=== Initial Run State ===");
console.log(JSON.stringify(currentRun.currentState.ships, null, 2));

for (let i = 0; i < 5; i++) {
  currentRun = step(currentRun, 1); // step by 1 timestep
  console.log(`\n=== After Step ${i + 1} ===`);
  console.log(JSON.stringify(currentRun.currentState.ships, null, 2));
}