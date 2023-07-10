import Konva from 'konva'
import Interactables from './Interactables'
import tileSheet from '../assets/img/DesertTileMap.png'
import gameStore from './gameStore'

export default class Map {
  constructor(stage, callback) {
    this.stage = stage

    // to be able to use tiny pixel sprites, turn off image smoothing
    this.layer = new Konva.Layer({ imageSmoothingEnabled: false })
    this.stage.add(this.layer)

    const numTilesX = 14
    const numTilesY = 15

    this.tileMap = [
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 45, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 158, 159, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 0, 1, 1, 1, 1, 1, 2, 6, 6, 6, 47, 172, 173, 53, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 14, 6, 6, 6, 6, 6, 14, 6, 6, 6, 6, 186, 187, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 14, 6, 6, 6, 6, 6, 28, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 6, 6],
      [6, 14, 6, 66, 63, 6, 6, 6, 6, 48, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 14, 6, 6],
      [6, 14, 6, 64, 66, 61, 6, 6, 6, 6, 51, 49, 66, 6, 6, 6, 6, 6, 6, 6, 6, 14, 6, 6],
      [66, 14, 6, 62, 64, 6, 6, 6, 6, 6, 137, 138, 138, 139, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [62, 14, 65, 66, 64, 6, 6, 6, 6, 6, 109, 152, 152, 153, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [62, 14, 63, 61, 6, 6, 6, 6, 6, 6, 151, 152, 152, 153, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [62, 14, 63, 61, 6, 6, 6, 6, 6, 6, 151, 152, 152, 153, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [62, 14, 63, 61, 6, 6, 6, 6, 6, 6, 151, 152, 152, 153, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [62, 14, 63, 61, 6, 6, 6, 6, 6, 6, 151, 152, 152, 153, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [62, 14, 63, 61, 6, 6, 6, 6, 6, 6, 151, 152, 152, 153, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    ]
    this.vacantTiles = [0, 1, 2, 6, 14, 28, 61, 62, 63, 64, 65, 66, 109, 186, 187]
    this.tileSize = 16
    this.upScale = 4

    // every tile/sprite that's stuck to the map goes in a single group
    this.imageGroup = new Konva.Group({
      x: 0,
      y: 0,
    })

    // background rect helps with artifacts when tiles redraw
    this.backgroundRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width() + 100,
      height: this.stage.height(),
      fill: '#d6a054',
      listening: false,
    })
    this.imageGroup.add(this.backgroundRect)

    // add map tiles to stage
    this.images = []
    const imageObj = new Image()
    imageObj.onload = () => {
      for (let y in this.tileMap) {
        for (let x in this.tileMap[y]) {
          var image = new Konva.Image({
            image: imageObj,
            cropX: this.tileSize * (this.tileMap[y][x] % numTilesX),
            cropY: this.tileSize * Math.floor(this.tileMap[y][x] / numTilesX),
            cropWidth: this.tileSize,
            cropHeight: this.tileSize,
            x: x * this.tileSize * this.upScale,
            y: y * this.tileSize * this.upScale,
            width: this.tileSize * this.upScale,
            height: this.tileSize * this.upScale,
            listening: false,
          })
          this.images.push(image)
          this.imageGroup.add(image)
        }
      }

      this.layer.add(this.imageGroup)
      this.layer.batchDraw()
      // console.log(tile.attrs)

      this.interactables = new Interactables(this)
      if (callback) callback()
    }
    imageObj.src = tileSheet
  }

  isVacant(x, y) {
    const { gridX, gridY } = this.positionToCoords(x, y)

    // false if out of bounds
    if (!this.tileMap[gridY] || (!this.tileMap[gridY][gridX] && this.tileMap[gridY][gridX] !== 0)) return false

    // true if the location is inhabitable
    const isInhabitable = this.vacantTiles.indexOf(this.tileMap[gridY][gridX]) !== -1
    const isVacant = this.interactables.isVacant(gridX, gridY)

    return isInhabitable && isVacant
  }

  checkInteractables(x, y) {
    const { mapX, mapY } = this.positionOnMap(x, y)
    const closest = this.interactables.getClosest(mapX, mapY + 14)
    if (closest) {
      gameStore.setState({ showTextPanel: true })
      return closest.name
    }
  }

  positionToCoords(x, y) {
    // convert x and y from pixels to grid squares
    const { mapX, mapY } = this.positionOnMap(x, y)

    const gridX = Math.floor(mapX / (this.tileSize * this.upScale))
    const gridY = Math.floor(mapY / (this.tileSize * this.upScale)) + 1

    return { gridX, gridY }
  }

  positionOnMap(x, y) {
    const yAdjust = -14
    const mapX = x - this.imageGroup.attrs.x
    const mapY = y - this.imageGroup.attrs.y + yAdjust

    return { mapX, mapY }
  }
}
