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
    pirate: '/pirate-icon.png',
    merchant: '/merchant-icon.png',
    patrol: '/patrol-icon.png'
  };

  const shipIcon = L.icon({
    iconUrl: iconMap[type] || 'boat-icon.png',
    iconSize: [40, 40],
    shadowSize: [40, 40],
    iconAnchor: [0, 0],
    shadowAnchor: [0, 0],
    popupAnchor: [10, 10]
  })

  return (
    <Marker position={[lat, lon]} icon={shipIcon}>                                                         
      <Popup>                                                                                                          
        {markerText}
      </Popup>                                                                                                         
    </Marker>
  )
}

export default ShipIcons;
