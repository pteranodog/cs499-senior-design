import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';

export default function RunSettingsControls({ runSettings, regions, modifyRun, modifyRatios, modifyRegion }) {
  const minDuration = 24;

  const handleDurationChange = (e) => {

    modifyRun('duration', e.target.value);
  };

  const handleDurationBlur = (e) => {
    const value = runSettings.duration;

    if (value === '' || value === null || value === undefined) {
      modifyRun('duration', String(minDuration));
      return;
    }

    const num = Number(value);

    if (Number.isNaN(num) || num < minDuration) {
      modifyRun('duration', String(minDuration));
    }
    else {
      modifyRun('duration', String(num));
    }
  };

  return (
    <div className="d-flex flex-column gap-2">
      {/*
      // TODO: Normal DateTime instead of Hour:Minute? Might be easier
      */}
      <FloatingLabel label="Random Seed" className="floating-dark">
        <Form.Control
          size="sm" 
          type="number" 
          placeholder="Random Seed"
          className="bg-dark text-light border-secondary"
          value={runSettings.seed}
          onChange={(e) => modifyRun('seed', e.target.value)}
        />
      </FloatingLabel>

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

      <FloatingLabel label="Duration (hours)" className="floating-dark">
        <Form.Control
          size="sm" 
          type="number" 
          placeholder="Duration"
          min={minDuration} 
          className="bg-dark text-light border-secondary"
          value={runSettings.duration}
          onChange={handleDurationChange}
          onBlur={handleDurationBlur}

        />
      </FloatingLabel>
      
      {runSettings.duration !== '' && Number(runSettings.duration) < minDuration && (
        <div className="text-danger small">Duration must be at least {minDuration} hours</div>
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

      {[
        { id: 'maxMerchants', label: 'Merchants/Day', max: 100},
        { id: 'maxPirates',   label: 'Pirates/Day', max: 45},
        { id: 'maxPatrols',   label: 'Total Security', max: 25},
      ].map(({ id, label, max }) => (
        <div key={id} className="d-flex align-items-center gap-2">
          <Form.Label data-testid={`${id}-label`} className="floating-dark small mb-0 text-nowrap" style={{ width: '175px' }}>
            {label}: {runSettings[id]}
          </Form.Label>
          <Form.Range
            data-testid={`${id}-slider`}
            className="flex-fill mb-0"
            min="0" max={max}
            step="1"
            value={runSettings[id]}
            onChange={(e) => modifyRatios(id, parseInt(e.target.value, 10))}
          />
        </div>
      ))}
    </div>
  );
}
