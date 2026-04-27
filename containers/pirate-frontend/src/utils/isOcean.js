import landGeoJSON from './ne_110m_land.js'

import PolygonLookup from 'polygon-lookup';



const lookup = new PolygonLookup(landGeoJSON);

const testResult = lookup.search(46, 9.5);
console.log('Raw search result:', testResult);
console.log('lookup.polygons:', lookup.polygons?.length);

export function isOcean(lat, lon) {
  const result = lookup.search(lon, lat);
  return result === undefined;
}

console.log(isOcean(0, 60));  // should be true — Indian Ocean
console.log(isOcean(5, 46));  // should be false — Somalia
