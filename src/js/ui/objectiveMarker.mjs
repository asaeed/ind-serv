// Shared placement for the glowing "go here" arrows (recruitable family in
// NpcController, tutorial stations in ItemController). Markers live in a
// screen-space layer so they can pin to a view edge when the target has panned
// off-screen. A marker's own geometry must point DOWN at rotation 0, so aiming it
// at an edge is just a rotation.
//
// sx/sy are the target's SCREEN coords (world position + imageGroup pan offset).
// `slot` gives sibling markers their own lane so they don't stack on one edge.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// Two markers pinned to the same edge in the same direction can land on the same spot -
// the wife and son share a column, so both collapse onto one point on the top edge. Ease
// them apart along that edge, with the push fading to nothing as they separate, so the
// stagger can't reintroduce the jump it exists to avoid: by the time one of them scrolls
// into view and starts tracking its own target, the push is already zero.
//
// Called after every marker has been placed for the frame; placeMarker rewrites positions
// from scratch each frame, so the nudges never accumulate.
export function spreadMarkers(markers, stage, { gap = 28, margin = 24 } = {}) {
  const shown = markers.filter((m) => m && m.visible())

  for (let i = 0; i < shown.length; i++) {
    for (let j = i + 1; j < shown.length; j++) {
      const a = shown[i]
      const b = shown[j]
      const dx = b.x() - a.x()
      const dy = b.y() - a.y()
      const distance = Math.hypot(dx, dy)
      if (distance >= gap) continue

      const push = (gap - distance) / 2 // full when dead-on, zero at `gap`
      // spread along the edge they're pinned to; rotation is what says which edge
      const rotation = a.rotation()
      const alongX = rotation === 0 || rotation === 180
      const axis = alongX ? 'x' : 'y'
      const dir = Math.sign(alongX ? dx : dy) || 1

      const aPos = a[axis]() - push * dir
      const bPos = b[axis]() + push * dir

      // Both were probably already jammed against the same limit, so pushing them apart
      // can shove one past it and clip it off-canvas. Slide the pair back as a unit,
      // which keeps them inside the margins without closing the gap again.
      const lo = margin
      const hi = (alongX ? stage.width() : stage.height()) - margin
      const low = Math.min(aPos, bPos)
      const high = Math.max(aPos, bPos)
      const shift = low < lo ? lo - low : high > hi ? hi - high : 0

      a[axis](aPos + shift)
      b[axis](bPos + shift)
    }
  }
}

// Track the target along an edge, kept inside the margins. `slot` only applies when the
// marker is jammed against one of those limits, because that is the only time two markers
// can land on the same spot (both shoved into the same corner). Applying it unconditionally
// - as this used to - held every arrow off its target's true axis, so the arrow visibly
// jumped back into line the moment the target scrolled into view.
function track(value, lo, hi, slot) {
  if (value < lo) return lo + slot
  if (value > hi) return hi - slot
  return value
}

export function placeMarker(node, sx, sy, stage, { bob = 0, slot = 0, margin = 24, hover = 12 } = {}) {
  const w = stage.width()
  const h = stage.height()
  const loX = margin
  const hiX = w - margin
  const loY = margin
  const hiY = h - margin

  if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
    // On-screen: hover just above the target, pointing down at it. Clamped into the same
    // band the pinned case uses, so a target crossing the view edge changes the arrow's
    // rotation without also teleporting it across the margin.
    node.rotation(0)
    node.x(clamp(sx, loX, hiX))
    node.y(clamp(sy - hover - bob, loY, hiY))
    return
  }

  // off-screen: pin to whichever edge the target is furthest past, pointing at it
  const over = { top: -sy, bottom: sy - h, left: -sx, right: sx - w }
  const edge = Object.keys(over).reduce((a, b) => (over[b] > over[a] ? b : a))

  switch (edge) {
    case 'top':
      node.rotation(180)
      node.x(track(sx, loX, hiX, slot))
      node.y(loY + bob)
      break
    case 'bottom':
      node.rotation(0)
      node.x(track(sx, loX, hiX, slot))
      node.y(hiY - bob)
      break
    case 'left':
      node.rotation(90)
      node.x(loX + bob)
      // keep the same hover the on-screen case applies, or y shifts by `hover` at the
      // moment the target crosses the edge
      node.y(track(sy - hover, loY, hiY, slot))
      break
    default: // right
      node.rotation(-90)
      node.x(hiX - bob)
      node.y(track(sy - hover, loY, hiY, slot))
  }
}
