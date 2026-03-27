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

  const handleTerminate = () => {
    const confirmed = window.confirm(
      'Are you sure you want to terminate this run?\nYou will not be able to resume.',
    );

    if (!confirmed) {
      return;
    }

    modifyRun('status', 'terminated-before-natural-completion');
    // TODO: SET THIS TO VIEW-END-RUN AGAIN WHEN END-RUN IS DONE
    modifySimState({ type: 'view-run-list', run: runID });
    // modifySimState({ type: 'view-run-end', run: runID });

  };

  const onPauseToggle = () => {
    alert('This button is not yet implemented.');
  }

  const onStep = () => {
    alert('This button is not yet implemented.');
  }

  const onSpeedChange = () => {
    alert('This button is not yet implemented.');
  }

  const speed = () => {
    alert('This button is not yet implemented.');
  }

  const isRunning = run.status === 'running';

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
          {isRunning ? 'Resume' : 'Pause'}
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
