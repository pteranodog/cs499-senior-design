import L from 'leaflet';

const DEG_TO_RAD = Math.PI / 180;

/**
 * Converts local simulation coordinates (x/y in meters) into Leaflet lat/lon.
 *
 * x: positive east
 * y: positive north
 */
export function cartesianToLatLng(
  x,
  y,
  {
    originLat,
    originLon,
    metersPerUnit = 1,
    headingDegrees = 0,
  },
) {
  const heading = headingDegrees * DEG_TO_RAD;
  const eastMeters = (x * Math.cos(heading) - y * Math.sin(heading)) * metersPerUnit;
  const northMeters = (x * Math.sin(heading) + y * Math.cos(heading)) * metersPerUnit;

  const projectedOrigin = L.CRS.EPSG3857.project(L.latLng(originLat, originLon));
  const translated = L.point(
    projectedOrigin.x + eastMeters,
    projectedOrigin.y + northMeters,
  );

  return L.CRS.EPSG3857.unproject(translated);
}

export function simulationPointsToLeaflet(points, transformConfig) {
  return points.map((point) => ({
    ...point,
    latLng: cartesianToLatLng(point.x, point.y, transformConfig),
  }));
}

export function latLngToCartesian(lat, lon, { originLat, originLon, metersPerUnit = 1, headingDegrees = 0 }) {
  const projectedOrigin = L.CRS.EPSG3857.project(L.latLng(originLat, originLon));
  const projectedPoint  = L.CRS.EPSG3857.project(L.latLng(lat, lon));

  const eastMeters  = projectedPoint.x - projectedOrigin.x;
  const northMeters = projectedPoint.y - projectedOrigin.y;

  const heading = headingDegrees * (Math.PI / 180);
  const x = ( eastMeters * Math.cos(heading) + northMeters * Math.sin(heading)) / metersPerUnit;
  const y = (-eastMeters * Math.sin(heading) + northMeters * Math.cos(heading)) / metersPerUnit;

  return [x, y];
}