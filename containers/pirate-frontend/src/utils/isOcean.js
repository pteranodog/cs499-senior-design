import landGeoJSON from './ne_110m_land.js'

import PolygonLookup from 'polygon-lookup';



const lookup = new PolygonLookup(landGeoJSON);


console.log('deep ocean test:', lookup.search(60, 0));   // lon=60, lat=0 — Indian Ocean
console.log('deep land test:', lookup.search(46, 5));    // lon=46, lat=5 — Somalia interior


const testResult = lookup.search(46, 9.5);
console.log('Raw search result:', testResult);
console.log('lookup.polygons:', lookup.polygons?.length);

export function isOcean(lat, lon) {
  const result = lookup.search(lon, lat);
  console.log(`isOcean(${lat}, ${lon}) -> search(${lon}, ${lat}) -> ${result === undefined ? 'undefined (ocean)' : 'land'}`);
  return result === undefined;
}

console.log(isOcean(0, 60));  // should be true — Indian Ocean
console.log(isOcean(5, 46));  // should be false — Somalia
