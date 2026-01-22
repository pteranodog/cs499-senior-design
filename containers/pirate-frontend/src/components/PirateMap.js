import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function PirateMap() {
  return (
    <MapContainer style={{position: "absolute", width: "100%", height: "100%"}} center={[34.7190616534629, -86.64664978111168]} zoom={13}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[34.7190616534629, -86.64664978111168]}>
        <Popup>
          CS499 - Senior Design
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default PirateMap;
