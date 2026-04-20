export default function RunSettingsSummary({ runSettings, regions, warning }) {
  const region = (regions || {})[runSettings.regionId];

  // Format start time
  const startHour = String(runSettings.startHour).padStart(2, '0');
  const startMinute = String(runSettings.startMinute).padStart(2, '0');

  // Compute risk level
  const computeRisk = () => {
    const risk = runSettings.maxPirates - runSettings.maxPatrols;
    if (risk > 6) return 'High';
    if (risk >= 3) return 'Medium';
    return 'Low';
  };

  // Pull stats safely (for completed runs)
  const stats = runSettings?.currentState?.stats ?? {};

  const shipCounts = stats.shipCounts ?? {};
  const ships = stats.ships ?? [];

  const captures = Number(stats.captures ?? 0);
  const rescues = Number(stats.rescues ?? 0);
  const sinks = Number(stats.sinks ?? 0);

  const totalPirateEncounters = Number(stats.totalPirateEncounters ?? 0);
  const merchantPirateEncounters = Number(stats.merchantPirateEncounters ?? 0);
  const patrolPirateEncounters = Number(stats.patrolPirateEncounters ?? 0);
  const evasions = Number(stats.evasions ?? 0);

  const merchantEncounterChance = Number(stats.merchantEncounterChance ?? 0);

  return (
    <div className="d-flex flex-column gap-2">

      {/* Top Info Boxes */}
      <div className="d-flex flex-wrap gap-2">
        {[
          { label: 'Start', value: `${startHour}:${startMinute}` },
          { label: 'Duration', value: `${runSettings.duration} Hrs` },
          { label: 'Region', value: region?.name ?? runSettings.regionId },
          { label: 'Merchants / Day', value: runSettings.maxMerchants },
          { label: 'Pirates / Day', value: runSettings.maxPirates },
          { label: 'Patrols', value: runSettings.maxPatrols },
          { label: 'Risk Level', value: computeRisk() },
        ].map(({ label, value }) => (
          <div key={label} className="border border-secondary rounded px-2 py-1 small">
            <span className="text-secondary me-1">{label}:</span>
            <span className="text-light">{value}</span>
          </div>
        ))}
      </div>

      {/* Simulation Summary */}
      <div className="d-flex gap-2 flex-wrap">
        {[          
          // Outcomes
          { label: 'Captures', value: captures, color: 'text-danger' },
          { label: 'Rescues', value: rescues, color: 'text-success' },
          { label: 'Sinks', value: sinks, color: 'text-warning' },

          // Interactions
          { label: 'Encounters', value: totalPirateEncounters, color: 'text-info' },
          { label: 'M-P Enc', value: merchantPirateEncounters },
          { label: 'P-P Enc', value: patrolPirateEncounters },
          { label: 'Evasions', value: evasions },

          // Rate
          { label: 'Encounter %', value: `${merchantEncounterChance}%`, color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="border border-secondary rounded px-2 py-1 small text-center"
            style={{ minWidth: '90px' }}
          >
            <div className={`fw-bold ${color ?? 'text-light'}`}>
              {value}
            </div>
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
