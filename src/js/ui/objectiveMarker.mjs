// Shared placement for the glowing "go here" arrows (recruitable family in
// NpcController, tutorial stations in ItemController). Markers live in a
// screen-space layer so they can pin to a view edge when the target has panned
// off-screen. A marker's own geometry must point DOWN at rotation 0, so aiming it
// at an edge is just a rotation.
//
// sx/sy are the target's SCREEN coords (world position + imageGroup pan offset).
// `slot` gives sibling markers their own lane so they don't stack on one edge.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

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
