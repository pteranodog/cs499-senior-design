import ShipIcon from './ShipIcon.js';

function ShipIcons({ shipList }) {
  return (
    <>
      {shipList.map(ship => <ShipIcon type={ship.type} lat={ship.lat} lon={ship.lon}/>)}
    </>
  )
}

export default ShipIcons;
