function formatClock(hourValue, minuteValue) {
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return '00:00';
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getCurrentSimClock(startHour, startMinute, elapsedTicks, ticksPerMinute) {
  const hour = Number(startHour);
  const minute = Number(startMinute);
  const safeTicksPerMinute = Math.max(Number(ticksPerMinute) || 1, 1);
  const elapsedMinutes = Math.floor((Number(elapsedTicks) || 0) / safeTicksPerMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return { hour: 0, minute: 0 };
  }

  const totalMinutes = (((hour * 60) + minute + elapsedMinutes) % (24 * 60) + (24 * 60)) % (24 * 60);

  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

function getTimeOfDay(hourValue) {
  const hour = Number(hourValue);
  if (!Number.isFinite(hour)) {
    return 'Day';
  }
  return hour >= 6 && hour < 18 ? 'Day' : 'Night';
}

export default function StatusDisplay({ simState, runID, elapsedTicks = 0, ticksPerMinute = 1 }) {
  const run = typeof runID === 'number'
    ? simState?.runs?.[runID]
    : simState?.runs?.find((candidate) => candidate?.uuid === runID);

  if (!run) {
    return null;
  }

  const region = simState?.regions?.[run.regionId];
  const startTime = formatClock(run.startHour, run.startMinute);
  const currentSimClock = getCurrentSimClock(run.startHour, run.startMinute, elapsedTicks, ticksPerMinute);
  const timeOfDay = getTimeOfDay(currentSimClock.hour);
  const backgroundColor = timeOfDay === 'Day' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(33, 37, 41, 0.92)';
  const textColor = timeOfDay === 'Day' ? '#212529' : '#f8f9fa';
  const secondaryColor = timeOfDay === 'Day' ? '#6c757d' : 'rgba(248, 249, 250, 0.75)';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 12,
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
        <div><strong>Start Time:</strong> {startTime}</div>
        <div><strong>Sim Clock:</strong> {formatClock(currentSimClock.hour, currentSimClock.minute)}</div>
        <div><strong>Mode:</strong> {timeOfDay}</div>
        <div><strong>Duration:</strong> {run.duration || 0} hours</div>
        <div><strong>Region:</strong> {region?.name || 'n/a'}</div>
        {/* <div><strong>Weather:</strong> {run.weatherType || 'n/a'}</div> TODO: Weather temporarily removed */}
        <div><strong>Merchants per Day:</strong> {run.maxMerchants ?? 0}</div>
        <div><strong>Pirates per Day:</strong> {run.maxPirates ?? 0}</div>
        <div><strong>Total Security:</strong> {run.maxPatrols ?? 0}</div>
      </div>
    </div>
  );
}
