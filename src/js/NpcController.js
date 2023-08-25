import Character from './Character'
import gameStore from './gameStore'

export default class NpcController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup

    this.gameObjects = []

    // create characters
    const npcs = gameStore.getState().npcs
    for (const npc of npcs)
      this.createCharacter(npc.name, require('../assets/img/' + npc.file), npc.position.x, npc.position.y)
  }

  createCharacter(name, sprite, gridX, gridY) {
    const mult = this.map.tileSize * this.map.upScale

    this.gameObjects.push({
      // TODO: why is this magic number needed? bug somewhere?
      o: new Character(this.group, sprite, gridX * mult + 32, gridY * mult),
      x: gridX,
      y: gridY,
      name,
    })
  }

  isVacant(gridX, gridY) {
    for (const go of this.gameObjects) {
      if (go.x == gridX && go.y === gridY) {
        return false
      }
    }
    return true
  }

  checkDistance(x, y) {
    const { mapX, mapY } = this.map.positionOnMap(x, y)
    const closest = getClosest(mapX, mapY + 14)
    if (closest) {
      gameStore.getState().showTextPanel()
      return closest.name
    }
  }

  getClosest(x, y) {
    let lastHypSquared = 999999999999
    let closestGo
    for (const go of this.gameObjects) {
      const xDist = go.o.sprite.x() - x
      const yDist = go.o.sprite.y() - y
      const hypSquared = xDist * xDist + yDist * yDist
      // console.log(go.name, xDist, yDist, hypSquared)

      if (hypSquared < lastHypSquared) {
        lastHypSquared = hypSquared
        closestGo = go
      }
    }

    return lastHypSquared <= 5000 ? closestGo : null
  }
}
