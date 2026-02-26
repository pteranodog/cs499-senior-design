import PointIcon from './PointIcon.js';

function PointIcons({ pointList }) {
  return (
    <>
      {pointList.map(point => <PointIcon type={point.type} lat={point.lat} lon={point.lon} name={point.name}/>)}
    </>
  )
}

export default PointIcons;
