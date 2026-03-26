import PointIcon from './PointIcon.js';

function PointIcons({ pointList }) {
  return (
    <>
      {pointList.map((point, index) => (
        <PointIcon
          key={point.id || `${point.type}-${index}-${point.pos[0]}-${point.pos[1]}`}
          type={point.type}
          lat={point.pos[0]}
          lon={point.pos[1]}
          name={point.name}
        />
      ))}
    </>
  );
}

export default PointIcons;
