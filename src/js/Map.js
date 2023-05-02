import Konva from 'konva'
import imagePath from '../assets/img/DesertTileMap.png'

export default class Map {
  constructor(layer) {
    this.layer = layer

    const numTilesX = 14
    const numTilesY = 15

    this.tileMap = [
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      [6, 45, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 158, 159, 6, 6],
      [6, 0, 1, 1, 1, 1, 1, 2, 6, 6, 6, 47, 172, 173, 53, 6],
      [6, 14, 6, 6, 6, 6, 6, 14, 6, 6, 6, 6, 186, 187, 6, 6],
      [6, 14, 6, 6, 6, 6, 6, 28, 1, 1, 1, 1, 1, 1, 1, 1],
      [6, 14, 6, 66, 63, 6, 6, 6, 6, 48, 6, 6, 6, 6, 6, 6],
      [6, 14, 6, 64, 66, 61, 6, 6, 6, 6, 51, 49, 66, 6, 6, 6],
      [66, 14, 6, 62, 64, 6, 6, 6, 6, 6, 137, 138, 138, 139, 6, 6],
      [62, 14, 65, 66, 64, 6, 6, 6, 6, 6, 109, 152, 152, 152, 6, 6],
      [62, 14, 63, 61, 6, 6, 6, 6, 6, 6, 151, 152, 152, 152, 6, 6],
    ]
    this.vacantTiles = [0, 1, 2, 6, 14, 28, 61, 62, 63, 64, 65, 66, 109, 186, 187]
    this.tileSize = 16
    this.upScale = 4

    const imageObj = new Image()
    imageObj.onload = () => {
      for (let y in this.tileMap)
        for (let x in this.tileMap[y]) {
          var tile = new Konva.Image({
            image: imageObj,
            cropX: this.tileSize * (this.tileMap[y][x] % numTilesX),
            cropY: this.tileSize * Math.floor(this.tileMap[y][x] / numTilesX),
            cropWidth: this.tileSize,
            cropHeight: this.tileSize,
            x: x * this.tileSize * this.upScale,
            y: y * this.tileSize * this.upScale,
            width: this.tileSize * this.upScale,
            height: this.tileSize * this.upScale,
          })
          this.layer.add(tile)
        }

      this.layer.batchDraw()

      // console.log(tile.attrs)
    }
    imageObj.src = imagePath
  }

  isVacant(x, y) {
    // convert x and y from pixels to grid squares
    const yAdjust = -14
    const gridX = Math.floor(x / (this.tileSize * this.upScale))
    const gridY = Math.floor((y + yAdjust) / (this.tileSize * this.upScale)) + 1

    // false if out of bounds
    if (!this.tileMap[gridY] || (!this.tileMap[gridY][gridX] && this.tileMap[gridY][gridX] !== 0)) return false

    // true if the location is inhabitable
    console.log(gridX, gridY, this.tileMap[gridY][gridX])
    return this.vacantTiles.indexOf(this.tileMap[gridY][gridX]) !== -1
  }
}
