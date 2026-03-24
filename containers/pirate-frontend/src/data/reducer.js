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
      return { ...state, controls: { ...state.controls, selectedRun: action.run } };
    case 'view-run-controls':
      return { ...state, display: { type: 'run', index: action.run }, controls: { type: 'active-run', index: action.run }};
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
      index: '331541d6-617d-4464-b7d0-9b346b87f41c'
    },
    controls: {
      type: 'list-runs',
      selectedRun: null
    }
  };
}

function createRun(state) {
  const newRun = buildNewRun();
  const selectedRun = state.controls.selectedRun ? newRun.uuid : null;
  return { ...state, runs: [...state.runs, newRun], controls: {...state.controls, selectedRun}};
}

function loadRun(state, filePath) {
  // TODO: Load run
  return state;
}

function deleteRun(state, index) {
  const deletedRun = state.runs[index];
  const newRuns = state.runs.toSpliced(index, 1);
  const deletedWasActive = deletedRun.uuid === state.controls.selectedRun;
  const newActiveKey = deletedWasActive
    ? (newRuns[index - 1] ?? newRuns[0])?.uuid ?? null
    : state.controls.selectedRun;
  const newDisplay = { type: 'region', index: deletedRun.regionId };
  return { ...state, runs: newRuns, display: newDisplay, controls: { ...state.controls, selectedRun: newActiveKey } };
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
  };
  const newRuns = [...state.runs.slice(0, index + 1), duplicate, ...state.runs.slice(index + 1)];
  return { ...state, runs: newRuns, controls: { ...state.controls, selectedRun: duplicate.uuid } };
}

function step() {}

function buildNewRun() {
  const config = newConfig(
    Math.floor(Math.random() * 1000000000) + 1,
    0, 0, 1500, 'clear', 33, 34, 33
  );
  const run = newRun('Untitled Run', config, '331541d6-617d-4464-b7d0-9b346b87f41c');
  return { ...run, uuid: crypto.randomUUID() };
}

export { simStateReducer, appStartState };
