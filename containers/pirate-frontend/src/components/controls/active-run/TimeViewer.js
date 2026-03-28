import Card from 'react-bootstrap/Card';

export default function TimeViewer({ seconds }) {
  const formatTime = (value) => {
    const hrs = String(Math.floor(value / 3600)).padStart(2, '0');
    const mins = String(Math.floor((value % 3600) / 60)).padStart(2, '0');
    const secs = String(value % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <Card
      bg="light"
      text="dark"
      className="p-2 small"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <div><strong>Time Elapsed:</strong> {formatTime(seconds)}</div>
    </Card>
  );
}
