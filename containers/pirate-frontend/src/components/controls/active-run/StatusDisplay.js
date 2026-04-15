function formatSimulatedClock(startHour, startMinute) {
  const hour = Number(startHour);
  const minute = Number(startMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return '00:00';
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getTimeOfDay(startHour) {
  const hour = Number(startHour);
  if (!Number.isFinite(hour)) {
    return 'Day';
  }
  return hour >= 6 && hour < 18 ? 'Day' : 'Night';
}

export default function StatusDisplay({ simState, runID }) {
  const run = typeof runID === 'number'
    ? simState?.runs?.[runID]
    : simState?.runs?.find((candidate) => candidate?.uuid === runID);

  if (!run) {
    return null;
  }

  const region = simState?.regions?.[run.regionId];
  const timeOfDay = getTimeOfDay(run.startHour);
  const backgroundColor = timeOfDay === 'Day' ? 'rgba(33, 37, 41, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const textColor = timeOfDay === 'Day' ? '#f8f9fa' : '#212529';
  const secondaryColor = timeOfDay === 'Day' ? 'rgba(248, 249, 250, 0.75)' : '#6c757d';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 84,
        left: 12,
        zIndex: 1000,
        minWidth: 260,
        borderRadius: 12,
        padding: '0.75rem 0.9rem',
        backgroundColor,
        color: textColor,
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', color: secondaryColor }}>
          STATUS
        </div>
      </div>

      <div style={{ marginTop: '0.35rem' }}>
        <div><strong>Sim Name:</strong> {run.name || 'n/a'}</div>
        <div><strong>Sim Clock:</strong> {formatSimulatedClock(run.startHour, run.startMinute)}</div>
        <div><strong>Mode:</strong> {timeOfDay}</div>
        <div><strong>Duration:</strong> {run.duration || 0} minutes</div>
        <div><strong>Region:</strong> {region?.name || 'n/a'}</div>
        {/* <div><strong>Weather:</strong> {run.weatherType || 'n/a'}</div> TODO: Weather temporarily removed */}
        <div><strong>Merchants per Day:</strong> {run.maxMerchants ?? 0}</div>
        <div><strong>Pirates per Day:</strong> {run.maxPirates ?? 0}</div>
        <div><strong>Total Security:</strong> {run.maxPatrols ?? 0}</div>
      </div>
    </div>
  );
}
