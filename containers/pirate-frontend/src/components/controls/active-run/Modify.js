import Button from 'react-bootstrap/Button';

export default function Modify({ run, runID, modifySimState }) {
  if (run.status !== 'new') {
    return null;
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 16,
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <Button
        variant="success"
        onClick={() => modifySimState({ type: 'view-run-list', run: runID })}
      >
        Modify
      </Button>
    </div>
  );
}
