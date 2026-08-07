// Rudimentary 4-way BFS over the tile grid. The map is 24x15, so even a full flood fill
// is a few hundred cells - A* and its heuristics would be pure overhead here.
//
// Returns the cells to walk THROUGH, excluding the start, or [] when there's no route.
// When the goal itself is blocked - a kiln, a wandering NPC - the closest reachable
// neighbour of the goal is used instead, so tapping a station walks you up to it rather
// than doing nothing.
//
// isWalkable is never called for the start cell: the mover is standing there, so it may
// well report itself as blocked.
const DIRECTIONS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
]

export function findPath(start, goal, isWalkable, width, height) {
  const key = (x, y) => y * width + x
  const startKey = key(start.x, start.y)

  const dist = new Map([[startKey, 0]])
  const prev = new Map()

  // plain array as the queue; head index instead of shift() so it stays O(1)
  const queue = [start]
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]
    if (cur.x === goal.x && cur.y === goal.y) break

    for (const [dx, dy] of DIRECTIONS) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue

      const k = key(nx, ny)
      if (dist.has(k) || !isWalkable(nx, ny)) continue

      dist.set(k, dist.get(key(cur.x, cur.y)) + 1)
      prev.set(k, cur)
      queue.push({ x: nx, y: ny })
    }
  }

  // Goal blocked or walled off: settle for whichever of its neighbours we can reach
  // soonest. Falling back like this is what makes tapping an object useful.
  let end = goal
  if (!dist.has(key(goal.x, goal.y))) {
    let best = null
    for (const [dx, dy] of DIRECTIONS) {
      const n = { x: goal.x + dx, y: goal.y + dy }
      const d = dist.get(key(n.x, n.y))
      if (d === undefined) continue
      if (!best || d < best.d) best = { x: n.x, y: n.y, d }
    }
    if (!best) return []
    end = best
  }

  const path = []
  let node = end
  while (node.x !== start.x || node.y !== start.y) {
    path.unshift({ x: node.x, y: node.y })
    node = prev.get(key(node.x, node.y))
    if (!node) return [] // unreachable; never spin
  }
  return path
}
