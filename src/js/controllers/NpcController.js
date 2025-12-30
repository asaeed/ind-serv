import SpriteAnimated from '../sprites/SpriteAnimated'
import gameStore from '../state/gameStore'
import Map from '../Map'
import { NPC_CONFIG } from '../constants'

export default class NpcController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup
    this.npcs = []

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
    this.npcs.push({
      ...npc,
      type: 'npc',
      o: new SpriteAnimated(this.group, sprite, x, y),
      originX: npc.gridX,
      originY: npc.gridY,
      targetX: npc.gridX,
      targetY: npc.gridY,
    })
  }

  isVacant(gridX, gridY) {
    for (const npc of this.npcs) {
      // Skip recruited NPCs - they're now player-controlled characters
      if (npc.recruited) continue

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
    const positions = this.npcs.map((npc) => ({
      ...npc,
      x: npc.o.sprite.x(),
      y: npc.o.sprite.y(),
    }))
    return Map.findClosest(positions, x, y)
  }

  wanderNpcs() {
    for (const npc of this.npcs) {
      // Skip recruited NPCs
      if (npc.recruited) continue

      if (npc.wander) {
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical'

        if (direction === 'horizontal') {
          // Move horizontally (left or right by one square)
          const deltaX = Math.random() < 0.5 ? -1 : 1
          npc.targetX = npc.gridX + deltaX
          // if targetX is out of bounds or occupied, cancel it
          const isOutOfRange = npc.targetX > npc.originX + npc.wander || npc.targetX < npc.originX - npc.wander
          if (isOutOfRange || !this.map.isVacant(npc.targetX, npc.targetY)) npc.targetX = npc.gridX
        } else {
          // Move vertically (up or down by one square)
          const deltaY = Math.random() < 0.5 ? -1 : 1
          npc.targetY = npc.gridY + deltaY
          // if targetY is out of bounds or occupied, cancel it
          const isOutOfRange = npc.targetY > npc.originY + npc.wander || npc.targetY < npc.originY - npc.wander
          if (isOutOfRange || !this.map.isVacant(npc.targetX, npc.targetY)) npc.targetY = npc.gridY
        }

        // console.log(npc.name, npc.gridX, npc.gridY, npc.targetX, npc.targetY)
      }
    }
  }

  update() {
    const speed = 4

    // if there's a target location that differs from current location, move towards it
    for (let npc of this.npcs) {
      // Skip recruited NPCs (they're now controlled by CharacterController)
      if (npc.recruited) continue

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
  }
}
