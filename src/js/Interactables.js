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
  constructor(group) {
    this.group = group

    this.interactables = []

    // create characters
    this.interactables.push(new Character(this.group, worker, 100, 100))
    this.interactables.push(new Character(this.group, villagerWoman, 200, 100))
    this.interactables.push(new Character(this.group, villagerMan, 300, 100))
    this.interactables.push(new Character(this.group, queen, 400, 100))
    this.interactables.push(new Character(this.group, princess, 500, 100))
    this.interactables.push(new Character(this.group, peasant, 100, 200))
    this.interactables.push(new Character(this.group, oldWoman, 200, 200))
    // this.interactables.push(new Character(this.group, oldMan, 300, 200))
    this.interactables.push(new Character(this.group, nobleWoman, 400, 200))
    this.interactables.push(new Character(this.group, nobleMan, 500, 200))
  }
}
