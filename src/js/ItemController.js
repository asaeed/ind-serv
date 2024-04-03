import Character from './Character'
import gameStore from './gameStore'

export default class ItemController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup
    this.items = []

    // create characters
    const itemData = gameStore.getState().itemData
    for (const item of itemData) this.createItem(item)
  }

  createItem(item) {
    const { x, y } = this.map.coordsToPosition(item.gridX, item.gridY)
    const sprite = require('../assets/img/' + item.file)

    this.items.push({
      o: new Character(this.group, sprite, x, y),
      ...item,
    })
  }

  isVacant(gridX, gridY) {
    for (const item of this.items) {
      if (item.gridX == gridX && item.gridY === gridY) {
        return false
      }
    }
    return true
  }

  getClosest(x, y) {
    let lastHypSquared = 999999999999
    let closestItem
    for (const item of this.items) {
      const xDist = item.o.sprite.x() - x
      const yDist = item.o.sprite.y() - y
      const hypSquared = xDist * xDist + yDist * yDist
      // console.log(item.name, xDist, yDist, hypSquared)

      if (hypSquared < lastHypSquared) {
        lastHypSquared = hypSquared
        closestItem = item
        closestItem.distSq = hypSquared
      }
    }

    return closestItem
  }

  update() {}
}
