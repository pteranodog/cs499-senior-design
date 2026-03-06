import PointIcon from './PointIcon.js';

function PointIcons({ pointList }) {
  return (
    <>
      {pointList.map(point => <PointIcon type={point.type} lat={point.pos[0]} lon={point.pos[1]} name={point.name}/>)}
    </>
  )
}

export default PointIcons;
