import './classes.js';
import { defaultRegions } from './regions.js';
import { step } from './stateFunctions.js';

function simStateReducer(state, action) {
  switch (action.type) {
    case 'initialize':
    case 'reset':
      return appStartState();
    case 'display-region':
      return displayRegion(state, action.id);
    case 'display-run':
      return displayRun(state, action.index);
    case 'step-run':
      return stepRun(state, action.index);
    case 'create-run':
      return createRun(state);
    case 'load-run':
      return loadRun(state, action.filePath);
    case 'modify-run':
      return modifyRun(state, action.index, action.runInfo);
    case 'delete-run':
      return deleteRun(state, action.index);
    default:
      console.warning('Action type "' + action.type + '" not found.');
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
    }
  };
}

function displayRegion(state, id) {
  return {
    regions: state.regions,
    runs: state.runs,
    display: {
      type: 'region',
      index: id
    }
  }
}

function displayRun(state, index) {
  return {
    regions: state.regions,
    runs: state.runs,
    display: {
      type: 'run',
      index: index
    }
  }
}

function stepRun(state, index) {
  return {
    regions: state.regions,
    runs: state.runs.map((run, runIndex) => {
      if (runIndex === index) {
        // TODO: Make step function elsewhere
        return step(run);
      }
      return run;
    }),
    display: state.display
  }
}

function createRun(state) {
  return {
    regions: state.regions,
    // TODO: Figure out where and what newRun is
    runs: [...state.runs, newRun()],
    display: state.display
  }
}

function loadRun(state, filePath) {
  // TODO: Load run
  return state;
}

function modifyRun(state, index, runInfo) {
  return {
    regions: state.regions,
    runs: state.runs.map((run, runIndex) => {
      if (runIndex === index) {
        return runInfo;
      }
      return run;
    }),
    display: state.display
  }
}

// TODO: Guard code
function deleteRun(state, index) {
  return {
    regions: state.regions,
    runs: state.runs.toSpliced(index, 1),
    display: state.display
  }
}

function step() {};
function newRun() {};

export { simStateReducer, appStartState };
