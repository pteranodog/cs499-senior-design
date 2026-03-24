import { forwardRef } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import RunSettingsControls from './RunSettingsControls';
import RunSettingsSummary from './RunSettingsSummary';

const RunSettings = forwardRef(function RunSettings({ runID, runSettings, regions, allowSelect, modifySimState }, ref) {
  const isNew = (runSettings.runStatus ?? 'new') === 'new';
  const showSelectionButton = runSettings.selected || allowSelect;

  const modifyRun = (setting, value) =>
    modifySimState({ type: 'modify-run', index: runID, setting, value });

  const modifyRatios = (setting, value) => {
    const val = Number(value);
    if (setting === 'maxPatrols') {
      const remaining = 100 - val;
      const total = runSettings.maxMerchants + runSettings.maxPirates || 1;
      const merchantShare = Math.round((runSettings.maxMerchants / total) * remaining);
      modifyRun('maxPatrols', val);
      modifyRun('maxMerchants', merchantShare);
      modifyRun('maxPirates', remaining - merchantShare);
    } else if (setting === 'maxMerchants') {
      const maxAllowed = 100 - runSettings.maxPatrols;
      const clamped = Math.min(val, maxAllowed);
      modifyRun('maxMerchants', clamped);
      modifyRun('maxPirates', maxAllowed - clamped);
    } else if (setting === 'maxPirates') {
      const maxAllowed = 100 - runSettings.maxPatrols;
      const clamped = Math.min(val, maxAllowed);
      modifyRun('maxPirates', clamped);
      modifyRun('maxMerchants', maxAllowed - clamped);
    }
  };

  return (
    <div ref={ref}>
      <Accordion.Item eventKey={runSettings.uuid} className="bg-dark text-light border-secondary">
        <Accordion.Header>
          <div className="d-flex align-items-center gap-2 flex-fill me-2">
            <Form.Control
              size="sm" type="text" placeholder="Simulation Name"
              className="border-secondary"
              style={{ width: '60%' }}
              value={runSettings.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); modifyRun('name', e.target.value); }}
            />
            <div className="ms-auto" onClick={(e) => e.stopPropagation()}>
              {showSelectionButton && (
                <Button
                  size="sm"
                  variant={runSettings.selected ? 'primary' : 'outline-primary'}
                  onClick={() => modifyRun('selected', !runSettings.selected)}
                >
                  Select
                </Button>
              )}
            </div>
          </div>
        </Accordion.Header>

        <Accordion.Body className="bg-dark text-light p-2">
          <div className="d-flex flex-column gap-2">
            {isNew
              ? <RunSettingsControls runSettings={runSettings} regions={regions} modifyRun={modifyRun} modifyRatios={modifyRatios} />
              : <RunSettingsSummary  runSettings={runSettings} regions={regions} />
            }
            <ButtonGroup className="d-flex mt-1">
              <Button variant="outline-primary" size="sm" className="flex-fill"
                onClick={() => modifySimState({ type: 'duplicate-run', index: runID })}>
                Duplicate
              </Button>
              <Button variant="outline-secondary" size="sm" className="flex-fill"
                onClick={() => modifyRun('runStatus', 'complete')}>
                Export
              </Button>
              <Button variant="outline-danger" size="sm" className="flex-fill"
                onClick={() => modifySimState({ type: 'delete-run', index: runID })}>
                Delete
              </Button>
            </ButtonGroup>
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </div>
  );
});

export default RunSettings;
