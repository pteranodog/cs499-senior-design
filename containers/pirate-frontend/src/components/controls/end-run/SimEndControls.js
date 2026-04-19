import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import FileInputDisplay from '../../../utils/fileInputDisplay';
import { exportRunAsJson, exportRunAsCsv, formatClock, formatStatus } from '../../../utils/fileInputOutput';

export default function SimEndControls({ simState, modifySimState, runID }) {
	const run = typeof runID === 'number'
		? simState?.runs?.[runID]
		: simState?.runs?.find((candidate) => candidate?.uuid === runID);

	if (!run) return null;

	const region = simState?.regions?.[run.regionId];
	const ships = Object.values(run?.currentState?.ships ?? {});
	const stats = run?.currentState?.stats ?? {};

	const captures = Number(stats.captures ?? 0);
	const rescues = Number(stats.rescues ?? 0);
	const sinks = Number(stats.sinks ?? 0);
	const evasions = Number(stats.evasions ?? 0);
	const totalMerchantsSpawned = Number(stats.merchantsSpawned ?? 0);
	const merchantPirateEncounters = Number(stats.merchantPirateEncounters ?? 0);
	const patrolPirateEncounters = Number(stats.patrolPirateEncounters ?? 0);
	const totalPirateEncounters = Number(stats.totalPirateEncounters ?? 0);
	const merchantEncounterChance = totalMerchantsSpawned > 0
		? ((merchantPirateEncounters / totalMerchantsSpawned) * 100).toFixed(1)
		: '0.0';

	const shipCounts = ships.reduce((acc, ship) => {
		const type = String(ship?.type ?? '').toLowerCase();
		if (type.includes('merchant')) acc.merchants += 1;
		else if (type.includes('pirate')) acc.pirates += 1;
		else if (type.includes('patrol')) acc.patrols += 1;
		return acc;
	}, { merchants: 0, pirates: 0, patrols: 0 });

	return (
		<div
			className="bg-dark text-light"
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				zIndex: 1001,
				width: '600px',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				gap: '12px',
				padding: '12px',
				overflowY: 'auto',
			}}
		>
			<div className="border border-secondary rounded p-3">
				<h5 className="mb-2">Simulation Complete</h5>
				<div className="small"><strong>Name:</strong> {run.name || 'Untitled Run'}</div>
				<div className="small"><strong>Region:</strong> {region?.name || run.regionId}</div>
				<div className="small"><strong>Status:</strong> {formatStatus(run.status)}</div>
			</div>

			<div className="border border-secondary rounded p-3">
				<h6 className="mb-2">Sim Stats</h6>
				<div className="small d-flex flex-column gap-1">
					<div><strong>Captures:</strong> {captures}</div>
					<div><strong>Rescues:</strong> {rescues}</div>
					<div><strong>Sinks:</strong> {sinks}</div>
					<div><strong>Merchant Evasions:</strong> {evasions}</div>
					<div><strong>Merchant-Pirate Encounters:</strong> {merchantPirateEncounters}</div>
					<div><strong>Patrol-Pirate Encounters:</strong> {patrolPirateEncounters}</div>
					<div><strong>Total Pirate Encounters:</strong> {totalPirateEncounters}</div>
					<div><strong>Active Ships:</strong> {ships.length}</div>
					<div><strong>Merchants:</strong> {shipCounts.merchants}</div>
					<div><strong>Pirates:</strong> {shipCounts.pirates}</div>
					<div><strong>Security:</strong> {shipCounts.patrols}</div>
					<div><strong>% Chance of Merchants Encountering Pirates:</strong> {merchantEncounterChance}%</div>
				</div>
			</div>

			<div className="border border-secondary rounded p-3">
				<h6 className="mb-2">Save Run</h6>
				<div className="small mb-2">Export this run snapshot for later analysis or comparison.</div>
				<ButtonGroup className="w-100">
					<Button variant="success" onClick={() => exportRunAsJson(run, region)}>Export JSON</Button>
					<Button variant="success" onClick={() => exportRunAsCsv(run, region)}>Export CSV</Button>
				</ButtonGroup>
			</div>

      {/*<Button variant="primary" onClick={() => modifySimState({ type: 'replay-run', index: runID, endTime: run.elapsedTimeEnd })}>
        Replay
      </Button> */}

	  {run.status === 'new' ? (
		<Button
			variant="primary"
			onClick={() => modifySimState({ type: 'start-run', index: runID })}
		>
			Start Run
			</Button>
		) : (
  			<Button variant="primary" onClick={() =>
    			modifySimState({
       				type: 'replay-run',
        			index: runID,
        			endTime: run.elapsedTimeEnd,
      			})}
  			>			
    		Replay
  		</Button>
		)}

      {/* Since the user can't re-run an already-complete run, complete/terminated runs will probably
        * only be able to be viewed in the "end-run" screen. Can discuss later.
			<Button variant="secondary" onClick={() => modifySimState({ type: 'view-run-controls', run: runID })}>
        View Run
			</Button>
      */}

			<Button variant="primary" onClick={() => modifySimState({ type: 'view-run-list', run: runID })}>
        View All Runs
			</Button>

      {/* Commented out because it's moving to the main screen when two runs are selected already */}
      {/* <FileInputDisplay buttonLabel="Compare Simulations" buttonClassName="btn btn-outline-light" /> */}
		</div>
	);
}
