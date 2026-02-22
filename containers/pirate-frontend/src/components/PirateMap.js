import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Controls from './controls/Controls';
import ShipIcons from './render/ShipIcons.js';
import PointIcons from './render/PointIcons.js';

function PirateMap() {
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

      <PointIcons pointList={pointList}/>
      <ShipIcons shipList={shipList}/>

      {/* Controls that float above the map in the top right */}
      <Controls/>
    </MapContainer>
  )
}

export default PirateMap;
