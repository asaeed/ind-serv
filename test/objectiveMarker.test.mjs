// Self-check for the objective-arrow edge pinning. The math is only visible in-game
// by walking far off-screen in four directions, so assert it here instead.
// Run: npm test
import assert from 'node:assert/strict'
import { placeMarker, spreadMarkers } from '../src/js/ui/objectiveMarker.mjs'

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
// side edges carry the same `hover` the on-screen case uses (300 - 12), so y doesn't
// shift when the target crosses the edge
assert.deepEqual(place(-500, 300), { x: 24, y: 288, rotation: 90 }) // left -> left edge, points left
assert.deepEqual(place(1300, 300), { x: 776, y: 288, rotation: -90 }) // right -> right edge, points right

// diagonal: whichever axis it is further past wins
assert.equal(place(-100, -500).rotation, 180) // 500 above beats 100 left -> top
assert.equal(place(-500, -100).rotation, 90) // 500 left beats 100 above -> left

// off the corner: pinned inside the margins, never off-canvas
const topRight = place(900, -500) // 500 above beats 100 right -> top edge
assert.deepEqual(topRight, { x: 776, y: 24, rotation: 180 })
assert.equal(place(5000, -500).rotation, -90) // 4200 right beats 500 above -> right edge

// A marker still tracking its target is NOT nudged by slot: that offset held the arrow
// off the target's true axis, which showed up as a jump when the target scrolled in.
assert.equal(place(400, -500, { slot: 0 }).x, place(400, -500, { slot: 44 }).x)
assert.equal(place(-500, 300, { slot: 0 }).y, place(-500, 300, { slot: 44 }).y)

// slot still separates siblings jammed into the same corner - the only case where two
// markers genuinely land on the same spot
assert.notEqual(place(-900, -5000, { slot: 0 }).x, place(-900, -5000, { slot: 44 }).x)
assert.notEqual(place(-5000, -900, { slot: 0 }).y, place(-5000, -900, { slot: 44 }).y)

// Crossing the view edge must not teleport the arrow. Either side of each boundary the
// position is identical; only the rotation flips.
const insideRight = place(800, 300)
const outsideRight = place(801, 300)
assert.equal(insideRight.x, outsideRight.x, 'x jumps as the target crosses the right edge')
assert.notEqual(insideRight.rotation, outsideRight.rotation)

assert.equal(place(300, 600).y, place(300, 601).y, 'y jumps as the target crosses the bottom edge')
assert.equal(place(0, 300).x, place(-1, 300).x, 'x jumps as the target crosses the left edge')

// Sweep a target across each edge a pixel at a time: the arrow must never move more than
// the target did. This is the bug that showed up in game as the arrow snapping into line
// the moment its station scrolled into view.
const sweep = (from, to, at) => {
  let prev = null
  let worst = 0
  for (let v = from; v <= to; v++) {
    const p = at(v)
    if (prev) worst = Math.max(worst, Math.abs(p.x - prev.x), Math.abs(p.y - prev.y))
    prev = p
  }
  return worst
}
assert.ok(sweep(700, 900, (v) => place(v, 300)) <= 1, 'arrow jumps sweeping across the right edge')
assert.ok(sweep(-100, 100, (v) => place(v, 300)) <= 1, 'arrow jumps sweeping across the left edge')
assert.ok(sweep(500, 700, (v) => place(300, v)) <= 1, 'arrow jumps sweeping across the bottom edge')
assert.ok(sweep(-100, 100, (v) => place(300, v)) <= 1, 'arrow jumps sweeping across the top edge')

// and the arrow always stays inside the margins, even for a target at the very edge
for (const [x, y] of [[0, 0], [800, 600], [5, 595], [795, 5]]) {
  const p = place(x, y)
  assert.ok(p.x >= 24 && p.x <= 776, `x ${p.x} escaped the margins for target ${x},${y}`)
  assert.ok(p.y >= 24 && p.y <= 576, `y ${p.y} escaped the margins for target ${x},${y}`)
}

// --- spreadMarkers: keep two pinned arrows off each other without reintroducing a jump ---

const marker = (x, y, rotation = 180) => {
  const n = fakeNode()
  n.x(x)
  n.y(y)
  n.rotation(rotation)
  n.visible = () => true
  return n
}

// dead-on overlap (wife and son share a column, both pinned to the top edge): separated
const a = marker(400, 24)
const b = marker(400, 24)
spreadMarkers([a, b], stage, { gap: 28 })
assert.equal(Math.abs(b.x() - a.x()), 28, 'coincident markers should end up a full gap apart')
assert.equal(a.y(), 24, 'stagger must stay along the edge, not push off it')

// pinned to a side edge (rotation 90) staggers along y instead
const c = marker(24, 300, 90)
const d = marker(24, 300, 90)
spreadMarkers([c, d], stage, { gap: 28 })
assert.equal(Math.abs(d.y() - c.y()), 28)
assert.equal(c.x(), 24)

// already further apart than the gap: left completely alone
const e = marker(200, 24)
const f = marker(400, 24)
spreadMarkers([e, f], stage, { gap: 28 })
assert.equal(e.x(), 200)
assert.equal(f.x(), 400)

// The push fades to zero as they separate, so nothing snaps when one scrolls into view.
// Sweep one marker away from the other and check the applied stagger only ever shrinks.
let previousPush = Infinity
for (let d2 = 0; d2 <= 30; d2++) {
  const p = marker(400, 24)
  const q = marker(400 + d2, 24)
  spreadMarkers([p, q], stage, { gap: 28 })
  const push = Math.abs(q.x() - (400 + d2)) // how far q was displaced
  assert.ok(push <= previousPush + 1e-9, `stagger grew as markers separated (gap ${d2})`)
  previousPush = push
}
assert.equal(previousPush, 0, 'stagger must reach exactly zero by the time they are a gap apart')

// a pair jammed into a corner is staggered without either escaping the margins
const g = marker(24, 24)
const h2 = marker(24, 24)
spreadMarkers([g, h2], stage, { gap: 28 })
assert.equal(Math.abs(h2.x() - g.x()), 28, 'corner pair should still separate')
for (const m of [g, h2]) {
  assert.ok(m.x() >= 24 && m.x() <= 776, `stagger pushed a marker off-canvas at x ${m.x()}`)
}

// hidden markers are ignored
const visible = marker(400, 24)
const hidden = marker(400, 24)
hidden.visible = () => false
spreadMarkers([visible, hidden], stage, { gap: 28 })
assert.equal(visible.x(), 400, 'a hidden marker should not shove a visible one')

console.log('objectiveMarker: all assertions passed')
