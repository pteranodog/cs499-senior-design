import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Controls from './controls/Controls';

function PirateMap() {
  return (
    <MapContainer style={{position: "absolute", width: "100%", height: "100%"}} center={[34.7190616534629, -86.64664978111168]} zoom={13}>
      {/* Base layer source. Maybe update later to include additional options? */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* A marker at the location of the Senior Design Class (EXAMPLE ONLY - REMOVE LATER) */}
      <Marker position={[34.7190616534629, -86.64664978111168]}>
        <Popup>
          CS499 - Senior Design
        </Popup>
      </Marker>

      {/* Controls that float above the map in the top right */}
      <Controls/>
    </MapContainer>
  )
}

export default PirateMap;
