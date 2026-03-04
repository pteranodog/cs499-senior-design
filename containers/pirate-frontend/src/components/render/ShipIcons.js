import ShipIcon from './ShipIcon.js';

function ShipIcons({ shipList }) {
  return (
    <>
      {shipList.map((ship, index) => (
        <ShipIcon
          key={ship.id || `${ship.type}-${index}-${ship.lat}-${ship.lon}`}
          type={ship.type}
          lat={ship.lat}
          lon={ship.lon}
        />
      ))}
    </>
  );
}

export default ShipIcons;
