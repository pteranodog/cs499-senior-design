import seedrandom from 'seedrandom';
import { newConfig, newRun } from './classes.js';
import { defaultRegions } from './regions.js';
import { step } from './stateFunctions.js';
import * as behaviors from './behaviors.js';
import { latLngToCartesian } from '../utils/coords.js';
import { aStar } from './aStar.js';

//import { somaliaMerchantPaths } from './somaliaPaths.js';
//import { somaliaPiratePaths } from './somaliaPaths.js';
//import { somaliaPatrolPaths } from './somaliaPaths.js';

import { chooseWeightedDestPort, chooseWeightedSpawnPort } from './regions.js';
import { choosePirateDestination, choosePatrolDestination } from './stateFunctions.js';

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
      return replayRun(state, action.index, action.endTime);
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
    case 'skip-run-to-end':
      return {
        ...state,
        runs: state.runs.map((run, i) => {
          if (i !== action.index) return run;
          if (!['running', 'paused'].includes(run.status)) return run;

          let updatedRun = { ...run };

          const durationTicks =
            updatedRun.isImported && updatedRun.replayEndTime
              ? updatedRun.replayEndTime
              : getRunDurationTicks(updatedRun);

          while (
            updatedRun.elapsedTime < durationTicks &&
            updatedRun.status !== 'completed'
          ) {
            // Match actual Step button behavior
            updatedRun = incrementRunTime(updatedRun, 1);

            if (updatedRun.status === 'completed') {
              break;
            }

            updatedRun = step(updatedRun, state.regions);
            updatedRun = spawnMoreShips(updatedRun, state.regions);
          }
          return updatedRun;
        })
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
  const durationTicks = run.isImported && run.replayEndTime ? run.replayEndTime : getRunDurationTicks(run);

  if (nextElapsedTime >= durationTicks) {
    return {
      ...run,
      elapsedTime: durationTicks,
      status: 'completed',
      elapsedTimeEnd: durationTicks
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
    replayEndTime: source.elapsedTimeEnd ?? source.elapsedTime,
    regionId: source.regionId,
    weatherType: source.weatherType,
    maxMerchants: source.maxMerchants,
    maxPirates: source.maxPirates,
    maxPatrols: source.maxPatrols,
    ticksPerMinute: source.ticksPerMinute,
    expanded: true,
  };
  const newRuns = [...state.runs.slice(0, index + 1), duplicate, ...state.runs.slice(index + 1)];
  return { ...state, runs: collapseAll(newRuns).map(run =>
    run.uuid === duplicate.uuid ? { ...run, expanded: true } : run
  )};
}

function replayRun(state, index, endTime) {
  const source = state.runs[index];
  if (!source) return state;

  const duplicate = {
    ...buildNewRun(),
    name: appendReplaySuffix(source.name),
    seed: source.seed,
    startHour: source.startHour,
    startMinute: source.startMinute,
    duration: source.duration,
    replayEndTime: endTime ?? source.elapsedTimeEnd ?? source.elapsedTime,
    regionId: source.regionId,
    weatherType: source.weatherType,
    maxMerchants: source.maxMerchants,
    maxPirates: source.maxPirates,
    maxPatrols: source.maxPatrols,
    speed: source.speed,
    ticksPerMinute: source.ticksPerMinute,
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
    // ACTUALY RANDOM! This is the seed for the new run.
    Math.floor(Math.random() * 10000) + 1,
    0, 0, 72, 'clear', 0, 40, 0
  );
  const run = newRun('Untitled Run', config, 'r1');
  return { ...run, uuid: crypto.randomUUID() };
}

function spawnShips(run, regions) {
  const rng = seedrandom(run.seed + '-' + run.elapsedTime + 'spawn');
  const region = regions[run.regionId];

  if (!region) return run;


  const ships = {};

  let merchantsSpawned = 0;
  let piratesSpawned = 0;

  let pathIdCounter = 1;
  
  const merchantsPerDay = (run.maxMerchants ?? 0);
  const piratesPerDay   = (run.maxPirates   ?? 0);
  const maxPatrols   = (run.maxPatrols   ?? 0);

  const shouldSpawnMerchant = shouldSpawn(merchantsPerDay, run.seed, run.elapsedTime /*, ticksPerMinute ^ -1 */);
  const shouldSpawnPirate = shouldSpawn(piratesPerDay, run.seed, run.elapsedTime/*, ticksPerMinute ^ -1 */);

  if (shouldSpawnMerchant) {
    const chosenPort = chooseWeightedSpawnPort(region, rng);
    if (!chosenPort) {
      console.error("No eligible spawn ports detected when attempting to spawn merchant!");
      return run;
    }

    const destLatLng = chooseWeightedDestPort(region, rng);
    const ID = crypto.randomUUID();
    ships[ID] = buildShip("merchant", chosenPort.pos, "medium", region, destLatLng, pathIdCounter++);
    merchantsSpawned += 1;
  }

  if(shouldSpawnPirate) {
    const coves = Object.entries(region.points).filter(([, p]) => p.type === 'pirateCove');
    if (coves.length === 0) {
      console.error("No coves detected when attempting to spawn pirate")
      return run;
    }
    const [, chosenPoint] = coves[Math.floor(rng() * coves.length)]; // randomly choose a spawn cove; should these be weighted too?..
    const ID = crypto.randomUUID();

    // need cartesian equivalent for point choosing
    const cartesianPos = latLngToCartesian(chosenPoint.pos[0], chosenPoint.pos[1], {
      originLat: region.center[0], originLon: region.center[1]
    });

    // passing in generic object w/ cartesianPos as single field since thats all the ship data this func needs
    const destLatLng = choosePirateDestination({ pos: cartesianPos}, region, run.seed, run.elapsedTime, 0); 

    ships[ID] = buildShip("pirate", chosenPoint.pos, "medium", region, destLatLng, pathIdCounter++)
    piratesSpawned += 1;
  }


    const currentPatrols = Object.values(ships).filter(s => s.type === 'patrol').length;
      const bases = Object.entries(region.points).filter(([, p]) => p.type === 'patrolBase');
      for (const [, point] of bases) {
        const currentPatrols = Object.values(ships).filter(s => s.type === 'patrol').length;
        if (currentPatrols >= maxPatrols) break;
        if (!shouldSpawn(maxPatrols * 2, run.seed, run.elapsedTime)) continue;
        const id = crypto.randomUUID();
        const cartesianPos = latLngToCartesian(point.pos[0], point.pos[1], {
          originLat: region.center[0], originLon: region.center[1], metersPerUnit: 1, headingDegrees: 0,
        });
        const destLatLng = choosePatrolDestination({ pos: cartesianPos }, { pos: cartesianPos }, region, run.seed, run.elapsedTime, point);
        ships[id] = buildShip('patrol', point.pos, 'medium', region, destLatLng ?? null, pathIdCounter++);
      }
    

      // OLD SPAWNING CODE:
  /*
  for (const [pointId, point] of Object.entries(region.points)) {
    const pos = point.pos;

    if (point.type === 'port' && shouldSpawn(merchantsPerDay)) {            
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
        const id    = crypto.randomUUID();
        const cartesianPos = latLngToCartesian(pos[0], pos[1], {
        originLat: region.center[0],
        originLon: region.center[1]
      });
      const destLatLng = choosePatrolDestination({ pos: cartesianPos }, region);
      ships[id] = buildShip('patrol', pos, 'medium', region, destLatLng ?? null, pathIdCounter++);
      }
    }

    if ((point.type === 'pirateCove') && shouldSpawn(piratesPerDay)) {
      piratesSpawned += 1;
      const id = crypto.randomUUID();
      const cartesianPos = latLngToCartesian(pos[0], pos[1], {
        originLat: region.center[0],
        originLon: region.center[1],
        metersPerUnit: 1,
        headingDegrees: 0,
      });
      const destLatLng = choosePirateDestination({ pos: cartesianPos }, region);
      ships[id] = buildShip('pirate', pos, 'medium', region, destLatLng ?? null, pathIdCounter++);
    }
  }

  */

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
  const stats = {
    merchant: { crewSize: 21, durability: 70, armament: 25, sightRange: 3700, forgetRange: 50000,  maxSpeed: 633.4, maxAcceleration: 1800, maxAngularAcc: 0.0002, maxRotation: 0.52 },
    pirate:   { crewSize: 7,  durability: 15, armament: 45, sightRange: 9260, forgetRange: 50000, maxSpeed: 766.67, maxAcceleration: 8500, maxAngularAcc: 15, maxRotation: 1.25 },
    patrol:   { crewSize: 80, durability: 100, armament: 60, sightRange: 27000,  forgetRange: Infinity, maxSpeed: 771.67, maxAcceleration: 10000, maxAngularAcc: 0.1, maxRotation: 0.78 },
  }[type] ?? { crewSize: 5, durability: 10, armament: 10, sightRange: 1000, maxSpeed: 500, maxAcceleration: 500, maxAngularAcc: 0.1, maxRotation: 0.5 };

  const cartesianPos = latLngToCartesian(pos[0], pos[1], {
    originLat: region.center[0],
    originLon: region.center[1],
    metersPerUnit: 1,
    headingDegrees: 0,
  });

  let behaviorList;
  let destination = null; // stored on ship for repath

  if ((type === 'merchant' || type === 'pirate' ||  type === 'patrol') && destPos && region.navgraph) {
    const destCartesian = latLngToCartesian(destPos[0], destPos[1], {
      originLat: region.center[0],
      originLon: region.center[1],
      metersPerUnit: 1,
      headingDegrees: 0,
    });

    const path = aStar(region.navgraph, cartesianPos, destCartesian, type, pathId);

    if (path) {
      behaviorList    = [behaviors.newFollowPath(path, 0.04)];
      destination = destCartesian;
    } else {
      // A* failed — fall back to wander
      console.warn('buildShip: A* returned null, falling back to wander');
      behaviorList = [behaviors.newWander()];
    }
  } else if (fallbackPath) {
    behaviorList = [behaviors.newFollowPath(fallbackPath, 0.04)];
  } else {
    behaviorList = [behaviors.newWander()];
  }


  return {
    type,
    pos:         cartesianPos,
    orientation: 0,
    velocity:    [0, 0],
    rotation:    0,
    size,
    stepsAlive:  0, // NEW: need to track so certain spawn points' ships dont get stuck instantly 
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
    inCombat:   false,
    state: 1, // always start in default state
    // Persistent behavior
    behaviorList,
    // destination for repath
    destination,
    stepsSinceRepath: 0,
    // Pirate-only
    homeCove: type === 'pirate' ? cartesianPos : null,
    fuel:       100,
    // patrol only
    homeBase: type === 'patrol' ? { pos: cartesianPos } : null,
  };
}

function viewRunList(state, runIndex, selectedRuns) {
  let runs = deselectAll(state.runs, selectedRuns);

  return {
    ...state,
    runs,
    display: { type: 'region', index: 'r1' }, // ← force reset
    controls: { type: 'list-runs' }
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
  const rng = seedrandom(run.seed + '-' + run.elapsedTime + 'more');
  const maxShips = Infinity; // NEW: no max lets go crazy
  const region = regions[run.regionId];
  if (!region) return run;

  // Don't spawn if we're at the cap
  const currentCount = Object.keys(run.currentState.ships).length;
  if (currentCount >= maxShips) return run;

  const newShips = { ...run.currentState.ships };

  const merchantsPerDay = (run.maxMerchants ?? 0);
  const piratesPerDay   = (run.maxPirates   ?? 0);
  const maxPatrols      = (run.maxPatrols   ?? 0);

  let pathIdCounter = Date.now(); // avoid ID collisions with initial spawn

  // Merchants: one roll per tick, spawn @ random (weighted probability) port if it fires
  if (shouldSpawn(merchantsPerDay, run.seed, run.elapsedTime)) {
    const chosenPort = chooseWeightedSpawnPort(region, rng);
    if (chosenPort) {
      const destLatLng = chooseWeightedDestPort(region, rng);
      const id = crypto.randomUUID();
      newShips[id] = buildShip('merchant', chosenPort.pos, 'medium', region, destLatLng ?? null, pathIdCounter++);
    }
  }

  // Pirates: one roll per tick, spawn @ random cove if it fires
  if (shouldSpawn(piratesPerDay, run.seed, run.elapsedTime)) {
    const coves = Object.entries(region.points).filter(([, p]) => p.type === 'pirateCove');
    if (coves.length > 0) {
      const [, chosenPoint] = coves[Math.floor(rng() * coves.length)];
      const id = crypto.randomUUID();
      const cartesianPos = latLngToCartesian(chosenPoint.pos[0], chosenPoint.pos[1], {
        originLat: region.center[0], originLon: region.center[1], metersPerUnit: 1, headingDegrees: 0,
      });
      // passing in generic object w/ cartesianPos as single field since thats all the ship data this func needs
      const destLatLng = choosePirateDestination({ pos: cartesianPos }, region, run.seed, run.elapsedTime, 0);
      newShips[id] = buildShip('pirate', chosenPoint.pos, 'medium', region, destLatLng ?? null, pathIdCounter++);
    }
  }

  // Patrols: iterate all bases, spawn up to maxPatrols over half a day
  const bases = Object.entries(region.points).filter(([, p]) => p.type === 'patrolBase');
  for (const [, point] of bases) {
    const currentPatrols = Object.values(newShips).filter(s => s.type === 'patrol').length; // Convoluted way of checking if we've hit max patrol count yet
    if (currentPatrols >= maxPatrols) break;
    if (!shouldSpawn(maxPatrols * 2, run.seed, run.elapsedTime)) continue; // spawn all patrols in ~1/2 a day
    const id = crypto.randomUUID();
    const cartesianPos = latLngToCartesian(point.pos[0], point.pos[1], {
      originLat: region.center[0], originLon: region.center[1], metersPerUnit: 1, headingDegrees: 0,
    });
    const destLatLng = choosePatrolDestination({ pos: cartesianPos }, { pos: cartesianPos }, region, run.seed, run.elapsedTime, point);
    newShips[id] = buildShip('patrol', point.pos, 'medium', region, destLatLng ?? null, pathIdCounter++);
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
