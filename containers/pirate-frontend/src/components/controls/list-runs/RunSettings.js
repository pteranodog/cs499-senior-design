import { forwardRef, useState, useEffect } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import RunSettingsControls from './RunSettingsControls';
import RunSettingsSummary from './RunSettingsSummary';
import { exportRunAsJson } from '../../../utils/fileInputOutput';

const RunSettings = forwardRef(function RunSettings({ runID, runSettings, regions, allowSelect, modifySimState }, ref) {
  const canBeEdited = (runSettings.status ?? 'new') === 'new' && !runSettings.selected;
  let disallowedEditingWarning = "";
  if (runSettings.selected) {
    disallowedEditingWarning = "Settings are locked while this run is selected. Deselect this run to modify it!";
  }
  if (!((runSettings.status ?? 'new') === 'new')) {
    disallowedEditingWarning = "Settings are locked once a run has started. Duplicate this run to try different settings!";
  }
  if (runSettings.status === "terminated-before-natural-completion") {
    disallowedEditingWarning = "This run has ended. Duplicate this run to try different settings!";
  }
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const onKey = (e) => setShiftHeld(e.shiftKey);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  useEffect(() => {
    if (runSettings.selected) {
      modifySimState({ type: 'display-run', index: runID });
    }
  }, [modifySimState, runID, runSettings.selected])

  const showSelectionButton = runSettings.selected || allowSelect;

  const modifyRun = (setting, value) =>
    modifySimState({ type: 'modify-run', index: runID, setting, value });

  const modifyRegion = (value) => {
    modifyRun('regionId', value);
    modifySimState({ type: 'display-region', id: value });
  }

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
      <Accordion.Item eventKey={runSettings.uuid} className="bg-dark text-light border-secondary run-item">
        <Accordion.Header>
          <div className="d-flex align-items-center gap-2 flex-fill me-2">
            <Form.Control
              size="sm" type="text" placeholder="Simulation Name"
              data-testid="simulation-name"
              className="border-secondary text-light"
              style={{ width: '50%', backgroundColor: 'var(--bs-gray-900)' }}
              value={runSettings.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { e.stopPropagation(); modifyRun('name', e.target.value); }}
            />
            <span className="text-secondary small text-nowrap">
              {regions?.[runSettings.regionId]?.name ?? 'No Region'}
            </span>
            <div className="ms-auto" onClick={(e) => e.stopPropagation()}>
              {(showSelectionButton || shiftHeld) && (
                <Button
                  size="sm"
                  variant={shiftHeld ? 'danger' : (runSettings.selected ? 'primary' : 'outline-primary')}
                  onClick={() => shiftHeld
                    ? modifySimState({ type: 'delete-run', index: runID })
                    : modifyRun('selected', !runSettings.selected)
                  }
                >
                  {shiftHeld ? 'Delete' : runSettings.selected ? 'Deselect' : 'Select'}
                </Button>
              )}
            </div>
          </div>
        </Accordion.Header>

        <Accordion.Body className="bg-dark text-light p-2">
          <div className="d-flex flex-column gap-2">
            {canBeEdited
              ? <RunSettingsControls runSettings={runSettings} regions={regions} modifyRun={modifyRun} modifyRatios={modifyRatios} modifyRegion={modifyRegion} />
              : <RunSettingsSummary  runSettings={runSettings} regions={regions} warning={disallowedEditingWarning} />
            }
            <ButtonGroup className="d-flex mt-1">
              <Button variant="outline-primary" size="sm" className="flex-fill"
                onClick={() => modifySimState({ type: 'duplicate-run', index: runID })}>
                Duplicate
              </Button>
              <Button variant="outline-info" size="sm" className="flex-fill"
                onClick={() => exportRunAsJson(runSettings, regions?.[runSettings.regionId])}>
                Export JSON
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
