import { newPort, newBase, newPirateCove, newRegion } from './classes.js';

function defaultRegions() {
  let somaliaPoints = {};
  /*somaliaPoints["p1"] = newPort("Port Said (Egypt)", [31.2685, 32.3080], 0.01, [], []); REMOVED FOR NOW: ended up being way too far out*/
  somaliaPoints["p2"] = newPort("Mombasa (Port)", [-4.0717, 39.6730], 0.01, [], []);
  somaliaPoints["p3"] = newPort("Dar es Salaam (Tanzania)", [-6.7640, 39.2747], 0.01, [], []); 
  somaliaPoints["p4"] = newPort("Djibouti (Port)", [11.6048, 43.1497], 0.01, [], []);

  somaliaPoints["p5"] = newPort("Mumbai", [18.9, 72.8], 0, [], []);
  somaliaPoints["p6"] = newPort("Port Salah (Oman)", [16.9, 54.0], 0, [], []);
  
  somaliaPoints["p7"] = newPirateCove("Cove One", [11.1705, 47.4048], 0.01); // used to be p5, in case fixing that somehow broke smth
  somaliaPoints["p8"] = newPirateCove("Cove Two", [5.0659, 48.2978], 0.01); // used to be p6, in case fixing that somehow broke smth
  somaliaPoints["p9"] = newBase("Camp Lemonnier (U.S.A.)", [11.5434, 43.1790], 0, [], []); // used to be p7, in case fixing that somehow broke smth
  somaliaPoints["p10"] = newBase("Kenya Navy", [-4.3, 39.6], 0, [], []);
  somaliaPoints["p11"] = newBase("Mahé (Naval Base)", [-4.7, 55.5], 0, [], []);

  let regions = {};
  regions["r1"] = newRegion([9.5, 46], somaliaPoints, "Somalian Coast", 1500, 1500, 6);
  regions["r2"] = newRegion([2.5, 1.5], [], "Gulf of Guinea", 1500, 1500, 6);
  regions["r3"] = newRegion([3, 101.5], [], "Malacca Strait", 1500, 1500, 7);

  return regions;
}

export { defaultRegions };
