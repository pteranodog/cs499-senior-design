import 'leaflet/dist/leaflet.css';
import { MapContainer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import RunDisplay from './RunDisplay';
import RegionDisplay from './RegionDisplay';
import DisplayBadge from './DisplayBadge';

const transformConfig = {
  originLat: 0,
  originLon: 0,
};

function MapResizeHandler({ controlsType }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 10);
  }, [controlsType, map]);
  return null;
}

function SingleMap({ simState, modifySimState, style }) {
  const { type, index } = simState.display;
  const controlsHasSidePanel = simState.controls.type === 'list-runs' || simState.controls.type === 'end-run';

  return (
    <div style={style ?? {
      position: 'absolute',
      top: 0,
      left: controlsHasSidePanel ? '600px' : '0',
      width: controlsHasSidePanel ? 'calc(100% - 600px)' : '100%',
      height: '100%',
    }}>
      <MapContainer
        key={`${simState.controls.type}-${type}-${index}`}
        style={{ width: '100%', height: '100%' }}
        center={[transformConfig.originLat, transformConfig.originLon]}
        zoom={4}
      >
        <MapResizeHandler controlsType={simState.controls.type} />
        <DisplayBadge simState={simState} />
        {type === 'run'    && <RunDisplay    simState={simState} run={simState.runs[index]} />}
        {type === 'region' && <RegionDisplay simState={simState} region={simState.regions[index]} />}
      </MapContainer>
    </div>
  );
}

function CompareMap({ simState, modifySimState, runIndex, side }) {
  const run = simState.runs[runIndex];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: side === 'left' ? '0' : '50%',
      width: '50%',
      height: '100%',
    }}>
      <MapContainer
        key={run?.uuid || `empty-${side}`}
        style={{ width: '100%', height: '100%' }}
        center={[transformConfig.originLat, transformConfig.originLon]}
        zoom={4}
      >
        <MapResizeHandler controlsType={simState.controls.type} />
        {run && (
          <>
            <RunDisplay simState={simState} run={run} />
            <DisplayBadge simState={{ ...simState, display: { type: 'run', index: runIndex } }} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default function RenderMap({ simState, modifySimState }) {
  if (simState.controls.type === 'compare-runs') {
    return (
      <>
        <CompareMap simState={simState} modifySimState={modifySimState} runIndex={simState.controls.runA} side="left" />
        <CompareMap simState={simState} modifySimState={modifySimState} runIndex={simState.controls.runB} side="right" />
      </>
    );
  }

  return <SingleMap simState={simState} modifySimState={modifySimState} />;
}
