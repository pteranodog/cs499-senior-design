export function cartesianToLatLon(x, y, z) {
  const lon = Math.atan2(y, x) * (180 / Math.PI);
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
  return { latitude: lat, longitude: lon };
}
