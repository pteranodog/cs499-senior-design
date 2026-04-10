import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function ShipIcons({ type, lat, lon }) {
  // For now we'll just set marker text using type, later we'll switch it to show different icons
  var markerText = "Unknown vessel type!";
  if (type === "pirate") {
    markerText = "This is a pirate!";
  } else if (type === "merchant") {
    markerText = "This is a merchant!";
  } else if (type === "patrol") {
    markerText = "This is a patrol vessel!";
  }

  const iconMap = {
    pirate: L.icon({
      iconUrl: '/pirate-icon.png',
      iconSize: [52, 40],
      iconAnchor: [26, 40],
      popupAnchor: [7, -35]
    }),
    merchant: L.icon({
      iconUrl: '/merchant-icon.png',
      iconSize: [81, 25],
      iconAnchor: [41, 25],
      popupAnchor: [-7, -15]
    }),
    patrol: L.icon({
      iconUrl: '/patrol-icon.png',
      iconSize: [70, 40],
      iconAnchor: [35, 40],
      popupAnchor: [-5, -35]
    }),
    default: L.icon({
      iconUrl: '/boat-icon.png',
      iconSize: [60, 60],
      iconAnchor: [26, 40],
      popupAnchor: [-14, -25]
    })
  };

  const shipIcon = iconMap[type]|| iconMap.default;
  return (
    <Marker position={[lat, lon]} icon={shipIcon}>
      <Popup>
        {markerText}
      </Popup>
    </Marker>
  )
}

export default ShipIcons;
