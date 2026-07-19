import Konva from 'konva'
import SpriteAnimated from '../sprites/SpriteAnimated'
import gameStore from '../state/gameStore'
import Map from '../Map'
import { NPC_CONFIG } from '../constants'

export default class NpcController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup
    this.npcs = []

    // objective arrows live in their own top layer in SCREEN space (not the camera-panned
    // imageGroup) so they can pin to the view edge when the target is off-screen and never
    // hide behind the HUD panel. Raised above the HUD lazily on first update().
    this.markerLayer = new Konva.Layer({ listening: false })
    this.map.stage.add(this.markerLayer)
    this._markerLayerRaised = false
    this._markerCount = 0 // gives each family arrow its own left-edge slot

    // create characters
    const npcData = gameStore.getState().npcData
    for (const npc of npcData) {
      // npc.json can include non-NPC config records (e.g., player spawn).
      // Treat records with a sprite file as NPCs.
      if (npc && npc.file) this.createNpc(npc)
    }
  }

  startWandering() {
    this.npcInterval = setInterval(() => {
      this.wanderNpcs()
    }, NPC_CONFIG.WANDER_INTERVAL)
  }

  createNpc(npc) {
    const { x, y } = this.map.coordsToPosition(npc.gridX, npc.gridY)

    // using composition for npc objects is simpler
    // could instead have Npc class inherit from SpriteAnimated
    const sprite = require('../../assets/img/' + npc.file)
    const npcObj = {
      ...npc,
      type: 'npc',
      o: new SpriteAnimated(this.group, sprite, x, y),
      originX: npc.gridX,
      originY: npc.gridY,
      targetX: npc.gridX,
      targetY: npc.gridY,
      // NPCs with appearAtBricks stay hidden until enough bricks have shipped
      hidden: Boolean(npc.appearAtBricks),
    }
    // each recruitable family member gets its own glowing "go here" arrow (see update())
    if (npc.recruitable) {
      npcObj.markerIndex = this._markerCount++
      npcObj.marker = this.createObjectiveMarker()
    }
    this.npcs.push(npcObj)
  }

  // Bobbing, glowing arrow for an objective NPC. Lives in the screen-space markerLayer;
  // positioned + oriented each frame in update() (above the head, or the view edge).
  createObjectiveMarker() {
    const marker = new Konva.Line({
      points: [-15, -13, 15, -13, 0, 11],
      closed: true,
      fill: '#ffde3d',
      stroke: '#7a5200',
      strokeWidth: 3,
      lineJoin: 'round',
      shadowColor: '#ffde3d',
      shadowBlur: 12,
      shadowOpacity: 0.9,
      listening: false,
      visible: false,
    })
    this.markerLayer.add(marker)
    return marker
  }

  isVacant(gridX, gridY) {
    for (const npc of this.npcs) {
      // Skip recruited NPCs (player-controlled now) and hidden NPCs (not here yet)
      if (npc.recruited || npc.hidden) continue

      if (npc.gridX === gridX && npc.gridY === gridY) {
        return false
      }
    }
    return true
  }

  // checkDistance(x, y) {
  //   const { mapX, mapY } = this.map.positionOnMap(x, y)
  //   const closest = getClosest(mapX, mapY + 14)
  //   if (closest) {
  //     gameStore.getState().showTextPanel()
  //     return closest.name
  //   }
  // }

  getClosest(x, y) {
    const positions = this.npcs
      // Exclude recruited NPCs (now playable characters) and hidden NPCs from interaction proximity.
      .filter((npc) => !npc.recruited && !npc.hidden)
      .map((npc) => ({
        ...npc,
        x: npc.o.sprite.x(),
        y: npc.o.sprite.y(),
      }))
    return Map.findClosest(positions, x, y)
  }

  // The top-left 4x4 (cols 0-3, rows 0-3) is reserved for the wife/son recruitment
  // corner; wanderers never step into it so they can't crowd or block the family.
  inTopLeftReserve(gridX, gridY) {
    return gridX < 4 && gridY < 4
  }

  wanderNpcs() {
    for (const npc of this.npcs) {
      // Skip recruited and hidden NPCs
      if (npc.recruited || npc.hidden) continue

      if (npc.wander) {
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'

        if (direction === 'horizontal') {
          // Move horizontally (left or right by one square)
          const deltaX = Math.random() < 0.5 ? -1 : 1
          npc.targetX = npc.gridX + deltaX
          // if targetX is out of bounds, in the family corner, or occupied, cancel it
          const isOutOfRange = npc.targetX > npc.originX + npc.wander || npc.targetX < npc.originX - npc.wander
          if (isOutOfRange || this.inTopLeftReserve(npc.targetX, npc.targetY) || !this.map.isVacant(npc.targetX, npc.targetY))
            npc.targetX = npc.gridX
        } else {
          // Move vertically (up or down by one square)
          const deltaY = Math.random() < 0.5 ? -1 : 1
          npc.targetY = npc.gridY + deltaY
          // if targetY is out of bounds, in the family corner, or occupied, cancel it
          const isOutOfRange = npc.targetY > npc.originY + npc.wander || npc.targetY < npc.originY - npc.wander
          if (isOutOfRange || this.inTopLeftReserve(npc.targetX, npc.targetY) || !this.map.isVacant(npc.targetX, npc.targetY))
            npc.targetY = npc.gridY
        }

        // console.log(npc.name, npc.gridX, npc.gridY, npc.targetX, npc.targetY)
      }
    }
  }

  update() {
    const speed = 4
    const shipped = gameStore.getState().numBricksShipped

    // if there's a target location that differs from current location, move towards it
    for (let npc of this.npcs) {
      // reveal/keep-hidden NPCs gated on shipped bricks (sprite loads async,
      // so enforce visibility here rather than at creation)
      if (npc.appearAtBricks && npc.o.sprite) {
        if (npc.hidden && shipped >= npc.appearAtBricks) {
          npc.hidden = false
          npc.o.sprite.visible(true)
        } else if (npc.hidden && npc.o.sprite.visible()) {
          npc.o.sprite.visible(false)
        }
      }

      // glowing objective arrow for recruitable family: visible once they've arrived
      // (not hidden) and aren't recruited yet. On-screen it hovers just above the
      // character pointing down; off-screen it pins to the left edge pointing left.
      if (npc.marker) {
        const show = !npc.hidden && !npc.recruited
        npc.marker.visible(show)
        if (show && npc.o.sprite) {
          if (!this._markerLayerRaised) {
            this.markerLayer.moveToTop() // above the HUD, which is created after this controller
            this._markerLayerRaised = true
          }
          const stage = this.map.stage
          const off = this.group.position() // camera pan (imageGroup offset)
          const sx = npc.o.sprite.x() + off.x
          const sy = npc.o.sprite.y() + off.y
          const w = stage.width()
          const h = stage.height()
          const t = performance.now() / 1000
          const bob = Math.abs(Math.sin(t * 2.4)) * 7

          if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
            // on-screen: hover right above the character's own head, pointing down
            npc.marker.points([-11, -10, 11, -10, 0, 8])
            npc.marker.x(sx)
            npc.marker.y(sy - 12 - bob)
          } else {
            // off-screen: pin to a view edge, pointing toward the family. Each arrow gets
            // its own slot so the wife's and son's don't stack.
            const slot = (npc.markerIndex || 0) * 44
            if (Math.max(0, -sy) >= Math.max(0, -sx)) {
              // more above than to the left (player is further below than to the right):
              // top edge, pointing up. Family shares a column, so offset x per slot.
              npc.marker.points([-11, 10, 11, 10, 0, -8])
              npc.marker.x(Math.max(24 + slot, Math.min(w - 24, sx + slot)))
              npc.marker.y(24 + bob)
            } else {
              // more to the left: left edge, pointing left. Family rows differ, so the
              // slot only lifts the minimum (keeps them apart when both clamp to the top).
              npc.marker.points([9, -11, 9, 11, -9, 0])
              npc.marker.x(24 + bob)
              npc.marker.y(Math.max(24 + slot, Math.min(h - 24, sy)))
            }
          }
          npc.marker.shadowBlur(10 + (Math.sin(t * 2.4) + 1) * 6)
        }
      }

      // Skip recruited NPCs (they're now controlled by CharacterController)
      if (npc.recruited || npc.hidden) continue

      // only move one direction at a time
      const axis = npc.gridX !== npc.targetX ? 'x' : npc.gridY !== npc.targetY ? 'y' : null
      if (!axis) continue

      const isX = axis === 'x'
      const gridProp = isX ? 'gridX' : 'gridY'
      const targetProp = isX ? 'targetX' : 'targetY'
      const direction = npc[targetProp] > npc[gridProp] ? 1 : -1

      // make sure it's facing the right direction (only for horizontal movement)
      if (isX) {
        npc.o.facingDirection = direction > 0 ? 'right' : 'left'
        npc.o.sprite.scaleX(npc.o.scale * (npc.o.facingDirection === 'right' ? 1 : -1))
      }

      // move sprite
      const currentPos = npc.o.sprite.attrs[axis]
      const newPos = currentPos + speed * direction
      npc.o.sprite[axis](newPos)

      // if target reached, update grid position
      const targetPixel = this.map.coordsToPosition(npc.targetX, npc.targetY)[axis]
      if (Math.abs(targetPixel - newPos) < speed) {
        npc[gridProp] = npc[gridProp] + direction
      }
    }

    // the marker layer is separate from the sprite-animated map layer, so redraw it here
    this.markerLayer.batchDraw()
  }
}
