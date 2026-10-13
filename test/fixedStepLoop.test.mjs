import assert from 'node:assert/strict'
import FixedStepLoop from '../src/js/lib/FixedStepLoop.mjs'

// The player moves 4 pixels per simulation step. Rendering less frequently must
// preserve the same distance per second, and keep each collision step small.
for (const fps of [15, 30, 60, 120, 144]) {
  let distance = 0
  let steps = 0
  const loop = new FixedStepLoop(() => { distance += 4; steps++ })
  for (let frame = 0; frame <= fps * 2; frame++) loop.advance(frame * 1000 / fps)
  assert.equal(distance, 480, `${fps} FPS must move 240 pixels per second`)
  assert.equal(steps, 120)
}

// An irregular frame cadence should not lose fractional simulation time.
let steps = 0
const loop = new FixedStepLoop(() => steps++)
for (const timestamp of [0, 5, 17, 29, 50, 82, 100, 167, 200]) loop.advance(timestamp)
assert.equal(steps, 12)

// A blocked tile is checked every 4 pixels even on a slow rendering frame.
let x = 0
const collisionLoop = new FixedStepLoop(() => { if (x + 4 < 12) x += 4 })
collisionLoop.advance(0)
collisionLoop.advance(100)
assert.equal(x, 8, 'catch-up must not jump through a blocked tile')

// Bound catch-up work after a long stall, then return to normal timing.
loop.advance(5200)
assert.equal(steps, 18, 'long stalls must run at most six steps')
loop.advance(5200 + 1000 / 60)
assert.equal(steps, 19)

// Returning to a backgrounded tab starts a new clock, with no accumulated move.
loop.reset()
loop.advance(20000)
assert.equal(steps, 19)
loop.advance(20000 + 1000 / 60)
assert.equal(steps, 20)

console.log('fixedStepLoop: all assertions passed')
