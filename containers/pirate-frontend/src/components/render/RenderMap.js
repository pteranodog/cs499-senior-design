import RunDisplay from './RunDisplay';
import RegionDisplay from './RegionDisplay';

export default function RenderMap({ simState, modifySimState }) {
  const { type, index } = simState.display;

  if (type === 'run') {
    return <RunDisplay simState={simState} run={simState.runs[index]}/>;
  }
  if (type === 'region') {
    return <RegionDisplay simState={simState} region={simState.regions[index]} />;
  }

  return null;
}
