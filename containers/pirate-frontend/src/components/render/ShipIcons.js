// MERGE NOTE: replaced this whole file with version from my branch, i dont think it will break things since 
// my changes mainly just adjusted to new coord stuff -ljj
import { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import ShipIcon from './ShipIcon.js';
import { cartesianToLatLng } from '../../utils/coords.js';

function ShipIcons({ shipList, regionCenter }) {
  const [zoom, setZoom] = useState(4);

  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });

  return (
    <>
      {shipList.map((ship, index) => {
        const { lat, lng } = cartesianToLatLng(ship.pos[0], ship.pos[1], {
          originLat: regionCenter[0],
          originLon: regionCenter[1],
          metersPerUnit: 1,
          headingDegrees: 0,
        });
        return (
          <ShipIcon
            key={ship.id || `${ship.type}-${index}-${lat}-${lng}`}
            type={ship.type}
            lat={lat}
            lon={lng}
            zoom={zoom}
          />
        );
      })}
    </>
  );
}

export default ShipIcons;
