import { newPort, newBase, newPirateCove, newRegion } from './classes.js';
import { buildNavGraph } from './graphBuilder.js';

// Bounding boxes are intentionally moderate (not huge) so future polygon clipping
// and auto-zoom can target useful simulation extents.
// Coordinates are geographic lat/lon rectangle edges:
// - top: max latitude
// - left: min longitude
// - right: max longitude
// - bottom: min latitude

// ============ SPAWN/DESTINATION HELP FUNCTIONS =============
// Given a region, return the Port object chosen as the spawn candidate.
// Choice is randomized but weighted; see use of spawnWeight property
export function chooseWeightedSpawnPort(region, rng) {

  // Collect list of all ports in the given region
  const ports = Object.entries(region.points)
    .filter(([, p]) => p.type === 'port' && p.spawnWeight > 0);
  if (ports.length === 0) return null;

  const totalWeight = ports.reduce((sum, [, p]) => sum + p.spawnWeight, 0);
  const roll = rng() * totalWeight;

  let cumulative = 0;

  // This is where the random choice happens
  for (const [, p] of ports) {
    cumulative += p.spawnWeight;
    if (roll < cumulative) return p;
  }

  // Just in case, fall back to first port
  return ports[ports.length - 1][1];
}

// Same as above, but returns the *location* of a 
// *destination* port. 
export function chooseWeightedDestPort(region, rng, excludePos) {

  // Collect list of all ports in the given region
  const ports = Object.values(region.points)
    .filter(p => p.type === 'port' && p.destWeight > 0) // out of all the region's points, only include destination ports
    .filter(p => !excludePos || !(p.pos[0] === excludePos[0] && p.pos[1] === excludePos[1])); // and exclude the port i spawned at
  if (ports.length === 0) return null;

  const totalWeight = ports.reduce((sum, p) => sum + p.destWeight, 0);
  const roll = rng() * totalWeight;

  let cumulative = 0;

  // This is where the random choice happens
  for (const port of ports) {
    cumulative += port.destWeight;
    if (roll < cumulative) return port.pos;
  }

  // Just in case, fall back to first port
  return ports[ports.length - 1].pos;
}




const regionBoundingBoxes = {
  r1: { name: "Somalian Coast", top: 14.0, left: 38.0, right: 57.0, bottom: -8.0 },
  r2: { name: "Gulf of Guinea", top: 8.0, left: -4.0, right: 12.0, bottom: 2.0 },
  r3: { name: "Malacca Strait", top: 7.0, left: 97.0, right: 106.0, bottom: 0.0 },
  r4: { name: "Caribbean Sea", top: 22.0, left: -83.5, right: -66.0, bottom: 8.0 },
  r5: { name: "Red Sea", top: 23.0, left: 35.0, right: 47.0, bottom: 10.0 },
  r6: { name: "Mozambique Channel", top: -10.0, left: 31.0, right: 51.0, bottom: -28.0 },
  r7: { name: "South China Sea", top: 24.0, left: 105.0, right: 122.0, bottom: 8.0 },
  r8: { name: "Sulu-Celebes Seas", top: 8.0, left: 117.0, right: 126.5, bottom: 0.0 },
};

function boundsCenter(bounds) {
  // Assumes bounds do not cross the antimeridian (no +/-180 wrap).
  return [
    (bounds.top + bounds.bottom) / 2,
    (bounds.left + bounds.right) / 2,
  ];
}

function defaultRegions() {
  let somaliaPoints = {};
  somaliaPoints["p2"] = newPort("Mombasa (Port)", [-4.0717, 39.6730], 0.08, [], [], 0.04, true);
  somaliaPoints["p3"] = newPort("Dar es Salaam (Tanzania)", [-6.7640, 39.2747], 0.04, [], [], 0.02, true); 
  somaliaPoints["p4"] = newPort("Djibouti (Port)", [11.6048, 43.1497], 0.08, [], [], 0.04, true);
  somaliaPoints["p5"] = newPort("upperLeftSomalia", [13.8, 42.6], 0.4, [], [], 0.3, false);
  somaliaPoints["p6"] = newPort("upperRightSomalia", [12.9, 56.8], 0.36, [], [], 0.2, false);
  somaliaPoints["p7"] = newPort("lowerSomalia", [-8.0, 42.6], 0.04, [], [], 0.05, false);
  



  somaliaPoints["p8"] = newPirateCove("Cove One", [11.1705, 47.4048], 0.01);
  somaliaPoints["p9"] = newPirateCove("Cove Two", [5.0659, 48.2978], 0.01);
  somaliaPoints["p13"] = newPirateCove("Eyl Anchorage", [7.98, 49.82], 0.01);
  somaliaPoints["p14"] = newPirateCove("Hafun Peninsula", [10.44, 51.39], 0.01);
  somaliaPoints["p10"] = newBase("Camp Lemonnier (U.S.A.)", [11.5434, 43.1790], 0);
  somaliaPoints["p11"] = newBase("Kenya Navy", [-4.3, 39.6], 0);
  somaliaPoints["p12"] = newBase("Mahe (Naval Base)", [-4.7, 55.5], 0);

  let guineaPoints = {};
  guineaPoints["g1"] = newPort("Lagos", [6.45, 3.39], 0.15, [], [], 0.15, true);
  guineaPoints["g2"] = newPort("Takoradi", [4.89, -1.75], 0.2, [], [], 0.2, true);
  guineaPoints["g3"] = newPort("Douala", [3.8, 9.5], 0.05, [], [], 0.05, true);
  guineaPoints["g4"] = newPort("Port Harcourt", [4.4, 7.1], 0.2, [], [], 0.2, true);
  guineaPoints["g5"] = newPort("leftGuinea", [4.4, -4.0], 0.4, [], [], 0.4, false);

  guineaPoints["g6"] = newPirateCove("Niger Delta Coves", [4.6, 8.1], 0.01);
  guineaPoints["g7"] = newPirateCove("Brass Approaches", [4.3, 6.2], 0.01);
  guineaPoints["g10"] = newPirateCove("Bakassi Peninsula", [4.4, 8.8], 0.01);
  guineaPoints["g8"] = newBase("Tema Naval Base", [5.63, -0.02], 0);
  guineaPoints["g9"] = newBase("Nigerian Navy Forward Base", [5.9, 4.9], 0);

  let malaccaPoints = {};
  malaccaPoints["m1"] = newPort("Singapore", [1.26, 103.84], 0.1, [], [], 0.1);
  malaccaPoints["m2"] = newPort("Port Klang", [3.06, 101.29], 0.05, [], [], 0.05);
  malaccaPoints["m3"] = newPort("Belawan", [3.80, 98.70], 0.05, [], [], 0.05);
  
  malaccaPoints["m9"] = newPort("leftMalaccaStrait", [5.53, 97.02], 0.3, [], [], 0.35);
  malaccaPoints["m10"] = newPort("topMalaccaStrait", [6.87, 103.38], 0.1, [], [], 0.0);
  malaccaPoints["m11"] = newPort("rightMalaccaStrait", [5.0, 105.94], 0.3, [], [], 0.35);
  malaccaPoints["m12"] = newPort("lowerRightMalaccaStrait", [0.31, 106.06], 0.1, [], [], 0.1);

  malaccaPoints["m4"] = newPirateCove("Riau Archipelago", [1.0, 104.41], 0.01);
  malaccaPoints["m5"] = newPirateCove("Northern Strait Inlets", [5.65, 100.30], 0.01);
  malaccaPoints["m8"] = newPirateCove("Anambas Islands", [3.13, 105.89], 0.01);
  malaccaPoints["m6"] = newBase("Changi Naval Base", [1.31, 104.03], 0);
  malaccaPoints["m7"] = newBase("Lumut Naval Base", [4.23, 100.57], 0);

  let caribbeanPoints = {};
  caribbeanPoints["c1"] = newPort("Kingston", [17.96, -76.79], 0.05, [], [], 0.025, true);
  caribbeanPoints["c2"] = newPort("Santo Domingo", [18.47, -69.88], 0.05, [], [], 0.025, true);
  caribbeanPoints["c3"] = newPort("Colon", [9.36, -79.90], 0.30, [], [], 0.10, true);

  caribbeanPoints["c10"] = newPort("upperMidCaribbean", [21.74, -74.44], 0.2, [], [], 0.35, false);
  caribbeanPoints["c11"] = newPort("leftCaribbean", [20.45, -83.37], 0.2, [], [], 0.25, false);
  caribbeanPoints["c12"] = newPort("Puerto De Mayagüez", [18.22, -67.18], 0.3, [], [], 0.25, true);
  


  caribbeanPoints["c4"] = newPirateCove("Windward Passage", [19.90, -74.85], 0.01);
  caribbeanPoints["c5"] = newPirateCove("Mona Passage", [18.35, -67.85], 0.01);
  caribbeanPoints["c8"] = newPirateCove("Mosquito Coast", [14.99, -83.37], 0.01);
  caribbeanPoints["c9"] = newPirateCove("Los Roques", [11.85, -66.76], 0.01);

  caribbeanPoints["c6"] = newBase("Guantanamo Bay", [19.91, -75.16], 0);
  caribbeanPoints["c7"] = newBase("Aruba Coast Guard", [12.52, -70.03], 0);

  let redSeaPoints = {};
  redSeaPoints["rs1"] = newPort("Port Sudan", [19.62, 37.28], 0.1, [], [], 0.05, true);
  redSeaPoints["rs2"] = newPort("Jeddah", [21.49, 39.17], 0.1, [], [], 0.05, true);
  redSeaPoints["rs3"] = newPort("Aden", [12.77, 45.03], 0.1, [], [], 0.2, true);
  redSeaPoints["rs10"] = newPort("upperRedSea", [22.9, 37.32], 0.4, [], [], 0.4, false);
  redSeaPoints["rs11"] = newPort("lowerRedSea", [12.28, 46.88], 0.3, [], [], 0.3, false);


  redSeaPoints["rs4"] = newPirateCove("Bab el Mandeb East", [12.61, 43.33], 0.01);
  redSeaPoints["rs5"] = newPirateCove("Eritrean Islands", [15.28, 39.77], 0.01);
  redSeaPoints["rs8"] = newPirateCove("Hanish Islands", [13.72, 42.73], 0.01);
  redSeaPoints["rs9"] = newPirateCove("Dahlak Archipelago", [15.69, 40.19], 0.01);


  redSeaPoints["rs6"] = newBase("Djibouti Naval Command", [11.58, 43.15], 0);
  redSeaPoints["rs7"] = newBase("Saudi Western Fleet", [21.43, 39.08], 0);

  let mozambiquePoints = {};
  // deleted n5
  mozambiquePoints["mz1"] = newPort("Maputo", [-25.97, 32.58], 0.1, [], [], 0.15, true);
  mozambiquePoints["mz2"] = newPort("Beira", [-19.83, 34.84], 0.1, [], [], 0.15, true);
  mozambiquePoints["mz3"] = newPort("Toamasina", [-18.15, 49.40], 0.1, [], [], 0.0, true);
  mozambiquePoints["mz5"] = newPort("rightMozambique", [-23.45, 50.83], 0.0, [], [], 0.4, false);
  mozambiquePoints["mz10"] = newPort("topMozambique", [-10.2, 43.05], 0.1, [], [], 0.2, false);
  mozambiquePoints["mz11"] = newPort("bottomMozambique", [-27.8, 37.610], 0.5, [], [], 0.3, false);

  


  mozambiquePoints["mz4"] = newPirateCove("Comoros Passages", [-12.41, 43.65], 0.01);
  mozambiquePoints["mz8"] = newPirateCove("Ibo Island", [-12.35, 40.59], 0.01);
  mozambiquePoints["mz9"] = newPirateCove("Nosy Be Approaches", [-13.32, 48.26], 0.01);


  mozambiquePoints["mz6"] = newBase("Maputo Naval Base", [-25.96, 32.61], 0);
  mozambiquePoints["mz7"] = newBase("Antsiranana Naval Station", [-12.28, 49.29], 0);

  let southChinaSeaPoints = {};
  southChinaSeaPoints["sc1"] = newPort("Manila", [14.60, 120.98], 0.05, [], [], 0.05, true);
  southChinaSeaPoints["sc3"] = newPort("Hong Kong", [22.30, 114.17], 0.5, [], [], 0.2, true);

  southChinaSeaPoints["sc8"] = newPort("upperSouthChina", [23.8, 118.66], 0.0, [], [], 0.1, false);
  southChinaSeaPoints["sc9"] = newPort("upperRightSouthChina1", [21.94, 121.73], 0.05, [], [], 0.1, false);
  southChinaSeaPoints["sc10"] = newPort("upperRightSouthChina2", [23.8, 121.73], 0.05, [], [], 0.1, false);
  southChinaSeaPoints["sc11"] = newPort("lowerSouthChina1", [8.1, 115.63], 0.1, [], [], 0.1, false);
  southChinaSeaPoints["sc2"] = newPort("lowerSouthChina2", [8.1, 108.64], 0.2, [], [], 0.4, false);
 
  

  southChinaSeaPoints["sc4"] = newPirateCove("Spratly Fringe", [9.80, 114.20], 0.01);
  southChinaSeaPoints["sc5"] = newPirateCove("Palawan Approaches", [11.16, 117.42], 0.01);

  southChinaSeaPoints["sc6"] = newBase("Subic Bay Naval Base", [14.82, 120.28], 0);
  southChinaSeaPoints["sc7"] = newBase("Cam Ranh Naval Base", [11.81, 109.26], 0);

  let suluCelebesPoints = {};
  suluCelebesPoints["s1"] = newPort("Zamboanga", [6.91, 122.08], 0.1, [], [], 0.05, true);
  suluCelebesPoints["s2"] = newPort("Sandakan", [5.84, 118.12], 0.05, [], [], 0.05, true);
  suluCelebesPoints["s3"] = newPort("Port Bontang", [0.24, 117.53], 0.2, [], [], 0.2, true);
  
  suluCelebesPoints["s9"] = newPort("upperLeftSulu", [7.75, 117.14], 0.2, [], [], 0.2, false);
  suluCelebesPoints["s10"] = newPort("rightSulu", [6.51, 126.43], 0.2, [], [], 0.2, false);
  suluCelebesPoints["s11"] = newPort("bottomSulu", [0.05, 119.0], 0.3, [], [], 0.3, false);



  suluCelebesPoints["s4"] = newPirateCove("Jolo Archipelago", [6.05, 121.01], 0.01);
  suluCelebesPoints["s5"] = newPirateCove("Tawi Tawi Channels", [5.08, 119.78], 0.01);
  suluCelebesPoints["s8"] = newPirateCove("Semporna Coast", [4.48, 118.62], 0.01);


  suluCelebesPoints["s6"] = newBase("Philippine Western Mindanao", [6.91, 122.06], 0);
  suluCelebesPoints["s7"] = newBase("Indonesian North Sulawesi", [1.47, 124.83], 0);

  let regions = {};
  regions["r1"] = newRegion(boundsCenter(regionBoundingBoxes["r1"]), somaliaPoints, "Somalian Coast",         1200, 1200, 6, 60, 100, 100);
  regions["r2"] = newRegion(boundsCenter(regionBoundingBoxes["r2"]), guineaPoints, "Gulf of Guinea",          1200, 1200, 6, 70, 120, 120);
  regions["r3"] = newRegion(boundsCenter(regionBoundingBoxes["r3"]), malaccaPoints, "Malacca Strait",         1100, 1100, 7, 80, 150, 150);
  regions["r4"] = newRegion(boundsCenter(regionBoundingBoxes["r4"]), caribbeanPoints, "Caribbean Sea",        1300, 1300, 6, 70, 120, 120);
  regions["r5"] = newRegion(boundsCenter(regionBoundingBoxes["r5"]), redSeaPoints, "Red Sea",                 1100, 1100, 6, 60, 100, 100);
  regions["r6"] = newRegion(boundsCenter(regionBoundingBoxes["r6"]), mozambiquePoints, "Mozambique Channel",  1200, 1200, 6, 60, 90,  90);
  regions["r7"] = newRegion(boundsCenter(regionBoundingBoxes["r7"]), southChinaSeaPoints, "South China Sea",  1500, 1500, 5, 60, 100, 100);
  regions["r8"] = newRegion(boundsCenter(regionBoundingBoxes["r8"]), suluCelebesPoints, "Sulu-Celebes Seas",  1000, 1000, 7, 80, 150, 150);

  // Expose bounds on each region so clipping/auto-zoom can consume these later.

  for (const [regionId, region] of Object.entries(regions)) {
  region.bounds = regionBoundingBoxes[regionId];
  region.navgraph = buildNavGraph(region);

   // Compute cartesian bounds of this region from its navgraph node positions:
  const cartesians = Object.values(region.navgraph).map(n => n.cartesian);
  region.cartesianBounds = {
    minX: Math.min(...cartesians.map(c => c[0])),
    maxX: Math.max(...cartesians.map(c => c[0])),
    minY: Math.min(...cartesians.map(c => c[1])),
    maxY: Math.max(...cartesians.map(c => c[1])),
    };
  }

  return regions;
}

export { defaultRegions, regionBoundingBoxes };