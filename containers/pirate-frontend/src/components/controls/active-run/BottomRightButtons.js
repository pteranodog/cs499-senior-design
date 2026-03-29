import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export default function BottomRightButtons({ simState, modifySimState, runID }) {
  const run = typeof runID === 'number'
    ? simState?.runs?.[runID]
    : simState?.runs?.find((candidate) => candidate?.uuid === runID);

  if (!run) {
    return null;
  }

  const modifyRun = (setting, value) => modifySimState({ type: 'modify-run', index: runID, setting, value });
  const speed = run.speed || 1;

  const handleTerminate = () => {
    const confirmed = window.confirm(
      'Are you sure you want to terminate this run?\nYou will not be able to resume.',
    );

    if (!confirmed) {
      return;
    }

    modifyRun('status', 'terminated-before-natural-completion');

    modifySimState({ type: 'view-run-end', run: runID });

  };

  const isRunning = run.status === 'running';
  const isNew = run.status === 'new';

  const onPauseToggle = () => {
    if (isNew) {
      modifyRun('status', 'running');
      return;
    }

    modifyRun('status', isRunning ? 'paused' : 'running');
  }

  const onStep = () => {
    alert('This button is not yet implemented.');
  }

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
        <Button variant="primary" onClick={onPauseToggle}>
          {isNew ? 'Start' : isRunning ? 'Pause' : 'Resume'}
        </Button>
        <Button variant="secondary" onClick={onStep} disabled={isRunning}>
          Step
        </Button>
        <Button variant="warning" onClick={onSpeedChange}>
          Speed ({speed}x)
        </Button>
        <Button variant="danger" onClick={handleTerminate}>
          Terminate
        </Button>
      </ButtonGroup>
    </div>
  );
}
