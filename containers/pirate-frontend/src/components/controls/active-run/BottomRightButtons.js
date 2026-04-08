import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Modal from 'react-bootstrap/Modal';

export default function BottomRightButtons({ simState, modifySimState, runID }) {
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  
  const run = typeof runID === 'number'
    ? simState?.runs?.[runID]
    : simState?.runs?.find((candidate) => candidate?.uuid === runID);

  if (!run) {
    return null;
  }

  const modifyRun = (setting, value) => modifySimState({ type: 'modify-run', index: runID, setting, value });
  const speed = run.speed || 1;

  const isRunning = run.status === 'running';
  const isNew = run.status === 'new';

  const handleTerminate = () => {
    if (isNew) {
      modifySimState({ type: 'view-run-list', run: runID, selected: runID })
      return;
    }
    setShowTerminateModal(true);
  };

  const confirmTerminate = () => {
    modifyRun('status', 'terminated-before-natural-completion');
    modifySimState({ type: 'view-run-end', run: runID });
    setShowTerminateModal(false);
  }

  const onPauseToggle = () => {
    if (isNew) {
      modifySimState({ type: 'start-run', index: runID });
      return;
    }

    modifyRun('status', isRunning ? 'paused' : 'running');
  }

  const onStep = () => {
    if (isNew) {
      modifySimState({ type: 'start-run', index: runID, startPaused: true });
      return;
    }

    if (isRunning) {
      modifyRun('status', 'paused');
    }

    modifySimState({ type: 'step-run', index: runID });
    };

  const onSpeedChange = () => {
    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    modifyRun('speed', nextSpeed);
  }


  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        zIndex: 1000,
      }}
    >
      <ButtonGroup aria-label="Run controls">
        <Button variant={isNew ? "success" : "primary"} onClick={onPauseToggle}>
          {isNew ? 'Start' : isRunning ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="secondary" onClick={onStep}>
          Step
        </Button>
        <Button variant="warning" onClick={onSpeedChange}>
          Speed ({speed}x)
        </Button>
        <Button variant={isNew ? "primary" : "danger"} onClick={handleTerminate}>
          {isNew ? "Modify" : "Terminate" }
        </Button>
      </ButtonGroup>

      {/* NEW TERMINATION WARNING POPUP */}
      <Modal show={showTerminateModal} onHide={() => setShowTerminateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Termination</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to terminate this run?
          <br />
          You will not be able to resume.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTerminateModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmTerminate}>
            Terminate
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
