export default function RunSettingsSummary({ runSettings, regions, warning }) {
  const region = (regions || {})[runSettings.regionId];

  return (
    <div className="d-flex flex-column gap-2">
      <div className="d-flex flex-wrap gap-2">
        {[
          { label: 'Start',    value: `${String(runSettings.startHour).padStart(2,'0')}:${String(runSettings.startMinute).padStart(2,'0')}` },
          { label: 'Duration', value: `${runSettings.duration} min` },
          { label: 'Region',   value: region?.name ?? runSettings.regionId },
          { label: 'Weather',  value: runSettings.weatherType },
        ].map(({ label, value }) => (
          <div key={label} className="border border-secondary rounded px-2 py-1 small">
            <span className="text-secondary me-1">{label}:</span>
            <span className="text-light">{value}</span>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2">
        {[
          { label: 'Merchants per Day', value: runSettings.maxMerchants, color: 'text-info'    },
          { label: 'Pirates per Day',   value: runSettings.maxPirates,   color: 'text-danger'  },
          { label: 'Total Security',  value: runSettings.maxPatrols,   color: 'text-success' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-secondary rounded px-2 py-1 small flex-fill text-center">
            <div className={`${color} fw-bold`}>{value}</div>
            <div className="text-secondary">{label}</div>
          </div>
        ))}
      </div>

      {warning && <div className="alert alert-warning py-1 px-2 small mb-0">
        ⚠️ {warning}
      </div>
      }
    </div>
  );
}
