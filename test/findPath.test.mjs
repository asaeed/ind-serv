// Self-check for tap-to-move pathfinding. Run: npm test
import assert from 'node:assert/strict'
import { findPath } from '../src/js/lib/findPath.mjs'

// '.' walkable, '#' blocked. 6 wide, 5 tall.
const GRID = [
  '......',
  '.####.',
  '.#...#',
  '.#.##.',
  '......',
]
const W = 6
const H = 5
const walkable = (x, y) => GRID[y][x] === '.'
const path = (from, to, isWalkable = walkable) => findPath(from, to, isWalkable, W, H)

// straight line along the open top row
assert.deepEqual(path({ x: 0, y: 0 }, { x: 3, y: 0 }), [
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
])

// already there: nothing to walk
assert.deepEqual(path({ x: 2, y: 2 }, { x: 2, y: 2 }), [])

// must route around the wall rather than through it
const around = path({ x: 0, y: 0 }, { x: 0, y: 4 })
assert.equal(around.length, 4, `expected 4 steps down the left column, got ${around.length}`)
assert.deepEqual(around[around.length - 1], { x: 0, y: 4 })
assert.ok(
  around.every((c) => walkable(c.x, c.y)),
  'path must never step on a blocked cell'
)

// every step is orthogonal and adjacent - no diagonals, no teleports
const legs = [{ x: 0, y: 0 }, ...around]
for (let i = 1; i < legs.length; i++) {
  const d = Math.abs(legs[i].x - legs[i - 1].x) + Math.abs(legs[i].y - legs[i - 1].y)
  assert.equal(d, 1, `step ${i} is not a single orthogonal move`)
}

// blocked goal (a station): stop on its closest reachable neighbour instead of giving up
const toWall = path({ x: 0, y: 0 }, { x: 2, y: 1 })
assert.ok(toWall.length > 0, 'a blocked goal should still walk us adjacent to it')
const last = toWall[toWall.length - 1]
assert.ok(walkable(last.x, last.y), 'must end on a walkable cell')
assert.equal(Math.abs(last.x - 2) + Math.abs(last.y - 1), 1, 'must end adjacent to the goal')

// walled-off goal with no reachable neighbour: no route at all
const sealed = ['...', '.#.', '###', '#@#'].map((r) => r.replace('@', '.'))
assert.deepEqual(findPath({ x: 0, y: 0 }, { x: 1, y: 3 }, (x, y) => sealed[y][x] === '.', 3, 4), [])

// the start cell is never asked about - the mover is standing on it and may report blocked
let askedAboutStart = false
path({ x: 0, y: 0 }, { x: 2, y: 0 }, (x, y) => {
  if (x === 0 && y === 0) askedAboutStart = true
  return walkable(x, y)
})
assert.equal(askedAboutStart, false, 'findPath must not test the start cell')

// out-of-bounds goal doesn't throw or wander off the grid
assert.deepEqual(path({ x: 0, y: 0 }, { x: 99, y: 99 }), [])

console.log('findPath: all assertions passed')
