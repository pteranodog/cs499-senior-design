import { newConfig, newRun } from './classes.js';
import { defaultRegions } from './regions.js';

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
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'active-run', index: action.run }};
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
    randomSeed: source.randomSeed,
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
    Math.floor(Math.random() * 1000000000) + 1,
    0, 0, 1500, 'clear', 33, 34, 33
  );
  const run = newRun('Untitled Run', config, 'r1');
  return { ...run, uuid: crypto.randomUUID() };
}

export { simStateReducer, appStartState, buildNewRun };
