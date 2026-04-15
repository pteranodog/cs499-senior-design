import { newConfig, newRun } from './classes.js';
import { defaultRegions } from './regions.js';
import { step } from './stateFunctions.js';
import * as behaviors from './behaviors.js';
import { latLngToCartesian } from '../utils/coords.js';
import { aStar } from './aStar.js';

import { somaliaMerchantPaths } from './somaliaPaths.js';
import { somaliaPiratePaths } from './somaliaPaths.js';
import { somaliaPatrolPaths } from './somaliaPaths.js';

import { getSomaliaMerchantDestination } from '../utils/pointChoosing.js';
import { getSomaliaHotspot } from '../utils/pointChoosing.js';


import { shouldSpawn, perDaytoProbability } from '../utils/spawnRates.js';

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
      return {
        ...state,
        runs: state.runs.map((run, i) => {
          if (i !== action.index) return run;
          if (!['running', 'paused'].includes(run.status)) return run;
          const stepped = step(run, state.regions);
          return spawnMoreShips(stepped, state.regions);
        })
      };
    case 'create-run':
      return createRun(state);
    case 'load-run':
      return loadRun(state, action.run);
    case 'start-run':
      return startRun(state, action.index, action.startPaused);
    case 'modify-run':
      return { ...state, runs: state.runs.map((run, i) => i === action.index ? { ...run, [action.setting]: action.value } : run) };
    case 'delete-run':
      return deleteRun(state, action.index);
    case 'duplicate-run':
      return duplicateRun(state, action.index);
    case 'replay-run':
      return replayRun(state, action.index);
    case 'select-run':
      return { ...state, runs: expandRun(state.runs, action.run) };
    case 'compare-runs':
      return { ...state, display: { type: 'run', index: action.runA },
        controls: { type: 'compare-runs', runA: action.runA, runB: action.runB }};
    case 'view-run-list':
      return viewRunList(state, action.run, action.selected);
    case 'view-run-controls':
      return viewRunControls(state, action.run);
    case 'view-run-end':
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'end-run', index: action.run }};
    case 'increment-run-time':
      return {
        ...state,
        runs: state.runs.map((run, i) => i === action.index
          ? incrementRunTime(run, action.ticks ?? 1)
          : run),
      };
    default:
      console.warn('Action type "' + action.type + '" not found.');
      return state;
  }
}

function getRunDurationTicks(run) {
  const durationHours = Number(run?.duration);
  const ticksPerMinute = Math.max(Number(run?.ticksPerMinute) || 1, 1);

  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return Infinity;
  }

  return durationHours * 60 * ticksPerMinute;
}

function incrementRunTime(run, ticksToAdd = 1) {
  const nextElapsedTime = (Number(run?.elapsedTime) || 0) + ticksToAdd;
  const durationTicks = getRunDurationTicks(run);

  if (nextElapsedTime >= durationTicks) {
    return {
      ...run,
      elapsedTime: durationTicks,
      status: 'completed',
    };
  }

  return {
    ...run,
    elapsedTime: nextElapsedTime,
  };
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

function replayRun(state, index) {
  const source = state.runs[index];
  if (!source) return state;

  const duplicate = {
    ...buildNewRun(),
    name: appendReplaySuffix(source.name),
    seed: source.seed,
    startHour: source.startHour,
    startMinute: source.startMinute,
    duration: source.duration,
    regionId: source.regionId,
    weatherType: source.weatherType,
    maxMerchants: source.maxMerchants,
    maxPirates: source.maxPirates,
    maxPatrols: source.maxPatrols,
    speed: source.speed,
    ticksPerMinute: source.ticksPerMinute,
    status: 'running',
    expanded: true,
  };

  const startedDuplicate = spawnShips(duplicate, state.regions);
  const insertionIndex = index + 1;
  const newRuns = [...state.runs.slice(0, insertionIndex), startedDuplicate, ...state.runs.slice(insertionIndex)];

  return {
    ...state,
    runs: collapseAll(newRuns).map((run, i) => i === insertionIndex ? { ...run, expanded: true } : run),
    display: { type: 'run', index: insertionIndex },
    controls: { type: 'active-run', index: insertionIndex },
  };
}

function appendReplaySuffix(name) {
  const baseName = String(name || 'Untitled Run').trim();
  return baseName.match(/\(Replay\)$/i)
    ? baseName
    : `${baseName} (Replay)`;
}

function collapseAll(runs) {
  return runs.map(({ expanded, ...rest }) => rest);
}

function expandRun(runs, uuid) {
  return collapseAll(runs).map(run =>
    run.uuid === uuid ? { ...run, expanded: true } : run
  );
}

function deselectAll(runs, exceptThese) {
  exceptThese = Array.isArray(exceptThese) ? exceptThese : [exceptThese];
  return runs.map((run, index) => { return { ...run, selected: exceptThese.includes(index) }});
}

function buildNewRun() {
  const config = newConfig(
    Math.floor(Math.random() * 10000) + 1,
    0, 0, 25, 'clear', 0, 40, 0
  );
  const run = newRun('Untitled Run', config, 'r1');
  return { ...run, uuid: crypto.randomUUID() };
}

function spawnShips(run, regions) {
  const region = regions[run.regionId];

  console.log('spawnShips called, region:', region?.name, 'merchantsPerDay:', run.maxMerchants, 'piratesPerDay:', run.maxPirates);

  if (!region) return run;

  const ships = {};

  let merchantsSpawned = 0;
  let piratesSpawned = 0;
  
  const merchantsPerDay = (run.maxMerchants ?? 0);
  const piratesPerDay   = (run.maxPirates   ?? 0);
  const maxPatrols   = (run.maxPatrols   ?? 0);

  const allPorts = Object.entries(region.points)
    .filter(([, point]) => point.type === 'port')
    .map(([id, point]) => ({ id, pos: point.pos }));

  let patrolPaths;

  switch (region.name) {
    case "Somalian Coast":
      patrolPaths  = somaliaPatrolPaths;
      break;
    case "Gulf of Guinea":
      // TODO: patrol paths for these two
    case "Malacca Strait":
    default:
      break;
  }

  let pathIdCounter = 1;

  for (const [pointId, point] of Object.entries(region.points)) {
    const pos = point.pos;

    if (point.type === 'port' && shouldSpawn(merchantsPerDay)) {            
      console.log("merchant spawn roll succeeded");
      merchantsSpawned += 1;
      const id = crypto.randomUUID();

      // Pick a random destination port from predefined, prioritized destination list
      // TODO: generalize for other regions
      const destPortLatLn = getSomaliaMerchantDestination();

      ships[id] = buildShip(
        'merchant', pos, 'medium', region, 
        destPortLatLn ?? null,
        pathIdCounter++
      );
    
    }

    if (point.type === 'patrolBase') {
      const currentPatrols = Object.values(ships).filter(s => s.type === 'patrol').length; // Convoluted way of checking if we've hit max patrol count yet
      if (currentPatrols < maxPatrols) {
        console.log("patrol spawn roll succeeded");
        const id    = crypto.randomUUID();
        const paths = patrolPaths ? patrolPaths[pointId] : null;
        const path  = paths ? paths[Math.floor(Math.random() * paths.length)] : null;
        console.log("here is the path the newly spawned patrol will be useing:\n\n", path)
        ships[id]   = buildShip('patrol', pos, 'medium', region, null, pathIdCounter++, path);
      }
    }

    if ((point.type === 'pirateCove' ) && shouldSpawn(piratesPerDay)) {
      console.log("pirate spawn roll succeeded"); 
      piratesSpawned += 1;
      const id    = crypto.randomUUID();
      
      // Pick a random destination port from predefined, prioritized destination list
      // TODO: generalize for other regions
      const destLatLn = getSomaliaHotspot();
      ships[id] = buildShip(
        'pirate', pos, 'medium', region, 
        destLatLn ?? null,
        pathIdCounter++
      );
    }
  }

  return {
    ...run,
    currentState: {
      ...run.currentState,
      stats: {
        ...run.currentState?.stats,
        merchantsSpawned: (run.currentState?.stats?.merchantsSpawned ?? 0) + merchantsSpawned,
        piratesSpawned: (run.currentState?.stats?.piratesSpawned ?? 0) + piratesSpawned,
      },
      ships
    }
  };
}


function buildShip(type, pos, size, region, destPos, pathId, fallbackPath = null) {
  console.log('buildShip:', type, 'pos:', pos, 'center:', region.center);
  const stats = {
    merchant: { crewSize: 21, durability: 70, armament: 25, sightRange: 1000,  maxSpeed: 633.4, maxAcceleration: 1800, maxAngularAcc: 0.0002, maxRotation: 0.52 },
    pirate:   { crewSize: 7,  durability: 15, armament: 45, sightRange: 10000, maxSpeed: 766.67, maxAcceleration: 8500, maxAngularAcc: 15, maxRotation: 1.25 },
    patrol:   { crewSize: 80, durability: 100, armament: 60, sightRange: 2000,  maxSpeed: 771.67, maxAcceleration: 10000, maxAngularAcc: 0.1, maxRotation: 0.78 },
  }[type] ?? { crewSize: 5, durability: 10, armament: 10, sightRange: 1000, maxSpeed: 500, maxAcceleration: 500, maxAngularAcc: 0.1, maxRotation: 0.5 };

  const cartesianPos = latLngToCartesian(pos[0], pos[1], {
    originLat: region.center[0],
    originLon: region.center[1],
    metersPerUnit: 1,
    headingDegrees: 0,
  });

  let behavior;
  let destination = null; // stored on ship for repath

  if ((type === 'merchant' || type === 'pirate') && destPos && region.navgraph) {
    const destCartesian = latLngToCartesian(destPos[0], destPos[1], {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });

    const path = aStar(region.navgraph, cartesianPos, destCartesian, type, pathId);

    if (path) {
      behavior    = behaviors.newFollowPath(path, 0.04);
      destination = destCartesian;
    } else {
      // A* failed — fall back to wander
      console.warn('buildShip: A* returned null, falling back to wander');
      behavior = behaviors.newWander();
    }
  } else if (fallbackPath) {
    behavior = behaviors.newFollowPath(fallbackPath, 0.04);
  } else {
    behavior = behaviors.newWander();
  }

  return {
    type,
    pos:         cartesianPos,
    orientation: 0,
    velocity:    [0, 0],
    rotation:    0,
    size,
    // Motion limits
    maxSpeed:        stats.maxSpeed,
    maxAcceleration: stats.maxAcceleration,
    maxAngularAcc:   stats.maxAngularAcc,
    maxRotation:     stats.maxRotation,
    // Combat/sim stats
    sightRange: stats.sightRange,
    crewSize:   stats.crewSize,
    armament:   stats.armament,
    durability: stats.durability,
    fuel:       100,
    inCombat:   false,
    state: 1, // always start in default state
    // Persistent behavior
    behavior,
    // Merchant-only: destination for repath
    destination,
    stepsSinceRepath: 0,
  };
}

function viewRunList(state, runIndex, selectedRuns) {
  let runs = deselectAll(state.runs, selectedRuns);
  let display = state.display;
  if (runIndex !== undefined) {
    display = { type: 'run', index: runIndex };
  }
  return { ...state, runs: runs, display: display, controls: { type: 'list-runs' }};
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

function startRun(state, runIndex, startPaused) {
  const run = state.runs[runIndex];
  if (!run) return state;

  const startedRun = run.status === 'new'
    ? spawnShips({ ...run, status: startPaused ? 'paused' : 'running' }, state.regions)
    : { ...run, status: startPaused ? 'paused' : 'running' };

  return {
    ...state,
    runs: state.runs.map((candidate, i) => i === runIndex ? startedRun : candidate),
  };
}

// need another function to spawn ships at successive steps besides first
function spawnMoreShips(run, regions) {
  const maxShips = Math.ceil((run.maxMerchants + run.maxPirates + run.maxPatrols) * 0.40); // make max ships 40% of what we'd expect total ships per day to be
  console.log('spawnMoreShips called, shipCount:', Object.keys(run.currentState.ships).length, 'maxShips:', maxShips);
  const region = regions[run.regionId];
  if (!region) return run;

  // Don't spawn if we're at the cap
  const currentCount = Object.keys(run.currentState.ships).length;
  if (currentCount >= maxShips) return run;

  const newShips = { ...run.currentState.ships };

  const merchantsPerDay = (run.maxMerchants ?? 0);
  const piratesPerDay   = (run.maxPirates   ?? 0);
  const maxPatrols   = (run.maxPatrols   ?? 0);

  let patrolPaths;

  switch (region.name) {
    case "Somalian Coast":
      patrolPaths = somaliaPatrolPaths;
      break;
    case "Gulf of Guinea":
    case "Malacca Strait":
    default:
      break;
  }

  let pathIdCounter = Date.now(); // avoid ID collisions with initial spawn

  for (const [pointId, point] of Object.entries(region.points)) {
    if (Object.keys(newShips).length >= maxShips) break;
    const pos = point.pos;

    if ((point.type === 'port') && shouldSpawn(merchantsPerDay)) {
      const id           = crypto.randomUUID();
      const destLatLng   = getSomaliaMerchantDestination();
      newShips[id] = buildShip(
        'merchant', pos, 'medium', region,
        destLatLng ?? null,
        pathIdCounter++
      );
    
    }
    const currentPatrols = Object.values(newShips).filter(s => s.type === 'patrol').length; // Convoluted way of checking if we've hit max patrol count yet
    if (point.type === 'patrolBase' && (currentPatrols < maxPatrols)) {
    
      const id    = crypto.randomUUID();
      const paths = patrolPaths ? patrolPaths[pointId] : null;
      const path  = paths ? paths[Math.floor(Math.random() * paths.length)] : null;
      newShips[id] = buildShip('patrol', pos, 'medium', region, null, pathIdCounter++, path);
    
    }

    if ((point.type === 'pirateCove' ) && shouldSpawn(piratesPerDay)) {
      const id         = crypto.randomUUID();
      const destLatLng = getSomaliaHotspot();
      newShips[id] = buildShip(
        'pirate', pos, 'medium', region,
        destLatLng ?? null,
        pathIdCounter++
      );
    }
  }

  return {
    ...run,
    currentState: {
      ...run.currentState,
      ships: newShips
    }
  };
}

export { simStateReducer, appStartState, buildNewRun };
export { spawnShips, buildShip, viewRunControls, startRun };
