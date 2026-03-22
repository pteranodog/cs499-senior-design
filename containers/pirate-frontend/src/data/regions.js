import { newPort, newPirateCove, newRegion } from './classes.js';

function defaultRegions() {
  let somaliaPoints = {};
  somaliaPoints["497dcba3-ecbf-4587-a2dd-5eb0665e6880"] = newPort("Port Said (Egypt)", [31.268591553342564, 32.3080159013517], 0.01, [], []);
  somaliaPoints["50e14f43-dd4e-412f-864d-78943ea28d91"] = newPort("Mombasa (Kenya)", [-4.0717176235876895, 39.67302089897652], 0.01, [], []);
  somaliaPoints["7edb3b2e-869c-485b-af70-76a934e0fcfd"] = newPort("Dar es Salaam (Tanzania)", [-6.764025272071542, 39.27479457164424], 0.01, [], []); 
  somaliaPoints["67e32b59-3348-4dc3-9645-75c60b6f50cc"] = newPort("Djibouti", [11.604819989415411, 43.14977135115654], 0.01, [], []);
  somaliaPoints["4c8f6d82-e4c6-4478-92eb-d9342500f006"] = newPirateCove("Cove One", [11.170546041737072, 47.404807848330168], 0.01); 
  somaliaPoints["7472cba2-6037-488f-b5aa-53b1c39fe450"] = newPirateCove("Cove Two", [5.065907743093423, 48.297863487974084], 0.01);
  somaliaPoints["6b72e68d-e596-4e11-a190-bedbded40cc2"] = newPort("Camp Lemonnier (U.S.A.)", [11.543419592150114, 43.17903502125963], 0, [], []);

  let regions = {};
  regions["331541d6-617d-4464-b7d0-9b346b87f41c"] = newRegion([8, 50], somaliaPoints, "Somalia", 1500, 1500);
  return regions;
}

export { defaultRegions };
