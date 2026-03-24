import RunSettings from './RunSettings'
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { useEffect, useRef } from 'react';

export default function RunMenu ({ simState, modifySimState }) {
  const selectedCount = (simState.runs || []).filter(r => r.selected).length;
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
  const allowSelect = selectedCount < 2;
  const scrollRef = useRef(null);
  const itemRefs = useRef({});

  const handleToggle = (eventKey) => {
    const newKey = simState.controls.selectedRun === eventKey ? null : eventKey;
    modifySimState({ type: 'select-run', run: newKey });
  };

  useEffect(() => {
    const key = simState.controls.selectedRun;
    if (!key) return;
    setTimeout(() => {
      const item = itemRefs.current[key];
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
  }, [simState.controls.selectedRun]);

  return (
    <div
      className="bg-dark rounded"
      style={{
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        width: '500px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '4px',
      }}>
      <Accordion
        ref={scrollRef}
        activeKey={simState.controls.selectedRun}
        onSelect={handleToggle}
        style={{ overflowY: 'auto', flex: 1 }}
      >
        {(simState.runs || []).map((runValue, runIndex) => (
          <RunSettings
            key={runValue.uuid}
            runID={runIndex}
            runSettings={runValue}
            regions={simState.regions}
            allowSelect={allowSelect}
            modifySimState={modifySimState}
            ref={(el) => { itemRefs.current[runValue.uuid] = el; }}
          />
        ))}
      </Accordion>
      <ButtonGroup className="d-flex w-100 mt-1">
        <Button variant="outline-secondary" size="sm" className="flex-fill"
          onClick={() => {}}>
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
        onClick={() => {}}
      >
        {selectionText}
      </Button>
    </div>
  );
}
