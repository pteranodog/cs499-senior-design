// containers/pirate-frontend/src/components/PirateMap.jsx

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { simulationPointsToLeaflet } from '../utils/coords';
import Controls from './controls/Controls';
import ShipIcons from './render/ShipIcons.js';
import PointIcons from './render/PointIcons.js';

const shipList = [
  {type: "pirate", lat: 10, lon: 60},
  {type: "pirate", lat: 11, lon: 59},
  {type: "merchant", lat: 9, lon: 62},
  {type: "merchant", lat: 12, lon: 65},
  {type: "patrol", lat: 8, lon: 59},
  {type: "patrol", lat: 13, lon: 61}
];

const pointList = [
  {type: "port", lat: 31.268591553342564, lon: 32.3080159013517, name: "Port Said (Egypt)"},
  {type: "port", lat: -4.0717176235876895, lon: 39.67302089897652, name: "Mombasa (Kenya)"},
  {type: "port", lat: -6.764025272071542, lon: 39.27479457164424, name: "Dar es Salaam (Tanzania)"},
  {type: "port", lat: 11.604819989415411, lon: 43.14977135115654, name: "Djibouti"},
  {type: "pirateCove", lat: 11.170546041737072, lon: 47.404807848330168},
  {type: "pirateCove", lat: 5.065907743093423, lon: 48.297863487974084},
  {type: "patrolBase", lat: 11.543419592150114, lon: 43.17903502125963, name: "Camp Lemonnier (U.S.A.)"}
]

const transformConfig = {
  originLat: 34.7190616534629,
  originLon: -86.64664978111168,
  metersPerUnit: 1,
  headingDegrees: 0,
};

const simulationTrack = [
  { id: 'start', x: 0, y: 0, label: 'Simulation origin (0, 0)' },
  { id: 'wp1', x: 90, y: 30, label: 'Waypoint 1 (90, 30)' },
  { id: 'wp2', x: 180, y: 60, label: 'Waypoint 2 (180, 60)' },
  { id: 'wp3', x: 240, y: -20, label: 'Waypoint 3 (240, -20)' },
];

function PirateMap() {
  const mappedTrack = simulationPointsToLeaflet(simulationTrack, transformConfig);
  const polylinePoints = mappedTrack.map(({ latLng }) => [latLng.lat, latLng.lng]);

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

      <PointIcons pointList={pointList}/>
      <ShipIcons shipList={shipList}/>
      
      {/* Track line */}
      <Polyline positions={polylinePoints} />

      {/* Markers for each simulation point */}
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
      
      {/* Controls that float above the map in the top right */}
      <Controls/>
    </MapContainer>
  );
}

export default PirateMap;