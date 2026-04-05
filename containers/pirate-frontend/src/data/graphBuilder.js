import { isOcean } from '../utils/isOcean.js';
import { latLngToCartesian } from '../utils/coords.js';

// ============================= Danger zones =============================
// Static danger zones per region. Each zone has a center lat/lon, radius in
// meters, and intensity (0-1). Node danger scores are computed from these
// at graph-build time so A* can factor in piracy risk without runtime queries.

const DANGER_ZONES = {
  "Somalian Coast": [
    { lat: 11.1705, lon: 47.4048, radius: 300000, intensity: 1.0 }, // Cove One area
    { lat: 5.0659,  lon: 48.2978, radius: 300000, intensity: 1.0 }, // Cove Two area
    { lat: 10.0,    lon: 50.5,    radius: 500000, intensity: 0.6 }, // Open Somali basin
    { lat: 12.0,    lon: 44.5,    radius: 250000, intensity: 0.5 }, // Gulf of Aden corridor
  ],
  "Gulf of Guinea": [],
  "Malacca Strait": [],
};

// ============================= Graph building =============================

/**
 * Returns a grid-styled graph object, intended to be navigated by A*. Formatted
 * as a keyed object, whose values are node objects with properties such
 * as cartesian pos, lat/lon pos, and a danger score (based on whether ot not it
 * falls in one of the danger zones).
 * 
 * Inputs are a region object (from regions.js) and a grid size in meters; i.e.
 * how far apart two nodes "next to each other" are.
 */
export function buildNavGraph(region, gridSize = 30) {
const { center, name } = region;
  const [originLat, originLon] = center;
  const { top, bottom, left, right } = region.bounds;

  const latMin = bottom;
  const latMax = top;
  const lonMin = left;
  const lonMax = right;

  const latStep = (latMax - latMin) / (gridSize - 1);
  const lonStep = (lonMax - lonMin) / (gridSize - 1);

  // get danger zones for this region
  const dangerZones = DANGER_ZONES[name] ?? [];

  // Pass 1: build all nodes ==============================================
  const graph = {};

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const lat = latMin + row * latStep;
      const lon = lonMin + col * lonStep;
      const id  = `node_${row}_${col}`;

      const passable = isOcean(lat, lon); 

      const cartesian = latLngToCartesian(lat, lon, {
        originLat,
        originLon,
        metersPerUnit: 1,
        headingDegrees: 0,
      });

      const dangerScore = passable ? computeDangerScore(lat, lon, dangerZones) : 0;

      graph[id] = {
        id,
        lat,
        lon,
        cartesian,
        passable,
        dangerScore,
        neighbors: [], // filled in pass 2
      };
    }
  }

  // NEW: add a "shore score" to nodes near shore to make cost to these nodes high (avoid shore hug)
  for (const id of Object.keys(graph)) {
  graph[id].shoreScore = computeShoreScore(graph, id, gridSize);
}

  // Pass 2: connect neighbors ==============================================
  // Each passable node connects to all adjacent passable nodes (8-directional).
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const node = graph[`node_${row}_${col}`];
      if (!node.passable) continue; // on-land nodes shouldnt have neighbors

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue; // skip self

          const nRow = row + dr;
          const nCol = col + dc;

          if (nRow < 0 || nRow >= gridSize || nCol < 0 || nCol >= gridSize) continue;

          const neighborId = `node_${nRow}_${nCol}`;
          const neighbor   = graph[neighborId];

          if (neighbor.passable) {
            node.neighbors.push(neighborId);
          }
        }
      }
    }
  }

  return graph;
}

// ============================= Danger scoring ============================

/**
 * Assign a danger score (0-1) for a point based on distance to
 * danger zones; scores from multiple overlapping zones are summed and
 * clamped to 1
 */
function computeDangerScore(lat, lon, dangerZones) {
  if (dangerZones.length === 0) return 0;

  let score = 0;

  for (const zone of dangerZones) {
    const distMeters = haversineMeters(lat, lon, zone.lat, zone.lon);
    if (distMeters < zone.radius) {
      // Linear falloff from center to edge of zone
      const proximity = 1 - (distMeters / zone.radius);
      score += proximity * zone.intensity;
    }
  }

  return Math.min(score, 1);
}

/**
 * Claude suggested to use this in computing distances between nodes.
 * Used only at graph-build time so performance is not critical.
 * Required for accurate spherical math
 */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R  = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2
           + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeShoreScore(graph, nodeId, gridSize) {
  const node = graph[nodeId];
  if (!node.passable) return 0;

  // Parse row/col from id
  const [, row, col] = nodeId.split('_').map(Number);

  // Define specific scores for nodes close to shores;
  // increasing radius = increasing distance from shore.
  // radius of 1 = 1 node "from shore"
  const rings = [
    { radius: 1, score: 1.5 },
    { radius: 2, score: 1.2 },
    { radius: 3, score: 1.0 },
    { radius: 4, score: 0.8 },
    { radius: 5, score: 0.6 },
    { radius: 6, score: 0.4 },
  ];

  let maxScore = 0;

  for (const { radius, score } of rings) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // only check the ring edge
        const nRow = row + dr;
        const nCol = col + dc;
        if (nRow < 0 || nRow >= gridSize || nCol < 0 || nCol >= gridSize) continue;
        const neighbor = graph[`node_${nRow}_${nCol}`];
        if (neighbor && !neighbor.passable) {
          maxScore = Math.max(maxScore, score);
        }
      }
    }
  }

  return maxScore;
}