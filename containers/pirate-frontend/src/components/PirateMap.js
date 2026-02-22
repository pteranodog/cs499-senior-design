// containers/pirate-frontend/src/components/PirateMap.jsx

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { simulationPointsToLeaflet } from '../utils/coords';

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
    </MapContainer>
  );
}

export default PirateMap;