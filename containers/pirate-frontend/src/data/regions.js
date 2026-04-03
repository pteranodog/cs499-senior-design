import { newPort, newBase, newPirateCove, newRegion } from './classes.js';

function defaultRegions() {
  let somaliaPoints = {};
  somaliaPoints["p2"] = newPort("Mombasa (Port)", [-4.0717, 39.6730], 0.01, [], []);
  somaliaPoints["p3"] = newPort("Dar es Salaam (Tanzania)", [-6.7640, 39.2747], 0.01, [], []); 
  somaliaPoints["p4"] = newPort("Djibouti (Port)", [11.6048, 43.1497], 0.01, [], []);
  
  somaliaPoints["p7"] = newPirateCove("Cove One", [11.1705, 47.4048], 0.01);
  somaliaPoints["p8"] = newPirateCove("Cove Two", [5.0659, 48.2978], 0.01);
  somaliaPoints["p9"] = newBase("Camp Lemonnier (U.S.A.)", [11.5434, 43.1790], 0);
  somaliaPoints["p10"] = newBase("Kenya Navy", [-4.3, 39.6], 0);
  somaliaPoints["p11"] = newBase("Mahe (Naval Base)", [-4.7, 55.5], 0);

  let guineaPoints = {};
  guineaPoints["g1"] = newPort("Lagos", [6.45, 3.39], 0.01, [], []);
  guineaPoints["g2"] = newPort("Takoradi", [4.89, -1.75], 0.01, [], []);
  guineaPoints["g3"] = newPort("Douala", [4.05, 9.70], 0.01, [], []);
  guineaPoints["g4"] = newPirateCove("Niger Delta Coves", [4.90, 6.95], 0.01);
  guineaPoints["g5"] = newPirateCove("Brass Approaches", [4.32, 6.24], 0.01);
  guineaPoints["g6"] = newBase("Tema Naval Base", [5.63, -0.02], 0);
  guineaPoints["g7"] = newBase("Nigerian Navy Forward Base", [6.42, 5.62], 0);

  let malaccaPoints = {};
  malaccaPoints["m1"] = newPort("Singapore", [1.26, 103.84], 0.01, [], []);
  malaccaPoints["m2"] = newPort("Port Klang", [3.00, 101.40], 0.01, [], []);
  malaccaPoints["m3"] = newPort("Belawan", [3.78, 98.69], 0.01, [], []);
  malaccaPoints["m4"] = newPirateCove("Riau Archipelago", [1.01, 104.46], 0.01);
  malaccaPoints["m5"] = newPirateCove("Northern Strait Inlets", [5.67, 100.95], 0.01);
  malaccaPoints["m6"] = newBase("Changi Naval Base", [1.31, 104.03], 0);
  malaccaPoints["m7"] = newBase("Lumut Naval Base", [4.23, 100.57], 0);

  let caribbeanPoints = {};
  caribbeanPoints["c1"] = newPort("Kingston", [17.96, -76.79], 0.01, [], []);
  caribbeanPoints["c2"] = newPort("Santo Domingo", [18.47, -69.88], 0.01, [], []);
  caribbeanPoints["c3"] = newPort("Colon", [9.36, -79.90], 0.01, [], []);
  caribbeanPoints["c4"] = newPirateCove("Windward Passage", [19.90, -74.85], 0.01);
  caribbeanPoints["c5"] = newPirateCove("Mona Passage", [18.35, -67.85], 0.01);
  caribbeanPoints["c6"] = newBase("Guantanamo Bay", [19.91, -75.16], 0);
  caribbeanPoints["c7"] = newBase("Aruba Coast Guard", [12.52, -70.03], 0);

  let redSeaPoints = {};
  redSeaPoints["rs1"] = newPort("Port Sudan", [19.62, 37.21], 0.01, [], []);
  redSeaPoints["rs2"] = newPort("Jeddah", [21.49, 39.17], 0.01, [], []);
  redSeaPoints["rs3"] = newPort("Aden", [12.77, 45.03], 0.01, [], []);
  redSeaPoints["rs4"] = newPirateCove("Bab el Mandeb East", [12.61, 43.33], 0.01);
  redSeaPoints["rs5"] = newPirateCove("Eritrean Islands", [15.28, 39.77], 0.01);
  redSeaPoints["rs6"] = newBase("Djibouti Naval Command", [11.58, 43.15], 0);
  redSeaPoints["rs7"] = newBase("Saudi Western Fleet", [21.43, 39.08], 0);

  let mozambiquePoints = {};
  mozambiquePoints["mz1"] = newPort("Maputo", [-25.97, 32.58], 0.01, [], []);
  mozambiquePoints["mz2"] = newPort("Beira", [-19.83, 34.84], 0.01, [], []);
  mozambiquePoints["mz3"] = newPort("Toamasina", [-18.15, 49.40], 0.01, [], []);
  mozambiquePoints["mz4"] = newPirateCove("Comoros Passages", [-12.41, 43.65], 0.01);
  mozambiquePoints["mz5"] = newPirateCove("Northern Mozambique Channel", [-14.88, 43.75], 0.01);
  mozambiquePoints["mz6"] = newBase("Maputo Naval Base", [-25.96, 32.61], 0);
  mozambiquePoints["mz7"] = newBase("Antsiranana Naval Station", [-12.28, 49.29], 0);

  let southChinaSeaPoints = {};
  southChinaSeaPoints["sc1"] = newPort("Manila", [14.60, 120.98], 0.01, [], []);
  southChinaSeaPoints["sc2"] = newPort("Ho Chi Minh City", [10.75, 106.70], 0.01, [], []);
  southChinaSeaPoints["sc3"] = newPort("Hong Kong", [22.30, 114.17], 0.01, [], []);
  southChinaSeaPoints["sc4"] = newPirateCove("Spratly Fringe", [9.80, 114.20], 0.01);
  southChinaSeaPoints["sc5"] = newPirateCove("Palawan Approaches", [11.16, 117.42], 0.01);
  southChinaSeaPoints["sc6"] = newBase("Subic Bay Naval Base", [14.82, 120.28], 0);
  southChinaSeaPoints["sc7"] = newBase("Cam Ranh Naval Base", [11.93, 109.16], 0);

  let suluCelebesPoints = {};
  suluCelebesPoints["s1"] = newPort("Zamboanga", [6.91, 122.08], 0.01, [], []);
  suluCelebesPoints["s2"] = newPort("Sandakan", [5.84, 118.12], 0.01, [], []);
  suluCelebesPoints["s3"] = newPort("Bitung", [1.45, 125.20], 0.01, [], []);
  suluCelebesPoints["s4"] = newPirateCove("Jolo Archipelago", [6.05, 121.01], 0.01);
  suluCelebesPoints["s5"] = newPirateCove("Tawi Tawi Channels", [5.08, 119.78], 0.01);
  suluCelebesPoints["s6"] = newBase("Philippine Western Mindanao", [6.91, 122.06], 0);
  suluCelebesPoints["s7"] = newBase("Indonesian North Sulawesi", [1.47, 124.83], 0);

  let regions = {};
  regions["r1"] = newRegion([9.5, 46], somaliaPoints, "Somalian Coast", 1200, 1200, 6);
  regions["r2"] = newRegion([2.5, 1.5], guineaPoints, "Gulf of Guinea", 1200, 1200, 6);
  regions["r3"] = newRegion([3, 101.5], malaccaPoints, "Malacca Strait", 1100, 1100, 7);
  regions["r4"] = newRegion([15.2, -74.5], caribbeanPoints, "Caribbean Sea", 1300, 1300, 6);
  regions["r5"] = newRegion([17.0, 40.5], redSeaPoints, "Red Sea", 1100, 1100, 6);
  regions["r6"] = newRegion([-17.0, 41.5], mozambiquePoints, "Mozambique Channel", 1200, 1200, 6);
  regions["r7"] = newRegion([15.5, 113.0], southChinaSeaPoints, "South China Sea", 1500, 1500, 5);
  regions["r8"] = newRegion([5.2, 122.1], suluCelebesPoints, "Sulu-Celebes Seas", 1000, 1000, 7);

  return regions;
}

export { defaultRegions };