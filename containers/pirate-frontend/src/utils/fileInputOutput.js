import { buildNewRun } from '../data/reducer.js';

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

export function exportRunAsJson(run, region) {
	const runPayload = buildRunPayload(run, region);
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const safeName = (run.name || 'simulation-run').trim().replace(/\s+/g, '-').toLowerCase();
	createDownload(
		`${safeName}-${timestamp}.json`,
		JSON.stringify(runPayload, null, 2),
		'application/json',
	);
}

export function exportRunAsCsv(run, region) {
	const ships = Object.values(run?.currentState?.ships ?? {});
	const stats = run?.currentState?.stats ?? {};
	const captures = Number(stats.captures ?? 0);
	const rescues = Number(stats.rescues ?? 0);
	const sinks = Number(stats.sinks ?? 0);
	const shipCounts = countShips(ships);
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const safeName = (run.name || 'simulation-run').trim().replace(/\s+/g, '-').toLowerCase();
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
}

export function formatClock(startHour, startMinute) {
	const hour = Number(startHour);
	const minute = Number(startMinute);
	if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '00:00';
	return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatStatus(status) {
	if (status === 'terminated-before-natural-completion') return 'Terminated Early';
	if (!status) return 'Completed';
	return status;
}

export function countShips(ships) {
	return ships.reduce((acc, ship) => {
		const type = String(ship?.type ?? '').toLowerCase();
		if (type.includes('merchant')) acc.merchants += 1;
		else if (type.includes('pirate')) acc.pirates += 1;
		else if (type.includes('patrol')) acc.patrols += 1;
		return acc;
	}, { merchants: 0, pirates: 0, patrols: 0 });
}

// JSON run payload is as close as possible to the internal data
// structure because it'll make it *much* easier to write
// (or rewrite) the import logic later on
export function buildRunPayload(run, region) {
	const ships = Object.values(run?.currentState?.ships ?? {});
	const shipCounts = countShips(ships);
	const { uuid, expanded, selected, ...rest } = run;
  return {
    ...rest,
    region,
		outcomes: {
			activeShips: ships.length,
			activeMerchants: shipCounts.merchants,
			activePirates: shipCounts.pirates,
			activePatrols: shipCounts.patrols,
		},
	};
}

export function importRun(payload) {
  const { region, outcomes, uuid, expanded, selected, ...run } = payload;
  return { ...buildNewRun(), ...run, uuid: crypto.randomUUID() };
}

export async function readRunFile(file) {
  const text = await file.text();
  return importRun(JSON.parse(text));
}
