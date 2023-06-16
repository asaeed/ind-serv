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
    this.createCharacter(worker, 2, 2)
    this.createCharacter(villagerWoman, 4, 2)
    // this.createCharacter(villagerMan, 6, 2)
    this.createCharacter(queen, 8, 2)
    this.createCharacter(princess, 2, 4)
    this.createCharacter(peasant, 4, 4)
    this.createCharacter(oldWoman, 6, 4)
    this.createCharacter(nobleWoman, 8, 4)
    this.createCharacter(nobleMan, 13, 3)
  }

  createCharacter(sprite, gridX, gridY) {
    const mult = this.map.tileSize * this.map.upScale

    this.gameObjects.push({
      o: new Character(this.group, sprite, gridX * mult, gridY * mult),
      x: gridX,
      y: gridY,
    })
  }
}
