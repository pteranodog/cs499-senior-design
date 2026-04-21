import { formatHourMinute, getTimeOfDayInfo } from '../Controls';

export default function StatusDisplay({ simState, runID, elapsedTicks = 0, ticksPerMinute = 1 }) {
  const run = typeof runID === 'number'
    ? simState?.runs?.[runID]
    : simState?.runs?.find((candidate) => candidate?.uuid === runID);

  if (!run) {
    return null;
  }

  const region = simState?.regions?.[run.regionId];
  const startTime = formatHourMinute(run.startHour, run.startMinute);
  const currentTimeInfo = getTimeOfDayInfo({
    regionName: region?.name,
    startHour: run.startHour,
    startMinute: run.startMinute,
    elapsedTicks,
    ticksPerMinute,
  });
  const timeOfDay = currentTimeInfo.label;
  const backgroundColor = 'rgba(255, 255, 255, 0.92)';
  const textColor = '#212529';
  const secondaryColor = '#6c757d';

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
        <div><strong>Sim Clock:</strong> {currentTimeInfo.clockLabel}</div>
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
