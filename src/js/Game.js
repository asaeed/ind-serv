import Konva from 'konva'
import Input from './Input'
import Map from './Map'
import Player from './Player'
import Hud from './Hud'
import gameStore from './gameStore'

export default class Game {
  constructor() {
    this.framesDiv = document.querySelector('.frame-num > .value')
    this.secondsDiv = document.querySelector('.seconds-passed > .value')
    this.directionDiv = document.querySelector('.direction > .value')
    this.storeDiv = document.querySelector('.store > .value')
    this.startTime = Date.now()

    this.stage = new Konva.Stage({
      container: 'canvas-container',
      width: 1000,
      height: 600,
    })

    // map creates a layer
    this.map = new Map(this.stage, () => {
      this.hud = new Hud(this.stage) // hud creates it's own layer on top
      this.input = new Input() // keyboard events
      this.player = new Player(this.map, this.input)
    })

    // TODO: for debug only
    const unsubscribe = gameStore.subscribe(
      (state) => {
        this.storeDiv.innerHTML = JSON.stringify(gameStore.getState())
      },
      (state) => state
    )
  }

  update(tFrame) {
    this.framesDiv.innerHTML = tFrame
    this.secondsDiv.innerHTML = (Date.now() - this.startTime) / 1000
    this.directionDiv.innerHTML = JSON.stringify(this.input.directionPress)

    this.player.update()
    this.map.update()
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
