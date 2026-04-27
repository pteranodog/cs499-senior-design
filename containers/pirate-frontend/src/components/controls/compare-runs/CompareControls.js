import Button from 'react-bootstrap/Button';
import RunSettingsSummary from '../list-runs/RunSettingsSummary';

export default function CompareControls({ simState, modifySimState }) {
  const { runA, runB } = simState.controls;
  const runs = [runA, runB].map(i => simState.runs[i]).filter(Boolean);

  return (
    <div className="bg-dark text-light" style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      zIndex: 1001,
      padding: '8px',
      borderTop: '1px solid var(--bs-secondary)',
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {runs.map((run) => (
          <div key={run.uuid} style={{ flex: 1 }} className="border border-secondary rounded p-2">
            <div className="fw-bold mb-1">{run.name}</div>
            <RunSettingsSummary
              runSettings={run}
              regions={simState.regions}
              warning={run.status === 'new' ? "This run has not started yet!" : ""}
            />
          </div>
        ))}
      </div>
      <Button variant="primary" size="sm" className="w-100"
        onClick={() => modifySimState({ type: 'view-run-list', run: null })}>
        View All Runs
      </Button>
    </div>
  );
}
