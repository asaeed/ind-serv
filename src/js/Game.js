import Konva from 'konva'
import Input from './Input'
import Map from './Map'
import Character from './Character'
import Player from './Player'

import worker from '../assets/img/MiniWorker.png'
import villagerWoman from '../assets/img/MiniVillagerWoman.png'
import villagerMan from '../assets/img/MiniVillagerMan.png'
import queen from '../assets/img/MiniQueen.png'
import princess from '../assets/img/MiniPrincess.png'
import peasant from '../assets/img/MiniPeasant.png'
import oldWoman from '../assets/img/MiniOldWoman.png'
import oldMan from '../assets/img/MiniOldMan.png'
import nobleWoman from '../assets/img/MiniNobleWoman.png'
import nobleMan from '../assets/img/MiniNobleMan.png'

export default class Game {
  constructor(document) {
    this.framesDiv = document.querySelector('.frame-num > .value')
    this.secondsDiv = document.querySelector('.seconds-passed > .value')
    this.directionDiv = document.querySelector('.direction > .value')
    this.startTime = Date.now()

    this.stage = new Konva.Stage({
      container: 'canvas-container', // id of container <div>
      width: 1000,
      height: 600,
    })

    // to be able to use tiny pixel sprites, turn off image smoothing
    this.layerStatic = new Konva.Layer({ imageSmoothingEnabled: false })
    this.layerAnim = new Konva.Layer({ imageSmoothingEnabled: false })

    this.input = new Input(document)

    this.map = new Map(this.layerStatic)

    this.player = new Player(this.layerAnim, oldMan, 400, 300)
    this.sprite0 = new Character(this.layerAnim, worker, 100, 100)
    this.sprite1 = new Character(this.layerAnim, villagerWoman, 200, 100)
    this.sprite2 = new Character(this.layerAnim, villagerMan, 300, 100)
    this.sprite3 = new Character(this.layerAnim, queen, 400, 100)
    this.sprite4 = new Character(this.layerAnim, princess, 500, 100)
    this.sprite5 = new Character(this.layerAnim, peasant, 100, 200)
    this.sprite6 = new Character(this.layerAnim, oldWoman, 200, 200)
    this.sprite7 = new Character(this.layerAnim, oldMan, 300, 200)
    this.sprite8 = new Character(this.layerAnim, nobleWoman, 400, 200)
    this.sprite9 = new Character(this.layerAnim, nobleMan, 500, 200)

    this.stage.add(this.layerStatic)
    this.stage.add(this.layerAnim)

    // test code below

    this.circle = new Konva.Circle({
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
      radius: 70,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
    })
    // this.layerStatic.add(this.circle)

    this.blueHex = new Konva.RegularPolygon({
      x: 50,
      y: this.stage.height() / 2,
      sides: 6,
      radius: 40,
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: 4,
      draggable: true,
    })
    // this.layerAnim.add(this.blueHex)
  }

  update(tFrame) {
    this.framesDiv.innerHTML = tFrame
    this.secondsDiv.innerHTML = (Date.now() - this.startTime) / 1000
    this.directionDiv.innerHTML = JSON.stringify(this.input.directionPress)

    this.player.update(this.input, this.map)

    var period = 2000
    var scale = Math.sin((tFrame * 2 * Math.PI) / period) + 0.001
    this.blueHex.scale({ x: scale, y: scale })
  }

  mainLoop() {
    let msPrev = window.performance.now()
    const fps = 60
    const msPerFrame = 1000 / fps
    const main = (tFrame) => {
      this.stopMain = window.requestAnimationFrame(main)

      const msNow = window.performance.now()
      const msPassed = msNow - msPrev

      if (msPassed < msPerFrame) return

      this.update(tFrame) // pass rAF's timestamp.

      const excessTime = msPassed % msPerFrame
      msPrev = msNow - excessTime
    }
    main()
  }
}
