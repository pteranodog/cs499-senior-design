import { newPort, newPirateCove, newRegion } from './classes.js';

function defaultRegions() {
  let somaliaPoints = {};
  somaliaPoints["p1"] = newPort("Port Said (Egypt)", [31.2685, 32.3080], 0.01, [], []);
  somaliaPoints["p2"] = newPort("Mombasa (Kenya)", [-4.0717, 39.6730], 0.01, [], []);
  somaliaPoints["p3"] = newPort("Dar es Salaam (Tanzania)", [-6.7640, 39.2747], 0.01, [], []); 
  somaliaPoints["p4"] = newPort("Djibouti", [11.6048, 43.1497], 0.01, [], []);
  somaliaPoints["p5"] = newPirateCove("Cove One", [11.1705, 47.4048], 0.01); 
  somaliaPoints["p6"] = newPirateCove("Cove Two", [5.0659, 48.2978], 0.01);
  somaliaPoints["p7"] = newPort("Camp Lemonnier (U.S.A.)", [11.5434, 43.1790], 0, [], []);

  let regions = {};
  regions["r1"] = newRegion([9.5, 46], somaliaPoints, "Somalian Coast", 1500, 1500, 6);
  regions["r2"] = newRegion([2.5, 1.5], [], "Gulf of Guinea", 1500, 1500, 6);
  regions["r3"] = newRegion([3, 101.5], [], "Malacca Strait", 1500, 1500, 7);

  return regions;
}

export { defaultRegions };
