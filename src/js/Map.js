import Konva from 'konva'
import Character from './Character'
import worker from '../assets/img/MiniWorker.png'
import villagerWoman from '../assets/img/MiniVillagerWoman.png'
import villagerMan from '../assets/img/MiniVillagerMan.png'
import queen from '../assets/img/MiniQueen.png'
import princess from '../assets/img/MiniPrincess.png'
import peasant from '../assets/img/MiniPeasant.png'
import oldMan from '../assets/img/MiniOldMan.png'
import oldWoman from '../assets/img/MiniOldWoman.png'
import nobleWoman from '../assets/img/MiniNobleWoman.png'
import nobleMan from '../assets/img/MiniNobleMan.png'
import tileSheet from '../assets/img/DesertTileMap.png'

export default class Map {
  constructor(stage) {
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
      width: this.stage.width(),
      height: this.stage.height(),
      fill: '#d6a054',
      listening: false,
    })
    this.imageGroup.add(this.backgroundRect)

    // add map tiles to stage
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
          this.imageGroup.add(image)
        }
      }

      this.layer.add(this.imageGroup)
      this.layer.batchDraw()
      // console.log(tile.attrs)

      this.createCharacters()
    }
    imageObj.src = tileSheet
  }

  createCharacters() {
    this.interactables = []

    // create characters
    this.interactables.push(new Character(this.imageGroup, worker, 100, 100))
    this.interactables.push(new Character(this.imageGroup, villagerWoman, 200, 100))
    // this.interactables.push(new Character(this.imageGroup, villagerMan, 300, 100))
    this.interactables.push(new Character(this.imageGroup, queen, 400, 100))
    this.interactables.push(new Character(this.imageGroup, princess, 500, 100))
    this.interactables.push(new Character(this.imageGroup, peasant, 100, 200))
    this.interactables.push(new Character(this.imageGroup, oldWoman, 200, 200))
    this.interactables.push(new Character(this.imageGroup, oldMan, 300, 200))
    this.interactables.push(new Character(this.imageGroup, nobleWoman, 400, 200))
    this.interactables.push(new Character(this.imageGroup, nobleMan, 500, 200))
  }

  isVacant(x, y) {
    // convert x and y from pixels to grid squares
    const yAdjust = -14
    const gridX = Math.floor((x - this.imageGroup.attrs.x) / (this.tileSize * this.upScale))
    const gridY = Math.floor((y - this.imageGroup.attrs.y + yAdjust) / (this.tileSize * this.upScale)) + 1

    // false if out of bounds
    if (!this.tileMap[gridY] || (!this.tileMap[gridY][gridX] && this.tileMap[gridY][gridX] !== 0)) return false

    // true if the location is inhabitable
    return this.vacantTiles.indexOf(this.tileMap[gridY][gridX]) !== -1
  }
}
