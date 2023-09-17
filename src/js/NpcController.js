import Character from './Character'
import gameStore from './gameStore'

export default class NpcController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup

    this.npcs = []

    // create characters
    const npcData = gameStore.getState().npcData
    for (const npc of npcData)
      this.createNpc(npc.name, require('../assets/img/' + npc.file), npc.position.x, npc.position.y, npc.wander)

    this.npcInterval = setInterval(() => {
      this.wanderNpcs()
    }, 3000)
  }

  createNpc(name, sprite, gridX, gridY, wander) {
    const { x, y } = this.map.coordsToPosition(gridX, gridY)

    // using composition for npc objects is simpler
    // could instead have Npc class inherit from Character
    this.npcs.push({
      o: new Character(this.group, sprite, x, y),
      name,
      gridX,
      gridY,
      wander,
      originX: gridX,
      originY: gridY,
      targetX: gridX,
      targetY: gridY,
    })
  }

  isVacant(gridX, gridY) {
    for (const npc of this.npcs) {
      if (npc.gridX == gridX && npc.gridY === gridY) {
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
    let lastHypSquared = 999999999999
    let closestNpc
    for (const npc of this.npcs) {
      const xDist = npc.o.sprite.x() - x
      const yDist = npc.o.sprite.y() - y
      const hypSquared = xDist * xDist + yDist * yDist
      // console.log(npc.name, xDist, yDist, hypSquared)

      if (hypSquared < lastHypSquared) {
        lastHypSquared = hypSquared
        closestNpc = npc
      }
    }

    return lastHypSquared <= 5000 ? closestNpc : null
  }

  wanderNpcs() {
    for (const npc of this.npcs) {
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

        console.log(npc.name, npc.gridX, npc.gridY, npc.targetX, npc.targetY)
      }
    }
  }

  update() {
    const speed = 4

    // if there's a target location that differs from current location, move towards it
    for (let npc of this.npcs) {
      // only move one direction at a time
      if (npc.gridX !== npc.targetX) {
        // make sure it's facing the right direction
        const directionX = npc.targetX > npc.gridX ? 1 : -1
        npc.o.facingDirection = directionX > 0 ? 'right' : 'left'
        npc.o.sprite.scaleX(npc.o.scale * (npc.o.facingDirection === 'right' ? 1 : -1))

        // move if space is vacant
        const newX = npc.o.sprite.attrs.x + speed * directionX
        npc.o.sprite.x(newX)

        // if target reached, update gridX
        if (Math.abs(this.map.coordsToPosition(npc.targetX, npc.targetY).x - newX) < speed)
          npc.gridX = npc.gridX + directionX
      } else if (npc.gridY !== npc.targetY) {
        const directionY = npc.targetY > npc.gridY ? 1 : -1

        // move if space is vacant
        const newY = npc.o.sprite.attrs.y + speed * directionY
        npc.o.sprite.y(newY)

        // if target reached, update gridY
        if (Math.abs(this.map.coordsToPosition(npc.targetX, npc.targetY).y - newY) < speed)
          npc.gridY = npc.gridY + directionY
      }
    }
  }
}
