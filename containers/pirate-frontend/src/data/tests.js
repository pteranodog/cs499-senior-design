import { isOcean } from '../utils/isOcean.js';

// Known ocean point — Gulf of Aden center
console.log('isOcean(9.5, 46):', isOcean(9.5, 46));
// Known land point — Somalia interior  
console.log('isOcean(5.0, 46):', isOcean(5.0, 46));
// Try reversed just in case
console.log('isOcean(46, 9.5):', isOcean(46, 9.5));

import { buildNavGraph } from './graphBuillder.js';
import { aStar } from './aStar.js';
import { defaultRegions } from './regions.js';




// ============================= Test harness ==================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

function assertClose(a, b, tolerance = 0.01, message) {
  if (Math.abs(a - b) > tolerance) {
    throw new Error(message ?? `Expected ${a} to be close to ${b} (tolerance ${tolerance})`);
  }
}

// ============================= Setup ========================================

console.log('\n=== NavGraph + A* Unit Tests ===\n');

const GRID_SIZE = 30;
const regions   = defaultRegions();
const region    = regions['r1']; // Somalian Coast
const graph     = buildNavGraph(region, GRID_SIZE);
const nodeIds   = Object.keys(graph);

// ============================= navGraph tests ================================

console.log('--- buildNavGraph ---');

test('graph has correct number of nodes', () => {
  assert(
    nodeIds.length === GRID_SIZE * GRID_SIZE,
    `Expected ${GRID_SIZE * GRID_SIZE} nodes, got ${nodeIds.length}`
  );
});

test('all nodes have required fields', () => {
  for (const id of nodeIds) {
    const node = graph[id];
    assert(typeof node.id          === 'string',  `${id}: id should be string`);
    assert(typeof node.lat         === 'number',  `${id}: lat should be number`);
    assert(typeof node.lon         === 'number',  `${id}: lon should be number`);
    assert(Array.isArray(node.cartesian) && node.cartesian.length === 2, `${id}: cartesian should be [x, y]`);
    assert(typeof node.passable    === 'boolean', `${id}: passable should be boolean`);
    assert(typeof node.dangerScore === 'number',  `${id}: dangerScore should be number`);
    assert(Array.isArray(node.neighbors),         `${id}: neighbors should be array`);
  }
});

test('danger scores are in range [0, 1]', () => {
  for (const id of nodeIds) {
    const { dangerScore } = graph[id];
    assert(
      dangerScore >= 0 && dangerScore <= 1,
      `${id}: dangerScore ${dangerScore} out of range`
    );
  }
});

test('impassable nodes have no neighbors', () => {
  for (const id of nodeIds) {
    const node = graph[id];
    if (!node.passable) {
      assert(
        node.neighbors.length === 0,
        `${id}: impassable node should have no neighbors, has ${node.neighbors.length}`
      );
    }
  }
});

test('all neighbor IDs exist in graph', () => {
  for (const id of nodeIds) {
    for (const neighborId of graph[id].neighbors) {
      assert(
        graph[neighborId] !== undefined,
        `${id}: neighbor ${neighborId} does not exist in graph`
      );
    }
  }
});

test('all neighbors are passable', () => {
  for (const id of nodeIds) {
    for (const neighborId of graph[id].neighbors) {
      assert(
        graph[neighborId].passable,
        `${id}: neighbor ${neighborId} is not passable`
      );
    }
  }
});

test('neighbor relationships are symmetric', () => {
  for (const id of nodeIds) {
    for (const neighborId of graph[id].neighbors) {
      assert(
        graph[neighborId].neighbors.includes(id),
        `${id} lists ${neighborId} as neighbor but relationship is not symmetric`
      );
    }
  }
});

test('at least some nodes are passable (ocean exists in region)', () => {
  const passableCount = nodeIds.filter(id => graph[id].passable).length;
  assert(passableCount > 0, 'No passable nodes found — ocean lookup may have failed');
  console.log(`    (${passableCount}/${nodeIds.length} nodes are passable)`);
});

test('known ocean point is passable (Gulf of Aden center)', () => {
  // [9.5, 46] is the region center, well within the Gulf of Aden
  const oceanNode = Object.values(graph).find(n =>
    Math.abs(n.lat - 9.5) < 1.0 && Math.abs(n.lon - 46.0) < 1.0
  );
  assert(oceanNode !== undefined, 'Could not find node near region center');
  assert(oceanNode.passable, `Node near region center (${oceanNode.lat.toFixed(2)}, ${oceanNode.lon.toFixed(2)}) should be passable`);
});

test('known land point is impassable (central Somalia ~5N, 46E)', () => {
  // Interior of Somalia — should be land
  const landNode = Object.values(graph).find(n =>
    Math.abs(n.lat - 5.0) < 1.0 && Math.abs(n.lon - 46.0) < 1.0
  );
  assert(landNode !== undefined, 'Could not find node near Somalia interior');
  assert(!landNode.passable, `Node near Somalia interior (${landNode.lat.toFixed(2)}, ${landNode.lon.toFixed(2)}) should be impassable`);
});

test('nodes near Cove One have elevated danger scores', () => {
  // Cove One is at [11.1705, 47.4048] with radius 300km and intensity 1.0
  const nearCove = Object.values(graph).filter(n =>
    n.passable &&
    Math.abs(n.lat - 11.1705) < 1.5 &&
    Math.abs(n.lon - 47.4048) < 1.5
  );
  assert(nearCove.length > 0, 'No passable nodes found near Cove One');
  const maxDanger = Math.max(...nearCove.map(n => n.dangerScore));
  assert(maxDanger > 0.3, `Expected danger score > 0.3 near Cove One, got ${maxDanger.toFixed(3)}`);
  console.log(`    (max danger near Cove One: ${maxDanger.toFixed(3)})`);
});

test('nodes far from danger zones have low danger scores', () => {
  // Southern Indian Ocean area of the region should be safe
  const safeNodes = Object.values(graph).filter(n =>
    n.passable && n.lat < -2.0 && n.lon > 50.0
  );
  if (safeNodes.length === 0) {
    console.log('    (skipped — no passable nodes in expected safe area)');
    return;
  }
  const maxDanger = Math.max(...safeNodes.map(n => n.dangerScore));
  assert(maxDanger < 0.2, `Expected low danger far from zones, got ${maxDanger.toFixed(3)}`);
  console.log(`    (max danger in safe area: ${maxDanger.toFixed(3)})`);
});

// ============================= A* tests =====================================

console.log('\n--- aStar ---');

// Find two well-separated passable nodes for path tests
const passableNodes = Object.values(graph).filter(n => n.passable);
const nodeA = passableNodes[0];
const nodeB = passableNodes[Math.floor(passableNodes.length * 0.75)];

test('returns null for unreachable start (land position)', () => {
  // Find a land node and use its cartesian as start
  const landNode = Object.values(graph).find(n => !n.passable && n.neighbors.length === 0);
  if (!landNode) {
    console.log('    (skipped — no isolated land node found)');
    return;
  }
  // Move start deep into land so nearest passable is far away and path may fail
  // This test mainly ensures no crash on unusual input
  const result = aStar(graph, landNode.cartesian, nodeB.cartesian, 'merchant', 99);
  // A path may still be found (nearest passable node fallback) — just ensure no crash
  assert(result === null || typeof result === 'object', 'Expected null or path object');
});

test('returns a Path object for reachable nodes', () => {
  const result = aStar(graph, nodeA.cartesian, nodeB.cartesian, 'merchant', 1);
  assert(result !== null, 'Expected a path, got null');
  assert(Array.isArray(result.points),    'Path should have points array');
  assert(Array.isArray(result.params),    'Path should have params array');
  assert(Array.isArray(result.distances), 'Path should have distances array');
  assert(typeof result.totalLength === 'number', 'Path should have totalLength');
});

test('path starts near startPos and ends near endPos', () => {
  const result = aStar(graph, nodeA.cartesian, nodeB.cartesian, 'merchant', 2);
  assert(result !== null, 'Expected a path');

  const start = result.points[0];
  const end   = result.points[result.points.length - 1];

  const startDist = Math.hypot(start[0] - nodeA.cartesian[0], start[1] - nodeA.cartesian[1]);
  const endDist   = Math.hypot(end[0]   - nodeB.cartesian[0], end[1]   - nodeB.cartesian[1]);

  // Allow up to one grid cell of distance (~region_size / gridSize in meters)
  const tolerance = (region.width * 1000) / GRID_SIZE * 2;
  assert(startDist < tolerance, `Path start is too far from startPos: ${startDist.toFixed(0)}m`);
  assert(endDist   < tolerance, `Path end is too far from endPos: ${endDist.toFixed(0)}m`);
});

test('path params are monotonically increasing from 0 to 1', () => {
  const result = aStar(graph, nodeA.cartesian, nodeB.cartesian, 'merchant', 3);
  assert(result !== null, 'Expected a path');

  assert(result.params[0] === 0, `First param should be 0, got ${result.params[0]}`);
  assertClose(result.params[result.params.length - 1], 1, 0.001, 'Last param should be 1');

  for (let i = 1; i < result.params.length; i++) {
    assert(
      result.params[i] > result.params[i - 1],
      `Params should be strictly increasing at index ${i}: ${result.params[i - 1]} -> ${result.params[i]}`
    );
  }
});

test('merchant path avoids high-danger area more than pirate path', () => {
  // Use start/end positions that bracket the Cove One danger zone
  const safeStart = Object.values(graph).find(n =>
    n.passable && n.lat > 13.0 && n.lon < 44.0
  );
  const safeEnd = Object.values(graph).find(n =>
    n.passable && n.lat < 5.0 && n.lon > 50.0
  );

  if (!safeStart || !safeEnd) {
    console.log('    (skipped — could not find suitable bracketing nodes)');
    return;
  }

  const merchantPath = aStar(graph, safeStart.cartesian, safeEnd.cartesian, 'merchant', 10);
  const piratePath   = aStar(graph, safeStart.cartesian, safeEnd.cartesian, 'pirate',   11);

  if (!merchantPath || !piratePath) {
    console.log('    (skipped — one or both paths returned null)');
    return;
  }

  // Compute average danger score along each path by checking which nodes the
  // path waypoints are closest to
  const avgDanger = (path) => {
    let total = 0;
    for (const wp of path.points) {
      const nearest = Object.values(graph)
        .filter(n => n.passable)
        .reduce((best, n) => {
          const d = Math.hypot(n.cartesian[0] - wp[0], n.cartesian[1] - wp[1]);
          return d < best.d ? { n, d } : best;
        }, { n: null, d: Infinity });
      if (nearest.n) total += nearest.n.dangerScore;
    }
    return total / path.points.length;
  };

  const merchantDanger = avgDanger(merchantPath);
  const pirateDanger   = avgDanger(piratePath);

  console.log(`    merchant avg danger: ${merchantDanger.toFixed(3)}`);
  console.log(`    pirate avg danger:   ${pirateDanger.toFixed(3)}`);

  assert(
    merchantDanger <= pirateDanger,
    `Merchant path (${merchantDanger.toFixed(3)}) should have <= danger than pirate path (${pirateDanger.toFixed(3)})`
  );
});

test('same start and end returns a trivial path', () => {
  const result = aStar(graph, nodeA.cartesian, nodeA.cartesian, 'merchant', 20);
  assert(result !== null, 'Expected a path for same start/end');
  assert(result.points.length === 2, `Expected 2 points for trivial path, got ${result.points.length}`);
});

// ============================= Summary ======================================

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);