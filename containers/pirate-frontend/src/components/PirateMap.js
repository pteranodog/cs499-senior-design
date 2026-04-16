import { useEffect, useReducer } from 'react';
import { simStateReducer, appStartState } from '../data/reducer.js';
import ControlsLayer from './controls/ControlsLayer';
import RenderMap from './render/RenderMap.js';
import { saveStateToUrl, loadStateFromUrl } from '../data/stateEncoding.js';

function PirateMap() {
  const [simState, modifySimState] = useReducer(simStateReducer, {}, () => loadStateFromUrl() ?? appStartState());

  // useEffect(() => {
  //   saveStateToUrl(simState);
  //   console.log(simState);
  // }, [simState]);

  return (
    <>
      <RenderMap simState={simState} modifySimState={modifySimState} />
      <ControlsLayer simState={simState} modifySimState={modifySimState} />
    </>
  );
}

export default PirateMap;
