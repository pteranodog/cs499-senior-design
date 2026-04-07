import * as behaviors from './behaviors.js';

// Danger weight per ship type. (How "scary" is pirate presence to each ship type)
// Merchants fully consider danger zones, all others ignore them.
const DANGER_WEIGHTS = {
  merchant: 1.0,
  pirate:   0.0,
  patrol:   0.0,
};

const shoreWeight = 0.5;

/**
 * Finds the lowest-cost path through the navgraph from startPos to endPos
 * using A* search, and returns a Path object ready for newFollowPath.
 *
 * @param {object} graph      - Navgraph from buildNavGraph
 * @param {number[]} startPos - Cartesian [x, y] start position
 * @param {number[]} endPos   - Cartesian [x, y] destination position
 * @param {string} shipType   - 'merchant' | 'pirate' | 'patrol'
 * @param {number} pathId     - Numeric ID for the resulting Path object
 * @returns {object|null}     - Assembled Path object, or null if no path found
 */
export function aStar(graph, startPos, endPos, shipType, pathId) {
  const dangerWeight = DANGER_WEIGHTS[shipType] ?? 0;

  // ── Find nearest passable nodes to start and end ─────────────────────
  const startNode = nearestPassableNode(graph, startPos);
  const endNode   = nearestPassableNode(graph, endPos);

  if (!startNode || !endNode) {
    console.warn('aStar: could not find passable nodes near start or end position');
    return null;
  }

  if (startNode.id === endNode.id) {
    // Already at destination — return a trivial single-segment path
    return behaviors.assemblePath(behaviors.newPath([startNode.cartesian, endNode.cartesian], pathId));
  }

  // ── A* search ────────────────────────────────────────────────────────
  // gCost: actual cost from start to this node
  // hCost: heuristic (euclidean distance to end node)
  // fCost: gCost + hCost

  const gCost  = { [startNode.id]: 0 };
  const cameFrom = {};
  const open   = new MinHeap();
  const closed = new Set();

  open.push({ id: startNode.id, f: heuristic(startNode, endNode) });

  while (!open.isEmpty()) {
    const current = open.pop();

    if (current.id === endNode.id) {
      // Reconstruct path and return
      return reconstructPath(graph, cameFrom, startNode.id, endNode.id, pathId);
    }

    if (closed.has(current.id)) continue;
    closed.add(current.id);

    const currentNode = graph[current.id];

    for (const neighborId of currentNode.neighbors) {
      if (closed.has(neighborId)) continue;

      const neighbor = graph[neighborId];

      // Edge cost: euclidean distance between nodes + scaled danger score
      const edgeDist   = euclidean(currentNode.cartesian, neighbor.cartesian);
      const edgeDanger = dangerWeight * neighbor.dangerScore * edgeDist; // scale danger by distance
      const edgeCost   = edgeDist + edgeDanger + (shoreWeight * neighbor.shoreScore * edgeDist);

      const tentativeG = gCost[current.id] + edgeCost;

      if (gCost[neighborId] === undefined || tentativeG < gCost[neighborId]) {
        gCost[neighborId]    = tentativeG;
        cameFrom[neighborId] = current.id;
        const f = tentativeG + heuristic(neighbor, endNode);
        open.push({ id: neighborId, f });
      }
    }
  }

  // Open set exhausted — no path found
  console.warn('aStar: no path found from', startNode.id, 'to', endNode.id);
  return null;
}

// ============================= Path reconstruction ============================

function reconstructPath(graph, cameFrom, startId, endId, pathId) {
  const nodeIds = [];
  let current = endId;

  while (current !== startId) {
    nodeIds.unshift(current);
    current = cameFrom[current];
    if (current === undefined) {
      console.warn('aStar: path reconstruction failed');
      return null;
    }
  }
  nodeIds.unshift(startId);

  const waypoints = nodeIds.map(id => graph[id].cartesian);

  const assembled = behaviors.assemblePath(behaviors.newPath(waypoints, pathId));
  if (!assembled) return null;
  return assembled;
}

// ============================= Helpers =======================================

/**
 * Finds the nearest passable node in the graph to a given cartesian position.
 */
function nearestPassableNode(graph, pos) {
  let nearest  = null;
  let bestDist = Infinity;

  for (const node of Object.values(graph)) {
    if (!node.passable) continue;
    const d = euclidean(pos, node.cartesian);
    if (d < bestDist) {
      bestDist = d;
      nearest  = node;
    }
  }

  return nearest;
}

/**
 * Euclidean distance between two cartesian points.
 */
function euclidean(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * A* heuristic: straight-line distance from node to goal.
 * Admissible since it never overestimates the true cost.
 */
function heuristic(node, goalNode) {
  return euclidean(node.cartesian, goalNode.cartesian);
}

// ============================= Min-heap ======================================
// Simple binary min-heap for the A* open set, keyed on f cost.
// Using a heap rather than sorting an array gives O(log n) push/pop
// instead of O(n log n), which matters for large graphs.

class MinHeap {
  constructor() {
    this.data = [];
  }

  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }

  pop() {
    const top  = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent].f <= this.data[i].f) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left   = 2 * i + 1;
      const right  = 2 * i + 2;
      if (left  < n && this.data[left].f  < this.data[smallest].f) smallest = left;
      if (right < n && this.data[right].f < this.data[smallest].f) smallest = right;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}
