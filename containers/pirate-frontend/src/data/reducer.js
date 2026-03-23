import { newConfig, newRun } from './classes.js';
import { defaultRegions } from './regions.js';
// import './stepRun.js';

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
      return modifyRun(state, action.index, action.setting, action.value);
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
    },
    controls: {
      type: 'list-runs',
      selectedRun: null
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
    },
    controls: state.controls
  }
}

function displayRun(state, index) {
  return {
    regions: state.regions,
    runs: state.runs,
    display: {
      type: 'run',
      index: index
    },
    controls: state.controls
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
    display: state.display,
    controls: state.controls
  }
}

function createRun(state) {
  return {
    regions: state.regions,
    // TODO: Figure out where and what newRun is
    runs: [...state.runs, buildNewRun()],
    display: state.display,
    controls: state.controls
  }
}

function loadRun(state, filePath) {
  // TODO: Load run
  return state;
}

function modifyRun(state, index, setting, value) {
  return {
    regions: state.regions,
    runs: state.runs.map((run, runIndex) => {
      if (runIndex === index) {
        let runInfo = {...run};
        runInfo[setting] = value;
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
    display: state.display,
    controls: state.controls
  }
}

function step() {};

function buildNewRun() {
  let randomSeed = Math.floor(Math.random() * 1000000000) + 1;
  let defaultDuration = 1500;
  let defaultWeather = "clear";
  let defaultPirates = 33;
  let defaultMerchants = 34;
  let defaultPatrols = 33;
  let config = newConfig(randomSeed, defaultDuration, defaultWeather, defaultPirates, defaultMerchants, defaultPatrols);
  let defaultRunName = "Untitled Run";
  let defaultRegion = "331541d6-617d-4464-b7d0-9b346b87f41c"; // Somalia
  let run = newRun(defaultRunName, config, defaultRegion);
  run.uuid = crypto.randomUUID();
  return run;
};

export { simStateReducer, appStartState };
