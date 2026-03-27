import { newConfig, newRun } from './classes.js';
import { defaultRegions } from './regions.js';
import * as behaviors from './behaviors.js';

function simStateReducer(state, action) {
  switch (action.type) {
    case 'initialize':
    case 'reset':
      return appStartState();
    case 'display-region':
      return { ...state, display: { type: 'region', index: action.id } };
    case 'display-run':
      return { ...state, display: { type: 'run', index: action.index } };
    case 'step-run':
      return { ...state, runs: state.runs.map((run, i) => i === action.index ? step(run) : run) };
    case 'create-run':
      return createRun(state);
    case 'load-run':
      return loadRun(state, action.filePath);
    case 'modify-run':
      return { ...state, runs: state.runs.map((run, i) => i === action.index ? { ...run, [action.setting]: action.value } : run) };
    case 'delete-run':
      return deleteRun(state, action.index);
    case 'duplicate-run':
      return duplicateRun(state, action.index);
    case 'select-run':
      return { ...state, runs: expandRun(state.runs, action.run) };
    case 'view-run-list':
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'list-runs' }};
    case 'view-run-controls':
      return viewRunControls(state, action.run);
    case 'view-run-end':
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'end-run', index: action.run }};
    default:
      console.warn('Action type "' + action.type + '" not found.');
      return state;
  }
}

function appStartState() {
  return {
    regions: defaultRegions(),
    runs: [],
    display: {
      type: 'region',
      index: 'r1'
    },
    controls: {
      type: 'list-runs',
    }
  };
}

function createRun(state) {
  const run = { ...buildNewRun(), expanded: true };
  return {
    ...state,
    runs: [...collapseAll(state.runs), run],
    controls: { ...state.controls }
  };
}

function loadRun(state, filePath) {
  // TODO: Load run
  return state;
}

function deleteRun(state, index) {
  const deletedRun = state.runs[index];
  const newRuns = collapseAll(state.runs.toSpliced(index, 1));
  const fallback = newRuns[index - 1] ?? newRuns[0];
  const newDisplay = { type: 'region', index: deletedRun.regionId };
  const finalRuns = fallback
    ? expandRun(newRuns, fallback.uuid)
    : newRuns;
  return { ...state, runs: finalRuns, display: newDisplay, controls: { ...state.controls } };
}

function duplicateRun(state, index) {
  const source = state.runs[index];
  const duplicate = {
    ...buildNewRun(),
    name: source.name + ' (Copy)',
    seed: source.seed,
    startHour: source.startHour,
    startMinute: source.startMinute,
    duration: source.duration,
    regionId: source.regionId,
    weatherType: source.weatherType,
    maxMerchants: source.maxMerchants,
    maxPirates: source.maxPirates,
    maxPatrols: source.maxPatrols,
    expanded: true,
  };
  const newRuns = [...state.runs.slice(0, index + 1), duplicate, ...state.runs.slice(index + 1)];
  return { ...state, runs: collapseAll(newRuns).map(run =>
    run.uuid === duplicate.uuid ? { ...run, expanded: true } : run
  )};
}

function collapseAll(runs) {
  return runs.map(({ expanded, ...rest }) => rest);
}

function expandRun(runs, uuid) {
  return collapseAll(runs).map(run =>
    run.uuid === uuid ? { ...run, expanded: true } : run
  );
}

function step() {}

function buildNewRun() {
  const config = newConfig(
    Math.floor(Math.random() * 10000) + 1,
    0, 0, 1500, 'clear', 33, 34, 33
  );
  const run = newRun('Untitled Run', config, 'r1');
  return { ...run, uuid: crypto.randomUUID() };
}

function spawnShips(run, regions) { // Iterate through spawning Points and give them all a chance to spawn their respective ships
  const region = regions[run.regionId];
  if (!region) return run;
 
  const ships = {};
 
  // get presence rates. should probably refactor name to be more accurate
  const merchantChance = (run.maxMerchants ?? 0) / 100;
  const pirateChance   = (run.maxPirates   ?? 0) / 100;
  const patrolChance   = (run.maxPatrols   ?? 0) / 100;
 
  for (const point of Object.values(region.points)) {
    const pos = point.pos; // for now, lat/lon; may not need cartesial after all?
 
    if (point.type === 'port') {
      // Merchants spawn from ports
      if (Math.random() < merchantChance) { // TODO: seed!
        const id = crypto.randomUUID();
        ships[id] = buildShipWithMover('merchant', pos, 'medium');
      }
      // Patrols also base out of ports 
      if (Math.random() < patrolChance) { // TODO: seed!
        const id = crypto.randomUUID(); 
        ships[id] = buildShipWithMover('patrol', pos, 'medium');
      }
    }
 
    if (point.type === 'pirateCove') {
      // Pirates spawn from coves
      if (Math.random() < pirateChance) { // TODO: seed!
        const id = crypto.randomUUID();
        ships[id] = buildShipWithMover('pirate', pos, 'small');
      }
    }
  }
 
  return { // return run w/ updated state
    ...run,
    currentState: {
      ...run.currentState,
      ships
    }
  };
}

function buildShipWithMover(type, pos, size) { // Construct a ship AND attach a mover object 
  // Predefined, constant state of our ship types. May need balancing!!
  const stats = {
    merchant: { crewSize: 21, durability: 70, armament: 25, sightRange: 1, maxSpeed: 10 },
    pirate:   { crewSize: 7,  durability: 15, armament: 45, sightRange: 10, maxSpeed: 10 },
    patrol:   { crewSize: 10, durability: 20, armament: 60, sightRange: 2,  maxSpeed: 10 },
  }[type] ?? { crewSize: 5, durability: 10, armament: 10, sightRange: 1, maxSpeed: 5 };
 
  // Build the kinematic: ships start stationary at their spawn point
  const kinematic = behaviors.newKinematic(
    pos,   // position [lat, lon]
    0,     // orientation (radians)
    [0, 0],// velocity
    0      // rotation
  );
 
  // Create a generic wander for any ship type to use
  const wander = behaviors.newWander(
    kinematic,
    0.5,   // maxAcceleration
    0.1,   // maxAngularAcc
    0.05,  // maxRotation
    1,     // slowThreshold
    0.5,   // targetThreshold
    stats.maxSpeed
  );
 
  const mover = behaviors.newMover(kinematic, [0, 0], stats.maxSpeed, wander);
 
  return {
    type,
    pos,            // keep top-level pos in sync with mover for ShipIcons to read
    size,
    sightRange: stats.sightRange,
    crewSize:   stats.crewSize,
    armament:   stats.armament,
    durability: stats.durability,
    state: 1,       // 1 = idle
    fuel: 100,
    inCombat: false,
    mover,
  };
}

function viewRunControls(state, runIndex) {
  const run = state.runs[runIndex];
  if (!run) return state;
 
  // Only spawn ships if this run hasn't been started yet
  const runWithShips = run.status === 'new'
    ? spawnShips({ ...run, status: 'running' }, state.regions)
    : run;
 
  return {
    ...state,
    runs: state.runs.map((r, i) => i === runIndex ? runWithShips : r),
    display:  { type: 'run', index: runIndex },
    controls: { type: 'active-run', index: runIndex },
  };
}


export { simStateReducer, appStartState, buildNewRun };
export { spawnShips, buildShipWithMover, viewRunControls };
