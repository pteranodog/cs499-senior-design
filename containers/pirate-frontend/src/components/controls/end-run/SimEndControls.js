import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import FileInputDisplay from '../../../utils/fileInputDisplay';

function formatClock(startHour, startMinute) {
	const hour = Number(startHour);
	const minute = Number(startMinute);

	if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
		return '00:00';
	}

	return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatStatus(status) {
	if (status === 'terminated-before-natural-completion') {
		return 'Terminated Early';
	}
	if (!status) {
		return 'Completed';
	}
	return status;
}

function createDownload(fileName, content, type) {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

function csvRow(label, value) {
	return `${label},${String(value ?? '').replace(/\n/g, ' ')}`;
}

export default function SimEndControls({ simState, modifySimState, runID }) {
	const run = typeof runID === 'number'
		? simState?.runs?.[runID]
		: simState?.runs?.find((candidate) => candidate?.uuid === runID);

	if (!run) {
		return null;
	}

	const region = simState?.regions?.[run.regionId];
	const ships = Object.values(run?.currentState?.ships ?? {});
	const stats = run?.currentState?.stats ?? {};

	const captures = Number(stats.captures ?? 0);
	const rescues = Number(stats.rescues ?? 0);
	const sinks = Number(stats.sinks ?? 0);

	const shipCounts = ships.reduce((acc, ship) => {
		const type = String(ship?.type ?? '').toLowerCase();
		if (type.includes('merchant')) acc.merchants += 1;
		else if (type.includes('pirate')) acc.pirates += 1;
		else if (type.includes('patrol')) acc.patrols += 1;
		return acc;
	}, { merchants: 0, pirates: 0, patrols: 0 });

	const runPayload = {
		simulationName: run.name,
		status: run.status,
		region: {
			id: run.regionId,
			name: region?.name ?? run.regionId,
		},
		config: {
			seed: run.seed,
			startTime: formatClock(run.startHour, run.startMinute),
			durationMinutes: Number(run.duration ?? 0),
			weatherType: run.weatherType,
			maxMerchants: Number(run.maxMerchants ?? 0),
			maxPirates: Number(run.maxPirates ?? 0),
			maxPatrols: Number(run.maxPatrols ?? 0),
		},
		outcomes: {
			captures,
			rescues,
			sinks,
			activeShips: ships.length,
			activeMerchants: shipCounts.merchants,
			activePirates: shipCounts.pirates,
			activePatrols: shipCounts.patrols,
		},
	};

	const exportRun = (format = 'json') => {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const safeName = (run.name || 'simulation-run').trim().replace(/\s+/g, '-').toLowerCase();

		if (format === 'json') {
			createDownload(
				`${safeName}-${timestamp}.json`,
				JSON.stringify(runPayload, null, 2),
				'application/json',
			);
			return;
		}

		const csv = [
			csvRow('Simulation Name', run.name),
			csvRow('Status', formatStatus(run.status)),
			csvRow('Region', region?.name ?? run.regionId),
			csvRow('Seed', run.seed),
			csvRow('Start Time', formatClock(run.startHour, run.startMinute)),
			csvRow('Duration (minutes)', Number(run.duration ?? 0)),
			csvRow('Weather', run.weatherType),
			csvRow('Max Merchants (%)', Number(run.maxMerchants ?? 0)),
			csvRow('Max Pirates (%)', Number(run.maxPirates ?? 0)),
			csvRow('Max Patrols (%)', Number(run.maxPatrols ?? 0)),
			csvRow('Captures', captures),
			csvRow('Rescues', rescues),
			csvRow('Sinks', sinks),
			csvRow('Active Ships', ships.length),
			csvRow('Active Merchants', shipCounts.merchants),
			csvRow('Active Pirates', shipCounts.pirates),
			csvRow('Active Patrols', shipCounts.patrols),
		].join('\n');

		createDownload(`${safeName}-${timestamp}.csv`, csv, 'text/csv');
	};

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
				<h6 className="mb-2">SimStats</h6>
				<div className="small d-flex flex-column gap-1">
					<div><strong>Captures:</strong> {captures}</div>
					<div><strong>Rescues:</strong> {rescues}</div>
					<div><strong>Sinks:</strong> {sinks}</div>
					<div><strong>Active Ships:</strong> {ships.length}</div>
					<div><strong>Merchants:</strong> {shipCounts.merchants}</div>
					<div><strong>Pirates:</strong> {shipCounts.pirates}</div>
					<div><strong>Patrols:</strong> {shipCounts.patrols}</div>
				</div>
			</div>

			<div className="border border-secondary rounded p-3">
				<h6 className="mb-2">SaveRun</h6>
				<div className="small mb-2">Export this run snapshot for later analysis or comparison.</div>
				<ButtonGroup className="w-100">
					<Button variant="success" onClick={() => exportRun('json')}>Export JSON</Button>
					<Button variant="success" onClick={() => exportRun('csv')}>Export CSV</Button>
				</ButtonGroup>
			</div>

			<Button variant="primary" onClick={() => modifySimState({ type: 'view-run-controls', run: runID })}>
				Back To Run Controls
			</Button>

			<Button variant="secondary" onClick={() => modifySimState({ type: 'view-run-list', run: runID })}>
				Back To Run List
			</Button>

			<FileInputDisplay buttonLabel="Compare Simulations" buttonClassName="btn btn-outline-light" />
		</div>
	);
}
