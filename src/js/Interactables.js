import Konva from 'konva'
import Character from './Character'
import worker from '../assets/img/MiniWorker.png'
import villagerWoman from '../assets/img/MiniVillagerWoman.png'
import villagerMan from '../assets/img/MiniVillagerMan.png'
import queen from '../assets/img/MiniQueen.png'
import princess from '../assets/img/MiniPrincess.png'
import peasant from '../assets/img/MiniPeasant.png'
import oldWoman from '../assets/img/MiniOldWoman.png'
import nobleWoman from '../assets/img/MiniNobleWoman.png'
import nobleMan from '../assets/img/MiniNobleMan.png'

export default class Interactables {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup

    this.gameObjects = []

    // create characters
    this.createCharacter('worker', worker, 2, 2)
    this.createCharacter('villagerWoman', villagerWoman, 4, 2)
    // this.createCharacter('villagerMan', villagerMan, 6, 2)
    this.createCharacter('queen', queen, 8, 2)
    this.createCharacter('princess', princess, 2, 4)
    this.createCharacter('peasant', peasant, 4, 4)
    this.createCharacter('oldWoman', oldWoman, 6, 4)
    this.createCharacter('nobleWoman', nobleWoman, 8, 4)
    this.createCharacter('nobleMan', nobleMan, 13, 3)
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
