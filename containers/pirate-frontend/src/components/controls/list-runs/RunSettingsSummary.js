export default function RunSettingsSummary({ runSettings, regions, warning }) {
  const region = (regions || {})[runSettings.regionId];

  // Format start time
  const startHour = String(runSettings.startHour).padStart(2, '0');
  const startMinute = String(runSettings.startMinute).padStart(2, '0');

  // Compute risk level
  const computeRisk = () => {
    const risk = runSettings.maxPirates - runSettings.maxPatrols;
    if (risk > 5) return 'High';
    if (risk > 0) return 'Medium';
    return 'Low';
  };

  // Pull stats safely (for completed runs)
  const stats = runSettings?.currentState?.stats ?? {};

  const captures = Number(stats.captures ?? 0);
  const rescues = Number(stats.rescues ?? 0);
  const sinks = Number(stats.sinks ?? 0);
  const totalPirateEncounters = Number(stats.totalPirateEncounters ?? 0);

  return (
    <div className="d-flex flex-column gap-2">

      {/* Top Info Boxes */}
      <div className="d-flex flex-wrap gap-2">
        {[
          { label: 'Start', value: `${startHour}:${startMinute}` },
          { label: 'Duration', value: `${runSettings.duration} Hrs` },
          { label: 'Region', value: region?.name ?? runSettings.regionId },
        ].map(({ label, value }) => (
          <div key={label} className="border border-secondary rounded px-2 py-1 small">
            <span className="text-secondary me-1">{label}:</span>
            <span className="text-light">{value}</span>
          </div>
        ))}
      </div>

      {/* Daily Stats */}
      <div className="d-flex gap-2">
        {[
          { label: 'Merchants / Day', value: runSettings.maxMerchants, color: 'text-info' },
          { label: 'Pirates / Day',   value: runSettings.maxPirates,   color: 'text-danger' },
          { label: 'Patrols',         value: runSettings.maxPatrols,   color: 'text-success' },
          { label: 'Risk Level',      value: computeRisk(),            color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-secondary rounded px-2 py-1 small flex-fill text-center">
            <div className={`${color} fw-bold`}>{value}</div>
            <div className="text-secondary">{label}</div>
          </div>
        ))}
      </div>

      {/* Totals Over Run */}
      <div className="d-flex gap-2">
        <div className="border border-secondary rounded px-2 py-1 small flex-fill text-center">
          <div className="fw-bold text-light">
            {runSettings.duration * runSettings.maxMerchants}
          </div>
          <div className="text-secondary">Total Merchants</div>
        </div>

        <div className="border border-secondary rounded px-2 py-1 small flex-fill text-center">
          <div className="fw-bold text-light">
            {runSettings.duration * runSettings.maxPirates}
          </div>
          <div className="text-secondary">Total Pirates</div>
        </div>
      </div>

      {/* Simulation Results (NEW) */}
      <div className="d-flex gap-2">
        {[
          { label: 'Captures', value: captures, color: 'text-danger' },
          { label: 'Rescues', value: rescues, color: 'text-success' },
          { label: 'Sinks', value: sinks, color: 'text-warning' },
          { label: 'Encounters', value: totalPirateEncounters, color: 'text-info' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-secondary rounded px-2 py-1 small flex-fill text-center">
            <div className={`${color} fw-bold`}>{value}</div>
            <div className="text-secondary">{label}</div>
          </div>
        ))}
      </div>

      {/* Warning */}
      {warning && (
        <div className="alert alert-warning py-1 px-2 small mb-0">
          ⚠️ {warning}
        </div>
      )}
    </div>
  );
}
