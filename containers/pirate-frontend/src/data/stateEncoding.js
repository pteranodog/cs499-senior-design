import { strToU8, strFromU8, compressSync, decompressSync } from 'fflate';
import { encode, decode } from '@msgpack/msgpack';
import { defaultRegions } from './regions.js';
import { buildNewRun } from './reducer.js'; // or wherever buildNewRun lives

// NOTE: If the URL sizes end up too large after we add runs/ships/etc., we should
// strip ships from runs and add an empty "ships" key to the run when it's un-diffed.
// If it's *still* too large, we can strip currentState entirely, remove status also,
// and set status='new' on every run loaded from a URL.

const DEFAULT_RUN_TEMPLATE = (() => {
  const run = buildNewRun();
  // Zero out the random/unique fields so they don't pollute the diff
  return { ...run, uuid: null, seed: null, name: null };
})();

function diffRun(run) {
  const diff = { seed: run.seed, name: run.name }; // always keep identity fields
  for (const [key, value] of Object.entries(run)) {
    if (['uuid', 'seed', 'name'].includes(key)) continue;
    if (JSON.stringify(value) !== JSON.stringify(DEFAULT_RUN_TEMPLATE[key])) {
      diff[key] = value;
    }
  }
  return diff;
}

function applyRunDiff(diff) {
  return { ...buildNewRun(), ...diff, uuid: crypto.randomUUID(), seed: diff.seed, name: diff.name };
}

const DEFAULT_APP_STATE = {
  display: { type: 'region', index: 'r1' },
  controls: { type: 'list-runs', selectedRun: null },
};

function diffObject(obj, defaults) {
  const diff = {};
  for (const [key, value] of Object.entries(obj)) {
    if (JSON.stringify(value) !== JSON.stringify(defaults[key])) {
      diff[key] = value;
    }
  }
  return diff;
}

function fromUrlSafeBase64(encoded) {
  const base64 = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    + '==='.slice(0, (4 - encoded.length % 4) % 4);
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function toUrlSafeBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function encodeState(simState) {
  const { regions, ...rest } = simState;
  const encoded_state = {
    runs: rest.runs.map(diffRun),
    ...diffObject({ display: rest.display }, DEFAULT_APP_STATE),
    ...diffObject({ controls: rest.controls }, DEFAULT_APP_STATE),
  };
  const bytes = encode(encoded_state);        // msgpack → Uint8Array
  const compressed = compressSync(bytes);     // compress Uint8Array directly
  return toUrlSafeBase64(compressed);
}

export function decodeState(encoded) {
  try {
    const compressed = fromUrlSafeBase64(encoded);  // base64 → Uint8Array
    const bytes = decompressSync(compressed);        // decompress → Uint8Array
    const parsed = decode(bytes);                    // msgpack decode Uint8Array directly
    return {
      ...DEFAULT_APP_STATE,
      ...parsed,
      regions: defaultRegions(),
      runs: (parsed.runs ?? []).map(applyRunDiff),
    };
  } catch (e) {
    console.warn('Failed to decode state from URL:', e);
    return null;
  }
}

export function saveStateToUrl(simState) {
  const encoded = encodeState(simState);
  window.history.replaceState(null, '', '/' + encoded);
}

export function loadStateFromUrl() {
  const path = window.location.pathname.slice(1); // strip leading /
  if (!path) return null;
  return decodeState(path);
}
