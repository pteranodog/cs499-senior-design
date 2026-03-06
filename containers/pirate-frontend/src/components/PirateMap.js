// containers/pirate-frontend/src/components/PirateMap.js

import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useReducer } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { simulationPointsToLeaflet } from '../utils/coords';
import Controls from './controls/Controls';
import ShipIcons from './render/ShipIcons.js';
import PointIcons from './render/PointIcons.js';

import { simStateReducer } from '../data/reducer.js';

const shipList = [
  {type: "pirate", lat: 10, lon: 60},
  {type: "pirate", lat: 11, lon: 59},
  {type: "merchant", lat: 9, lon: 62},
  {type: "merchant", lat: 12, lon: 65},
  {type: "patrol", lat: 8, lon: 59},
  {type: "patrol", lat: 13, lon: 61}
];

// Stable IDs for start-focus selection in Controls.
// TODO: replace this local mapping with API-provided POI IDs once backend data is connected.
// const pointListWithIds = pointList.map((point, index) => ({
//   ...point,
//   id: `${point.type}-${index}`
// }));
// 
const transformConfig = {
  originLat: 34.7190616534629,
  originLon: -86.64664978111168,
  metersPerUnit: 1,
  headingDegrees: 0,
};
// 
// 
// 
// function StartPointFocus({ selectedPoint }) {
//   const map = useMap();
// 
//   useEffect(() => {
//     if (!selectedPoint) {
//       return;
//     }
// 
//     // Skeleton behavior:
//     // 1) Controls chooses a POI by id.
//     // 2) PirateMap resolves it and stores the full point object in state.
//     // 3) This hook focuses the map as soon as that state changes.
//     // TODO: add configurable zoom level, animation duration, and user preference persistence.
//     map.flyTo([selectedPoint.lat, selectedPoint.lon], map.getZoom());
//   }, [map, selectedPoint]);
// 
//   return null;
// }
// 
// const simulationTrack = [
//   { id: 'start', x: 0, y: 0, label: 'Simulation origin (0, 0)' },
//   { id: 'wp1', x: 90, y: 30, label: 'Waypoint 1 (90, 30)' },
//   { id: 'wp2', x: 180, y: 60, label: 'Waypoint 2 (180, 60)' },
//   { id: 'wp3', x: 240, y: -20, label: 'Waypoint 3 (240, -20)' },
// ];

function PirateMap() {
  const [startCenterPoint, setStartCenterPoint] = useState(null);
  const [simState, updateSim] = useReducer({}, simStateReducer, (state) => simStateReducer(state, {type: 'initialize'}));
  // const mappedTrack = simulationPointsToLeaflet(simulationTrack, transformConfig);
  // const polylinePoints = mappedTrack.map(({ latLng }) => [latLng.lat, latLng.lng]);

  useEffect(() => {
    console.log(simState);
  }, []);

  return (
    <MapContainer
      style={{ position: 'absolute', width: '100%', height: '100%' }}
      center={[transformConfig.originLat, transformConfig.originLon]}
      zoom={16}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Origin marker */}
      <Marker position={[transformConfig.originLat, transformConfig.originLon]}>
        <Popup>Simulation Origin</Popup>
      </Marker>

      {simState.display.type === 'region' ? <PointIcons pointList={Object.values(simState.regions[simState.display.index].points)} /> : <></>}
      <ShipIcons shipList={shipList}/>
      
      {/* Track line */}
      {/*
      <Polyline positions={polylinePoints} />
      */}
      {/* Markers for each simulation point */}
      {/*
      {mappedTrack.map((point) => (
        <Marker key={point.id} position={[point.latLng.lat, point.latLng.lng]}>
          <Popup>
            <strong>{point.label}</strong>
            <br />
            Sim XY: ({point.x}, {point.y})
            <br />
            Lat/Lon: {point.latLng.lat.toFixed(6)}, {point.latLng.lng.toFixed(6)}
          </Popup>
        </Marker>
      ))}
      
      <StartPointFocus selectedPoint={startCenterPoint} />
      */}

      {/* Controls that float above the map in the top right */}
      <Controls/>
      {/*
      <Controls
        pointsOfInterest={pointListWithIds}
        onStartCenterPointChange={setStartCenterPoint}
      /> 
      */}
    </MapContainer>
  );
}

export default PirateMap;
