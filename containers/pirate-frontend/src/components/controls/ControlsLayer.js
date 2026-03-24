import RunMenu from './list-runs/RunMenu';
import RunControls from './active-run/RunControls';
import SimEndControls from './end-run/SimEndControls';

export default function ControlsLayer({ simState, modifySimState }) {
  const { type, index } = simState.controls;

  if (type === 'list-runs') {
    return <RunMenu simState={simState} modifySimState={modifySimState} />;
  }
  if (type === 'active-run') {
    return <RunControls simState={simState} modifySimState={modifySimState} runID={index} />;
  }
  if (type === 'end-run') {
    return <SimEndControls simState={simState} modifySimState={modifySimState} runID={index} />;
  }

  return null;
}
