import Card from 'react-bootstrap/Card';

const MAP_CONTROL_CLEARANCE = 44;

export default function TimeViewer({ elapsedTicks = 0, ticksPerMinute = 1 }) {
  const formatTime = (ticks, minuteTickRate) => {
    const safeTicksPerMinute = Math.max(Number(minuteTickRate) || 1, 1);
    const totalMinutes = Math.floor((Number(ticks) || 0) / safeTicksPerMinute);
    const hrs = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mins = String(totalMinutes % 60).padStart(2, '0');
    const secs = '00';
    return `${hrs}:${mins}`;
  };

  return (
    <Card
      bg="light"
      text="dark"
      className="p-2 small"
      style={{
        position: 'absolute',
        top: 12,
        right: MAP_CONTROL_CLEARANCE,
        zIndex: 1000,
      }}
    >
      <div><strong>Time Elapsed:</strong> {formatTime(elapsedTicks, ticksPerMinute)}</div>
    </Card>
  );
}
