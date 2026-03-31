import { newConfig, newRun } from './classes.js';
import { defaultRegions } from './regions.js';
import { step } from './stateFunctions.js';
import * as behaviors from './behaviors.js';
import { latLngToCartesian } from '../utils/coords.js';

import { somaliaMerchantPaths } from './somaliaPaths.js';

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
      return loadRun(state, action.run);
    case 'start-run':
      return startRun(state, action.index);
    case 'modify-run':
      return { ...state, runs: state.runs.map((run, i) => i === action.index ? { ...run, [action.setting]: action.value } : run) };
    case 'delete-run':
      return deleteRun(state, action.index);
    case 'duplicate-run':
      return duplicateRun(state, action.index);
    case 'select-run':
      return { ...state, runs: expandRun(state.runs, action.run) };
    case 'compare-runs':
      return { ...state, display: { type: 'run', index: action.runA },
        controls: { type: 'compare-runs', runA: action.runA, runB: action.runB }};
    case 'view-run-list':
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'list-runs' }};
    case 'view-run-controls':
      return viewRunControls(state, action.run);
    case 'view-run-end':
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'end-run', index: action.run }};
    case 'increment-run-time':
      return { ...state, runs: state.runs.map((run, i) => i === action.index ? { ...run, elapsedTime: run.elapsedTime + action.seconds } : run) };
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

function loadRun(state, run) {
  const withExpanded = { ...run, expanded: true };
  return {
    ...state,
    runs: [...collapseAll(state.runs), withExpanded],
    controls: { ...state.controls },
  };
}

function deleteRun(state, index) {
  const deletedRun = state.runs[index];
  const newRuns = state.runs.toSpliced(index, 1);
  const newDisplay = { type: 'region', index: deletedRun.regionId };
  const finalRuns = deletedRun.expanded
    ? expandRun(collapseAll(newRuns), (newRuns[index - 1] ?? newRuns[0])?.uuid)
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

  let merchantPaths;
  let piratePaths;
  let patrolPaths;

  switch (region.name) { // TODO: make the rest of these paths
    case "Somalian Coast":
      merchantPaths = somaliaMerchantPaths;
      // piratePaths = somaliaPiratePaths;
      // patrolPaths = somaliaPatrolPaths;
      break;

    case "Gulf of Guinea":
      // merchantPaths = guineaMerchantPaths;
      // piratePaths = guineaPiratePaths;
      // patrolPaths = guineaPatrolPaths;
      break;

    case "Malacca Strait":
      // merchantPaths = malaccaMerchantPaths;
      // piratePaths = malaccaPiratePaths;
      // patrolPaths = malaccaPatrolPaths;
      break;
  
    default:
      console.error("Unrecognized region name; no paths will be made! This is probably gonna break something!");
      break;
  }
 
  for (const [pointId, point] of Object.entries(region.points)) {
    const pos = point.pos;

    if (point.type === 'port') {
      if (Math.random() < merchantChance) {
        const id = crypto.randomUUID();
        const paths = merchantPaths[pointId];
        const path = paths ? paths[Math.floor(Math.random() * paths.length)] : null;
        ships[id] = buildShipWithMover('merchant', pos, 'medium', region.center, path);
      }
      if (Math.random() < patrolChance) {
        const id = crypto.randomUUID();
        const paths = patrolPaths[pointId];
        const path = paths ? paths[Math.floor(Math.random() * paths.length)] : null;
        ships[id] = buildShipWithMover('patrol', pos, 'medium', region.center, path);
      }
    }

    if (point.type === 'pirateCove') {
      if (Math.random() < pirateChance) {
        const id = crypto.randomUUID();
        const paths = piratePaths[pointId];
        const path = paths ? paths[Math.floor(Math.random() * paths.length)] : null;
        ships[id] = buildShipWithMover('pirate', pos, 'small', region.center, path);
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

// NEW: passing in region center for coord conversion. ALSO NEW: all ships start as path followers, so a path arg is now needed
function buildShipWithMover(type, pos, size, regionCenter, path) { // Construct a ship AND attach a mover object 
  
  // Predefined, constant state of our ship types. May need balancing!!
  const stats = {
    merchant: { crewSize: 21, durability: 70, armament: 25, sightRange: 1000, maxSpeed: 10000 },
    pirate:   { crewSize: 7,  durability: 15, armament: 45, sightRange: 10000, maxSpeed: 10000 },
    patrol:   { crewSize: 10, durability: 20, armament: 60, sightRange: 2000,  maxSpeed: 10000 },
  }[type] ?? { crewSize: 5, durability: 10, armament: 10, sightRange: 1000, maxSpeed: 5000 };

  // NEW: convert position to cartesian before building
  const cartesianPos = latLngToCartesian(pos[0], pos[1], {
    originLat: regionCenter[0],
    originLon: regionCenter[1],
    metersPerUnit: 1,
    headingDegrees: 0,
  });
 
  // Build the kinematic: ships start stationary at their spawn point
  const kinematic = behaviors.newKinematic(
    cartesianPos,   // position
    0,     // orientation (radians)
    [0, 0],// velocity
    0      // rotation
  );
 
  // NEW: not using wander anymore because it sucks and doesnt work and also sucks
  const wander = behaviors.newWander(
    kinematic,
    0.5,   // maxAcceleration
    0.1,   // maxAngularAcc
    0.05,  // maxRotation
    1,     // slowThreshold
    0.5,   // targetThreshold
    stats.maxSpeed
  ); 

  // NEW: using followPath as default ship behavior now, NOTE: also may need balancing/ number tweaking
  let behavior;
  if (path) {
    behavior = behaviors.newFollowPath(
    path,
    0.04,  // pathOffset — small value, just look slightly ahead
    0,     // currentParam — always start at beginning of path
    kinematic,
    10 * 100  // BOOSTED ACCELERATION FOR TESTING REMOVE *100 LATER
    );
  } 
  else {
    behavior = wander;
  }
 
  const mover = behaviors.newMover(kinematic, [0, 0], stats.maxSpeed, behavior);
 
  return {
    type,
    pos: cartesianPos,            // keep top-level pos in sync with mover for ShipIcons to read
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

  return {
    ...state,
    runs: state.runs,
    display:  { type: 'run', index: runIndex },
    controls: { type: 'active-run', index: runIndex },
  };
}

function startRun(state, runIndex) {
  const run = state.runs[runIndex];
  if (!run) return state;

  const startedRun = run.status === 'new'
    ? spawnShips({ ...run, status: 'running' }, state.regions)
    : { ...run, status: 'running' };

  return {
    ...state,
    runs: state.runs.map((candidate, i) => i === runIndex ? startedRun : candidate),
  };
}


export { simStateReducer, appStartState, buildNewRun };
export { spawnShips, buildShipWithMover, viewRunControls, startRun };
