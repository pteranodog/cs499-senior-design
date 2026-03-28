import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';

export default function RunSettingsControls({ runSettings, regions, modifyRun, modifyRatios, modifyRegion }) {
  const minDuration = 30;
  const maxDuration = 4800;

  return (
    <div className="d-flex flex-column gap-2">
      {/*
      // TODO: RANDOM SEED MODIFICATION
      // TODO: Normal DateTime instead of Hour:Minute? Might be easier
      */}
      <div className="d-flex gap-2 align-items-center">
        <FloatingLabel label="Hour (HH)" className="floating-dark flex-fill">
          <Form.Control
            size="sm" type="number" placeholder="HH" min="0" max="23"
            className="bg-dark text-light border-secondary"
            value={runSettings.startHour}
            onChange={(e) => modifyRun('startHour', e.target.value)}
          />
        </FloatingLabel>
        <span className="text-light">:</span>
        <FloatingLabel label="Min (MM)" className="floating-dark flex-fill">
          <Form.Control
            size="sm" type="number" placeholder="MM" min="0" max="59"
            className="bg-dark text-light border-secondary"
            value={runSettings.startMinute}
            onChange={(e) => modifyRun('startMinute', e.target.value)}
          />
        </FloatingLabel>
      </div>

      <FloatingLabel label="Duration (minutes)" className="floating-dark">
        <Form.Control
          size="sm" type="number" placeholder="Duration"
          min={minDuration} max={maxDuration}
          className="bg-dark text-light border-secondary"
          value={runSettings.duration}
          onChange={(e) => modifyRun('duration', e.target.value)}
        />
      </FloatingLabel>
      {runSettings.duration !== '' && Number(runSettings.duration) < minDuration && (
        <div className="text-danger small">Min {minDuration} minutes</div>
      )}
      {runSettings.duration !== '' && Number(runSettings.duration) > maxDuration && (
        <div className="text-danger small">Max {maxDuration} minutes</div>
      )}

      <FloatingLabel label="Region" className="floating-dark">
        <Form.Select size="sm" className="bg-dark text-light border-secondary"
          value={runSettings.regionId}
          onChange={(e) => modifyRegion(e.target.value)}
          data-testid="region-select"
        >
          {Object.entries(regions || {}).map(([regionId, region]) => (
            <option key={regionId} value={regionId}>{region.name}</option>
          ))}
        </Form.Select>
      </FloatingLabel>

      <FloatingLabel label="Weather Condition" className="floating-dark">
        <Form.Select size="sm" className="bg-dark text-light border-secondary"
          value={runSettings.weatherType}
          onChange={(e) => modifyRun('weatherType', e.target.value)}
          data-testid="weather"
        >
          <option value="clear">Clear</option>
          <option value="storm">Storm</option>
          <option value="fog">Fog</option>
        </Form.Select>
      </FloatingLabel>

      {[
        { id: 'maxMerchants', label: 'Merchant' },
        { id: 'maxPirates',   label: 'Pirates'  },
        { id: 'maxPatrols',   label: 'Security' },
      ].map(({ id, label }) => (
        <div key={id} className="d-flex align-items-center gap-2">
          <Form.Label className="floating-dark small mb-0 text-nowrap" style={{ width: '120px' }}>
            {label}: {runSettings[id]}%
          </Form.Label>
          <Form.Range
            className="flex-fill mb-0"
            min="0" max="100"
            value={runSettings[id]}
            onChange={(e) => modifyRatios(id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
