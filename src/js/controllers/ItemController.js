import SpriteStatic from '../sprites/SpriteStatic'
import gameStore from '../state/gameStore'
import Map from '../Map'

export default class ItemController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup
    this.items = []

    // create items
    const itemData = gameStore.getState().itemData
    for (const item of itemData) this.createItem(item)
  }

  createItem(item) {
    const { x, y } = this.map.coordsToPosition(item.gridX, item.gridY)
    const sprite = require('../../assets/img/' + item.file)

    this.items.push({
      o: new SpriteStatic(this.group, sprite, x, y),
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
    const positions = this.items.map((item) => ({
      ...item,
      x: item.o.image.x(),
      y: item.o.image.y(),
    }))
    return Map.findClosest(positions, x, y)
  }

  update() {}
}
