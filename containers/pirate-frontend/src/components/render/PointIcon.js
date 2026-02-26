import { Marker, Popup } from 'react-leaflet';

function PointIcons({ type, lat, lon, name }) {
  // For now we'll just set marker text using type, later we'll switch it to show different icons
  var markerText = "Unknown point type!";
  if (type === "port") {
    markerText = "This is a port!";
  } else if (type === "pirateCove") {
    markerText = "This is a pirate cove!";
  } else if (type === "patrolBase") {
    markerText = "This is a patrol base!";
  }
  if (name) {
    markerText = name;
  }

  return (
    <Marker position={[lat, lon]}>                                                         
      <Popup>                                                                                                          
        {markerText}
      </Popup>                                                                                                         
    </Marker>
  )
}

export default PointIcons;
