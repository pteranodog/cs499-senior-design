import { latLngToCartesian, cartesianToLatLng } from '../utils/coords.js';

/**
 * Ocean current model for all simulation regions.
 *
 * Each zone is defined with a center, direction, magnitude, radius of
 * influence, and a smooth (Gaussian) falloff so the vector field is
 * continuous everywhere.
 *
 * Public API
 *   getOceanCurrentAtLatLng(lat, lng)           → [vx, vy]  (m/s, east/north)
 *   getOceanCurrent(x, y, regionOrigin?)        → [vx, vy]  (Cartesian, same units as sim)
 *   CURRENT_ZONES                               → raw zone definitions (for visualization / tuning)
 */

// ---------------------------------------------------------------------------
// Zone definitions
// ---------------------------------------------------------------------------
// direction: [east, north] unit-ish vector (will be normalised internally)
// magnitude: speed in m/s (≈ knots × 0.514)
// radius: radius of influence in degrees (lat/lng space)

const CURRENT_ZONES = [
  {
    name: 'Somali Current (north)',
    center: [8.0, 48.0],     // lat, lng
    direction: [0.5, 1.0],   // NE along coast
    magnitude: 1.5,           // ~3 knots at peak
    radius: 4.0,
  },
  {
    name: 'Somali Current (south)',
    center: [2.0, 46.0],
    direction: [0.3, 1.0],
    magnitude: 1.2,
    radius: 3.5,
  },
  {
    name: 'East African Coastal Current',
    center: [-4.0, 41.0],
    direction: [0.2, 1.0],   // mostly northward
    magnitude: 0.8,
    radius: 3.0,
  },
  {
    name: 'Equatorial Counter Current',
    center: [0.0, 55.0],
    direction: [1.0, 0.0],   // due east
    magnitude: 0.6,
    radius: 5.0,
  },
  {
    name: 'South Equatorial Current',
    center: [-5.0, 55.0],
    direction: [-1.0, 0.0],  // due west
    magnitude: 0.5,
    radius: 4.0,
  },
  {
    name: 'Arabian Sea monsoon drift',
    center: [14.0, 58.0],
    direction: [1.0, 0.3],   // ENE
    magnitude: 0.4,
    radius: 8.0,
  },
  {
    name: 'Gulf of Aden current',
    center: [12.0, 45.0],
    direction: [1.0, 0.2],   // roughly eastward through the gulf
    magnitude: 0.7,
    radius: 2.5,
  },

  // --- r2: Gulf of Guinea ---
  {
    name: 'Guinea Current',
    center: [4.0, 2.0],
    direction: [1.0, 0.0],   // eastward along the coast
    magnitude: 0.6,
    radius: 3.5,
  },
  {
    name: 'Benguela–Guinea convergence',
    center: [3.0, 8.0],
    direction: [0.8, 0.3],   // NE towards Bight of Biafra
    magnitude: 0.4,
    radius: 3.0,
  },
  {
    name: 'Niger Delta outflow',
    center: [4.5, 5.5],
    direction: [-0.5, -1.0], // southwestward from river mouth
    magnitude: 0.3,
    radius: 2.0,
  },

  // --- r3: Malacca Strait ---
  {
    name: 'Malacca Strait throughflow',
    center: [3.5, 100.5],
    direction: [-1.0, 0.3],  // NW through the strait
    magnitude: 0.7,
    radius: 3.0,
  },
  {
    name: 'Singapore Strait current',
    center: [1.2, 104.0],
    direction: [1.0, 0.0],   // eastward
    magnitude: 0.5,
    radius: 2.0,
  },

  // --- r4: Caribbean Sea ---
  {
    name: 'Caribbean Current',
    center: [15.0, -75.0],
    direction: [-1.0, 0.3],  // WNW across the basin
    magnitude: 0.6,
    radius: 5.0,
  },
  {
    name: 'Yucatan Current',
    center: [20.0, -80.0],
    direction: [0.0, 1.0],   // northward toward Florida Strait
    magnitude: 0.8,
    radius: 3.0,
  },
  {
    name: 'Windward Passage flow',
    center: [19.5, -73.5],
    direction: [-0.5, 1.0],  // NW through passage
    magnitude: 0.5,
    radius: 2.5,
  },
  {
    name: 'Panama–Colombia Gyre',
    center: [10.0, -78.0],
    direction: [-1.0, -0.3], // WSW
    magnitude: 0.4,
    radius: 3.0,
  },

  // --- r5: Red Sea ---
  {
    name: 'Red Sea surface current (north)',
    center: [20.0, 38.5],
    direction: [0.0, -1.0],  // southward (inverse estuary)
    magnitude: 0.3,
    radius: 3.5,
  },
  {
    name: 'Red Sea surface current (south)',
    center: [14.0, 42.0],
    direction: [0.0, -1.0],  // southward toward Bab el-Mandeb
    magnitude: 0.5,
    radius: 3.0,
  },
  {
    name: 'Bab el-Mandeb inflow',
    center: [12.5, 43.3],
    direction: [0.0, 1.0],   // northward through the strait
    magnitude: 0.8,
    radius: 1.5,
  },

  // --- r6: Mozambique Channel ---
  {
    name: 'Mozambique Current',
    center: [-16.0, 41.0],
    direction: [0.0, -1.0],  // southward through channel
    magnitude: 1.0,
    radius: 4.0,
  },
  {
    name: 'South Equatorial Current (Mozambique)',
    center: [-12.0, 48.0],
    direction: [-1.0, 0.0],  // westward feeding into channel
    magnitude: 0.5,
    radius: 4.0,
  },
  {
    name: 'Agulhas Current origin',
    center: [-25.0, 36.0],
    direction: [0.3, -1.0],  // SW along South Africa coast
    magnitude: 0.8,
    radius: 3.5,
  },

  // --- r7: South China Sea ---
  {
    name: 'South China Sea western boundary',
    center: [14.0, 112.0],
    direction: [0.0, -1.0],  // southward along Vietnam coast
    magnitude: 0.5,
    radius: 4.0,
  },
  {
    name: 'Luzon Strait inflow',
    center: [20.0, 120.0],
    direction: [-1.0, 0.0],  // westward into the basin
    magnitude: 0.6,
    radius: 3.5,
  },
  {
    name: 'South China Sea southern outflow',
    center: [10.0, 110.0],
    direction: [-1.0, -0.3], // WSW toward Malay Peninsula
    magnitude: 0.4,
    radius: 4.0,
  },

  // --- r8: Sulu-Celebes Seas ---
  {
    name: 'Sulu Sea throughflow',
    center: [7.0, 120.0],
    direction: [0.0, -1.0],  // southward through Sulu Sea
    magnitude: 0.4,
    radius: 3.0,
  },
  {
    name: 'Celebes Sea current',
    center: [3.0, 122.0],
    direction: [1.0, 0.0],   // eastward
    magnitude: 0.5,
    radius: 3.5,
  },
  {
    name: 'Makassar Strait inflow',
    center: [1.5, 118.5],
    direction: [0.0, -1.0],  // southward into Makassar
    magnitude: 0.6,
    radius: 2.5,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Gaussian falloff: 1 at center, drops smoothly to ~0 at distance = radius. */
function gaussianWeight(distance, radius) {
  // sigma chosen so weight ≈ 0.01 at d = radius
  const sigma = radius / 2.146; // sqrt(-2 ln 0.01) ≈ 3.035; radius/3.035 is too tight
  return Math.exp(-0.5 * (distance / sigma) ** 2);
}

/** Euclidean distance in degree-space (good enough for blending weights). */
function degreeDistance(lat1, lng1, lat2, lng2) {
  const dLat = lat1 - lat2;
  const dLng = (lng1 - lng2) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180); // rough correction
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function normalize2(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  if (len === 0) return [0, 0];
  return [v[0] / len, v[1] / len];
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Return the ocean current vector at a given lat/lng.
 * @param {number} lat  – latitude  (degrees, + = north)
 * @param {number} lng  – longitude (degrees, + = east)
 * @returns {number[]} [vx, vy] where vx = east component, vy = north component (m/s)
 */
export function getOceanCurrentAtLatLng(lat, lng) {
  let vx = 0;
  let vy = 0;

  for (const zone of CURRENT_ZONES) {
    const [cLat, cLng] = zone.center;
    const dist = degreeDistance(lat, lng, cLat, cLng);
    const w = gaussianWeight(dist, zone.radius);

    const dir = normalize2(zone.direction);
    vx += dir[0] * zone.magnitude * w;
    vy += dir[1] * zone.magnitude * w;
  }

  return [vx, vy];
}

/**
 * Return the ocean current vector at a Cartesian simulation coordinate.
 *
 * @param {number} x  – Cartesian x (east-west metres from region origin)
 * @param {number} y  – Cartesian y (north-south metres from region origin)
 * @param {object} [regionOrigin] – { originLat, originLon } of the region.
 *        Defaults to the Somalia region origin.
 * @returns {number[]} [vx, vy] current vector in the same Cartesian frame (m/s)
 */
export function getOceanCurrent(
  x,
  y,
  regionOrigin = { originLat: 9.5, originLon: 46 },
) {
  // Convert Cartesian → lat/lng so we can look up the current
  const latLng = cartesianToLatLng(x, y, regionOrigin);
  return getOceanCurrentAtLatLng(latLng.lat, latLng.lng);
}

export { CURRENT_ZONES };
