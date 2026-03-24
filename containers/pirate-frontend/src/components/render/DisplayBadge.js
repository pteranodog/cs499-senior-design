export default function DisplayBadge({ simState }) {
  const { type, index } = simState.display;

  let emoji, primary, secondary;

  if (type === 'region') {
    const region = simState.regions[index];
    if (!region) return null;
    emoji = '🗺️';
    primary = region.name;
    secondary = null;
  } else if (type === 'run') {
    const run = simState.runs[index];
    if (!run) return null;
    const region = simState.regions[run.regionId];
    emoji = '🏴‍☠️';
    primary = run.name;
    secondary = region?.name ?? null;
  } else {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      padding: '0.5rem 0.9rem',
      borderRadius: '999px',
      backgroundColor: 'rgba(255,255,255,0.90)',
      color: '#222',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      boxShadow: '0 0 20px rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {emoji}
      <span>{primary}</span>
      {secondary && <>
        <span style={{ fontWeight: 400, color: '#555' }}>·</span>
        <span style={{ fontWeight: 400 }}>{secondary}</span>
      </>}
    </div>
  );
}
