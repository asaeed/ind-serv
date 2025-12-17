import Konva from 'konva'
import Input from './Input'
import Map from './Map'
import Player from './Player'
import Hud from './ui/Hud'
import gameStore from './state/gameStore'

export default class Game {
  constructor() {
    // this.framesDiv = document.querySelector('.frame-num > .value')
    // this.secondsDiv = document.querySelector('.seconds-passed > .value')
    // this.directionDiv = document.querySelector('.direction > .value')
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
        const s = JSON.parse(JSON.stringify(state))
        s.mapData = undefined
        s.npcData = undefined
        s.itemData = undefined
        this.storeDiv.innerText = JSON.stringify(s, null, 4)
      },
      (state) => state
    )
  }

  update(tFrame) {
    // this.framesDiv.innerHTML = tFrame
    // this.secondsDiv.innerHTML = (Date.now() - this.startTime) / 1000
    // this.directionDiv.innerHTML = JSON.stringify(this.input.directionPress)

    this.player && this.player.update()
    this.map && this.map.update()
    this.hud && this.hud.update()
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

  dispose() {
    // stop the animation loop
    if (this.stopMain) {
      window.cancelAnimationFrame(this.stopMain)
    }

    // cleanup input event listeners
    if (this.input && this.input.dispose) {
      this.input.dispose()
    }

    // destroy konva stage (this also destroys all layers and shapes)
    if (this.stage) {
      this.stage.destroy()
    }
  }
}
