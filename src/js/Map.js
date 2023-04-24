import Konva from 'konva'
import imagePath from '../assets/img/DesertTileMap.png'

export default class Map {
  constructor(layer) {
    this.layer = layer

    const tileSize = 16
    const tileMap = [
      [1, 1, 2, 0, 1, 2],
      [3, 4, 5, 6, 0, 0],
      [2, 0, 1, 5, 9, 8],
    ]
    const upScale = 5
    this.tiles = []

    const imageObj = new Image()
    imageObj.onload = () => {
      for (let y in tileMap)
        for (let x in tileMap[y]) {
          var tile = new Konva.Image({
            image: imageObj,
            cropX: 16 * tileMap[y][x],
            cropY: 0,
            cropWidth: tileSize,
            cropHeight: tileSize,
            x: x * tileSize * upScale,
            y: y * tileSize * upScale,
            width: tileSize * upScale,
            height: tileSize * upScale,
          })
          this.layer.add(tile)
        }

      this.layer.batchDraw()

      // console.log(tile.attrs)
    }
    imageObj.src = imagePath
  }
}
