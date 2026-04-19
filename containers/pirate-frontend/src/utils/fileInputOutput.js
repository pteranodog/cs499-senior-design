import { buildNewRun } from '../data/reducer.js';

const VALID_POINT_TYPES = new Set(['port', 'pirateCove', 'patrolBase']);

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
	const merchantPirateEncounters = Number(stats.merchantPirateEncounters ?? 0);
	const patrolPirateEncounters = Number(stats.patrolPirateEncounters ?? 0);
	const totalPirateEncounters = Number(stats.totalPirateEncounters ?? 0);
	const shipCounts = countShips(ships);
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const safeName = (run.name || 'simulation-run').trim().replace(/\s+/g, '-').toLowerCase();
	const csv = [
		csvRow('Simulation Name', run.name),
		csvRow('Status', formatStatus(run.status)),
		csvRow('Region', region?.name ?? run.regionId),
		csvRow('Seed', run.seed),
		csvRow('Start Time', formatClock(run.startHour, run.startMinute)),
		csvRow('Duration (hours)', Number(run.duration ?? 0)),
		// csvRow('Weather', run.weatherType), // TODO: Weather temporarily removed
		csvRow('Max Merchants (%)', Number(run.maxMerchants ?? 0)),
		csvRow('Max Pirates (%)', Number(run.maxPirates ?? 0)),
		csvRow('Max Patrols (%)', Number(run.maxPatrols ?? 0)),
		csvRow('Captures', captures),
		csvRow('Rescues', rescues),
		csvRow('Sinks', sinks),
		csvRow('Merchant-Pirate Encounters', merchantPirateEncounters),
		csvRow('Patrol-Pirate Encounters', patrolPirateEncounters),
		csvRow('Total Pirate Encounters', totalPirateEncounters),
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
	if (status === 'completed' || !status) return 'Completed';
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

function requireObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
}

function requireFiniteNumber(value, message) {
  if (!Number.isFinite(value)) {
    throw new Error(message);
  }
}

function validateCoordinatePair(value, message) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new Error(message);
  }

  value.forEach((coord) => requireFiniteNumber(coord, message));
}

function validatePoint(pointId, point) {
  requireObject(point, `Point "${pointId}" is invalid.`);

  if (typeof point.name !== 'string' || !point.name.trim()) {
    throw new Error(`Point "${pointId}" is missing a valid name.`);
  }

  if (!VALID_POINT_TYPES.has(point.type)) {
    throw new Error(`Point "${pointId}" has invalid type "${point.type}".`);
  }

  validateCoordinatePair(point.pos, `Point "${pointId}" must have a valid [lat, lon] position.`);
}

export function validateRegion(region) {
  requireObject(region, 'Imported file is missing a valid region object.');

  if (typeof region.name !== 'string' || !region.name.trim()) {
    throw new Error('Imported region is missing a valid name.');
  }

  validateCoordinatePair(region.center, 'Imported region center must be a [lat, lon] pair.');
  requireFiniteNumber(region.length, 'Imported region length must be a finite number.');
  requireFiniteNumber(region.width, 'Imported region width must be a finite number.');
  requireFiniteNumber(region.defaultZoom, 'Imported region default zoom must be a finite number.');

  requireObject(region.points, 'Imported region points must be an object.');
  Object.entries(region.points).forEach(([pointId, point]) => validatePoint(pointId, point));
}

function resolveRegionId(run, region, regions) {
  requireObject(regions, 'Import could not verify available regions.');

  if (typeof run.regionId === 'string' && regions[run.regionId]) {
    return run.regionId;
  }

  if (!region) {
    throw new Error('Imported run references an unknown region and does not include region details.');
  }

  validateRegion(region);

  const match = Object.entries(regions).find(([, candidate]) => candidate?.name === region.name);
  if (!match) {
    throw new Error(`Region "${region.name}" is not available in this app.`);
  }

  return match[0];
}

export function importRun(payload, regions) {
	requireObject(payload, 'Imported file does not contain a valid run payload.');

  	const { region, outcomes, uuid, expanded, selected, ...run } = payload;
  	const regionId = resolveRegionId(run, region, regions);

	const baseTitle = run.name ?? 'Untitled Run';
  	const name = appendImportSuffix(baseTitle);

  	return { 
		...buildNewRun(), 
		...run,
		regionId, 
		name,
		status: 'new',
		isImported: true, 
		replayEndTime: run.elapsedTimeEnd ?? run.elapsedTime, 
		elapsedTime: 0,
		elapsedTimeEnd: 0,
		uuid: crypto.randomUUID()
	};
}

function appendImportSuffix(name) {
  const baseName = String(name || 'Untitled Run').trim();
  return baseName.match(/\(Import\)$/i)
    ? baseName
    : `${baseName} (Import)`;
}

export async function readRunFile(file, regions) {
  const text = await file.text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  return importRun(payload, regions);
}
