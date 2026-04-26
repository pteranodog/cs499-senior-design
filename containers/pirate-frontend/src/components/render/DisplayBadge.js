import { getTimeOfDayInfo } from '../../utils/timeOfDay.js';

export default function DisplayBadge({ simState }) {
  let emoji = '🗺️';
  let primary;
  let secondary;
  let timeOfDay = 'Day';

  if (simState.display.type === 'region') {
    const region = simState.regions[simState.display.index];
    if (!region) return null;
    primary = region.name;
    emoji = '🗺️';
  } else if (simState.display.type === 'run') {
    const run = simState.runs[simState.display.run];
    if (!run) return null;
    const region = simState.regions[run.regionId];
    emoji = '🏴\u200d☠️';
    primary = run.name;
    secondary = region?.name ?? null;
    timeOfDay = getTimeOfDayInfo({
      regionName: region?.name,
      startHour: run.startHour,
      startMinute: run.startMinute,
      elapsedTicks: run.elapsedTime || 0,
      ticksPerMinute: run.ticksPerMinute || 1,
    }).label;
  } else {
    return null;
  }

  const isNight = timeOfDay === 'Night';

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      padding: '0.5rem 0.9rem',
      borderRadius: '999px',
      backgroundColor: isNight ? 'rgba(11, 20, 36, 0.86)' : 'rgba(255,255,255,0.90)',
      color: isNight ? '#f8f9fa' : '#222',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      boxShadow: '0 0 20px rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      <span>{emoji}</span>
      <span>{primary}</span>
      {secondary && <>
        <span style={{ fontWeight: 400, color: isNight ? 'rgba(248, 249, 250, 0.7)' : '#555' }}>|</span>
        <span style={{ fontWeight: 400 }}>{secondary}</span>
      </>}
    </div>
  );
}
