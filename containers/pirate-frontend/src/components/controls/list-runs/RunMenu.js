import RunSettings from './RunSettings'
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useEffect, useRef } from 'react';

export default function RunMenu ({ simState, modifySimState }) {
  const selectedRuns = (simState.runs || []).filter(r => r.selected);
  const selectedCount = selectedRuns.length;
  const selectedRegionIds = new Set(selectedRuns.map(r => r.regionId));
  const allowSelect = (run) => {
    if (run.selected) return true; // always show button if already selected
    if (selectedCount >= 2) return false;
    if (selectedCount === 0) return true;
    return selectedRegionIds.has(run.regionId);
  };
  const selectionTextOptions = {
    0: "No Selection",
    1: "View",
    2: "Compare"
  };
  const selectionColorOptions = {
    0: 'secondary',
    1: 'success',
    2: 'warning'
  }
  const selectionText = selectionTextOptions[selectedCount] || "Too Many Selections!";
  const selectionColor = selectionColorOptions[selectedCount] || 'danger';
  const scrollRef = useRef(null);
  const itemRefs = useRef({});

  const handleToggle = (eventKey) => {
    const newKey = simState.controls.selectedRun === eventKey ? null : eventKey;
    modifySimState({ type: 'select-run', run: newKey });
  };

  const handleViewCompare = () => {
    if (selectedCount === 0) {
      console.warn("Should be unable to click this button (none selected)");
    } else if (selectedCount === 1) {
      let runIndex = simState.runs.findIndex((item) => (item.selected === true));
      modifySimState({ type: 'view-run-controls', run: runIndex});
    } else if (selectedCount === 2) {
      alert("UNIMPLEMENTED");
    } else {
      console.warn("Should be unable to click this button (>2 selected)")
    }
  }

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
        <Button variant="outline-secondary" size="sm" className="flex-fill"
          onClick={() => {alert("UNIMPLEMENTED")}}>
          Import Run
        </Button>
        <Button variant="outline-primary" size="sm" className="flex-fill"
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
