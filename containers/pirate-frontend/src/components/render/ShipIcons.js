import ShipIcon from './ShipIcon.js';
import { cartesianToLatLng } from '../../utils/coords.js';

function ShipIcons({ shipList, regionCenter }) { // NEW: pass down region center for coord conversion
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
          />
        );
      })}
    </>
  );
}

export default ShipIcons;
