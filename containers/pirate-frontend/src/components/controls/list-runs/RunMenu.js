import RunSettings from './RunSettings'
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useEffect, useRef } from 'react';
import { readRunFile } from '../../../utils/fileInputOutput';

export default function RunMenu ({ simState, modifySimState }) {
  const selectedRuns = (simState.runs || []).filter(r => r.selected);
  const selectedCount = selectedRuns.length;
  const selectedRegionIds = new Set(selectedRuns.map(r => r.regionId));
  const allowSelect = (run) => {
    if (run.selected) return true;
    if (selectedCount >= 2) return false;
    if (selectedCount === 0) return true;
    return selectedRegionIds.has(run.regionId);
  };
  const selectionTextOptions = { 0: "No Selection", 1: "View", 2: "Compare" };
  const selectionColorOptions = { 0: 'secondary', 1: 'success', 2: 'warning' };
  const createRunColorOptions = { 0: 'primary' };
  const selectionText = selectionTextOptions[selectedCount] || "Too Many Selections!";
  const selectionColor = selectionColorOptions[selectedCount] || 'danger';
  const createRunColor = createRunColorOptions[selectedCount] || 'outline-primary';
  const scrollRef = useRef(null);
  const itemRefs = useRef({});
  const fileInputRef = useRef(null);

  const handleToggle = (eventKey) => {
    const newKey = simState.runs.find(r => r.expanded)?.uuid === eventKey ? null : eventKey;
    modifySimState({ type: 'select-run', run: newKey });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const run = await readRunFile(file);
    modifySimState({ type: 'load-run', run });
    e.target.value = null; // reset so the same file can be re-imported
  };

  const handleViewCompare = () => {
    if (selectedCount === 0) {
      console.warn("Should be unable to click this button (none selected)");
    } else if (selectedCount === 1) {
      const runIndex = simState.runs.findIndex((item) => item.selected === true);
      const run = simState.runs[runIndex];
      if (run.status === 'new') {
        modifySimState({ type: 'view-run-controls', run: runIndex });
      } else {
        modifySimState({ type: 'view-run-end', run: runIndex });
      }
    } else if (selectedCount === 2) {
      const [runA, runB] = simState.runs
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.selected)
      .map(({ i }) => i);
      modifySimState({ type: 'compare-runs', runA, runB });
    } else {
      console.warn("Should be unable to click this button (>2 selected)");
    }
  };

  useEffect(() => {
    const expandedRun = simState.runs.find(r => r.expanded);
    if (!expandedRun) return;
    setTimeout(() => {
      const item = itemRefs.current[expandedRun.uuid];
      const container = scrollRef.current;
      if (!item || !container) return;
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      if (itemBottom > containerBottom) {
        container.scrollTo({ top: itemBottom - container.clientHeight, behavior: 'smooth' });
      } else if (itemTop < containerTop) {
        container.scrollTo({ top: itemTop, behavior: 'smooth' });
      }
    }, 350);
  }, [simState.runs]);

  return (
    <div
      className="bg-dark"
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: 1001,
        width: '600px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '4px',
      }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      {simState.runs.length === 0 ? (
        <>
          <div className="alert alert-warning py-1 px-2 small mb-0">
            ⚠️ No runs to show! Create or import a run to continue.
          </div>
          <div style={{ flex: 1 }} />
        </>
      ) : (
          <Accordion
            ref={scrollRef}
            activeKey={simState.runs.find(r => r.expanded)?.uuid ?? null}
            onSelect={handleToggle}
            style={{ overflowY: 'auto', flex: 1 }}
          >
            {(simState.runs || []).map((runValue, runIndex) => (
              <RunSettings
                key={runValue.uuid}
                runID={runIndex}
                runSettings={runValue}
                regions={simState.regions}
                allowSelect={allowSelect(runValue)}
                modifySimState={modifySimState}
                ref={(el) => { itemRefs.current[runValue.uuid] = el; }}
              />
            ))}
          </Accordion>
        )}
      <ButtonGroup className="d-flex w-100 mt-1">
        <Button variant="outline-info" size="sm" className="flex-fill"
          onClick={() => fileInputRef.current.click()}>
          Import Run
        </Button>
        <Button variant={createRunColor} size="sm" className="flex-fill"
          onClick={() => modifySimState({ type: 'create-run' })}>
          Create Run
        </Button>
      </ButtonGroup>
      <Button
        variant={selectionColor}
        size="sm"
        disabled={selectedCount === 0}
        onClick={handleViewCompare}
      >
        {selectionText}
      </Button>
    </div>
  );
}
