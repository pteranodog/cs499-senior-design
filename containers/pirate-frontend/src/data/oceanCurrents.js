import { latLngToCartesian, cartesianToLatLng } from '../utils/coords.js';

/**
 * Ocean current model for the Horn of Africa / Western Indian Ocean region.
 *
 * Modeled current systems:
 *  1. Somali Current – strong, runs NE along the Somali coast
 *  2. East African Coastal Current – northward along Kenya / Tanzania
 *  3. Equatorial Counter Current – eastward band near the equator
 *  4. South Equatorial Current – broad westward flow south of equator
 *  5. Monsoon drift – general NE background flow in the Arabian Sea
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
