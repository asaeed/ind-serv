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
      this.createCharacter(npc.name, require('../assets/img/' + npc.file), npc.position.x, npc.position.y)
  }

  createCharacter(name, sprite, gridX, gridY) {
    const { x, y } = this.map.coordsToPosition(gridX, gridY)

    // using composition for npc objects is simpler
    // could instead have Npc class inherit from Character
    this.npcs.push({
      o: new Character(this.group, sprite, x, y),
      x: gridX,
      y: gridY,
      name,
    })
  }

  isVacant(gridX, gridY) {
    for (const go of this.npcs) {
      if (go.x == gridX && go.y === gridY) {
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
}
