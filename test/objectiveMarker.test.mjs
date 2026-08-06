// Self-check for the objective-arrow edge pinning. The math is only visible in-game
// by walking far off-screen in four directions, so assert it here instead.
// Run: npm test
import assert from 'node:assert/strict'
import { placeMarker } from '../src/js/ui/objectiveMarker.mjs'

const stage = { width: () => 800, height: () => 600 }

// stand-in for a Konva node: same x()/y()/rotation() getter-setter shape
const fakeNode = () => {
  const s = { _x: 0, _y: 0, _r: 0 }
  s.x = (v) => (v === undefined ? s._x : (s._x = v))
  s.y = (v) => (v === undefined ? s._y : (s._y = v))
  s.rotation = (v) => (v === undefined ? s._r : (s._r = v))
  return s
}

const place = (sx, sy, opts) => {
  const n = fakeNode()
  placeMarker(n, sx, sy, stage, opts)
  return { x: n.x(), y: n.y(), rotation: n.rotation() }
}

// on-screen: hovers above the target, pointing down
assert.deepEqual(place(400, 300, { hover: 12 }), { x: 400, y: 288, rotation: 0 })

// on-screen, bobbing lifts it further above the target
assert.equal(place(400, 300, { hover: 12, bob: 7 }).y, 281)

// off each edge: pinned inside the margin, rotated to aim outward at the target
assert.deepEqual(place(400, -500), { x: 400, y: 24, rotation: 180 }) // above -> top edge, points up
assert.deepEqual(place(400, 1100), { x: 400, y: 576, rotation: 0 }) // below -> bottom edge, points down
assert.deepEqual(place(-500, 300), { x: 24, y: 300, rotation: 90 }) // left -> left edge, points left
assert.deepEqual(place(1300, 300), { x: 776, y: 300, rotation: -90 }) // right -> right edge, points right

// diagonal: whichever axis it is further past wins
assert.equal(place(-100, -500).rotation, 180) // 500 above beats 100 left -> top
assert.equal(place(-500, -100).rotation, 90) // 500 left beats 100 above -> left

// off the corner: pinned inside the margins, never off-canvas
const topRight = place(900, -500) // 500 above beats 100 right -> top edge
assert.deepEqual(topRight, { x: 776, y: 24, rotation: 180 })
assert.equal(place(5000, -500).rotation, -90) // 4200 right beats 500 above -> right edge

// slot offsets siblings so two markers on the same edge don't overlap
assert.notEqual(place(400, -500, { slot: 0 }).x, place(400, -500, { slot: 44 }).x)
assert.notEqual(place(-500, 300, { slot: 0 }).y, place(-500, 300, { slot: 44 }).y)

console.log('objectiveMarker: all assertions passed')
