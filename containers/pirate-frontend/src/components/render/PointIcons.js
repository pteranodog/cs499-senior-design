import PointIcon from './PointIcon.js';

function PointIcons({ pointList }) {
  return (
    <>
      {pointList.map((point, index) => (
        <PointIcon
          key={point.id || `${point.type}-${index}-${point.lat}-${point.lon}`}
          type={point.type}
          lat={point.lat}
          lon={point.lon}
          name={point.name}
        />
      ))}
    </>
  );
}

export default PointIcons;
