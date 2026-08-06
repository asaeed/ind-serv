// Shared placement for the glowing "go here" arrows (recruitable family in
// NpcController, tutorial stations in ItemController). Markers live in a
// screen-space layer so they can pin to a view edge when the target has panned
// off-screen. A marker's own geometry must point DOWN at rotation 0, so aiming it
// at an edge is just a rotation.
//
// sx/sy are the target's SCREEN coords (world position + imageGroup pan offset).
// `slot` gives sibling markers their own lane so they don't stack on one edge.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function placeMarker(node, sx, sy, stage, { bob = 0, slot = 0, margin = 24, hover = 12 } = {}) {
  const w = stage.width()
  const h = stage.height()

  if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
    // on-screen: hover just above the target, pointing down at it
    node.rotation(0)
    node.x(sx)
    node.y(sy - hover - bob)
    return
  }

  // off-screen: pin to whichever edge the target is furthest past, pointing at it
  const over = { top: -sy, bottom: sy - h, left: -sx, right: sx - w }
  const edge = Object.keys(over).reduce((a, b) => (over[b] > over[a] ? b : a))

  switch (edge) {
    case 'top':
      node.rotation(180)
      node.x(clamp(sx + slot, margin + slot, w - margin))
      node.y(margin + bob)
      break
    case 'bottom':
      node.rotation(0)
      node.x(clamp(sx + slot, margin + slot, w - margin))
      node.y(h - margin - bob)
      break
    case 'left':
      node.rotation(90)
      node.x(margin + bob)
      node.y(clamp(sy + slot, margin + slot, h - margin))
      break
    default: // right
      node.rotation(-90)
      node.x(w - margin - bob)
      node.y(clamp(sy + slot, margin + slot, h - margin))
  }
}
