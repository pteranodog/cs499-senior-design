import { useEffect, useRef } from 'react';
import { strToU8, strFromU8, compressSync, decompressSync } from 'fflate';
import { encode, decode } from '@msgpack/msgpack';
import { defaultRegions } from './regions.js';
import { buildNewRun } from './reducer.js';

// NOTE: If the URL sizes end up too large after we add runs/ships/etc., we should
// strip ships from runs and add an empty "ships" key to the run when it's un-diffed.
// If it's *still* too large, we can strip currentState entirely, remove status also,
// and set status='new' on every run loaded from a URL.

const DEFAULT_RUN_TEMPLATE = (() => {
  const run = buildNewRun();
  return { ...run, seed: null };
})();

function diffRun(run) {
  const diff = { seed: run.seed };
  for (const [key, value] of Object.entries(run)) {
    if (['uuid', 'seed'].includes(key)) continue;
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
  controls: { type: 'list-runs' },
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

const ENCODERS = [
  {
    param: 's',
    encode: (bytes) => toUrlSafeBase64(compressSync(bytes)),
    decode: (encoded) => decompressSync(fromUrlSafeBase64(encoded)),
  },
  {
    param: 'r',
    encode: (bytes) => toUrlSafeBase64(bytes),
    decode: (encoded) => fromUrlSafeBase64(encoded),
  },
  {
    param: 'j',
    encode: (bytes, obj) => toUrlSafeBase64(strToU8(JSON.stringify(obj))),
    decode: (encoded) => strToU8(JSON.stringify(JSON.parse(strFromU8(fromUrlSafeBase64(encoded))))),
  },
  {
    param: 'p',
    encode: (bytes, obj) => toUrlSafeBase64(compressSync(strToU8(JSON.stringify(obj)))),
    decode: (encoded) => strToU8(JSON.stringify(JSON.parse(strFromU8(decompressSync(fromUrlSafeBase64(encoded)))))),
  },
];

function buildDiff(simState) {
  const { regions, ...rest } = simState;
  return {
    ...(rest.runs.length > 0 && { runs: rest.runs.map(diffRun) }),
    ...diffObject({ display: rest.display }, DEFAULT_APP_STATE),
    ...diffObject({ controls: rest.controls }, DEFAULT_APP_STATE),
  };
}

export function encodeState(simState) {
  const diff = buildDiff(simState);
  if (Object.keys(diff).length === 0) return null;
  console.log('encoding:', JSON.stringify(diff));
  const bytes = encode(diff);
  return ENCODERS
    .map(enc => ({ param: enc.param, value: enc.encode(bytes, diff) }))
    .reduce((best, c) => c.value.length < best.value.length ? c : best);
}

export function decodeState(param, encoded) {
  try {
    const encoder = ENCODERS.find(enc => enc.param === param);
    const bytes = encoder.decode(encoded);
    const parsed = decode(bytes);
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
  const url = new URL(window.location.href);
  ENCODERS.forEach(enc => url.searchParams.delete(enc.param));
  const result = encodeState(simState);
  if (!result) {
    window.history.replaceState(null, '', url.pathname);
    return;
  }
  url.searchParams.set(result.param, result.value);
  window.history.replaceState(null, '', url.toString());
}

export function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoder = ENCODERS.find(enc => params.has(enc.param));
  if (!encoder) return null;
  return decodeState(encoder.param, params.get(encoder.param));
}
