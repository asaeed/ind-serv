import Konva from 'konva'
import Input from './Input'
import Map from './Map'
import Player from './Player'
import Hud from './ui/Hud'
import gameStore from './state/gameStore'
import { GAME_CONFIG } from './constants'

export default class Game {
  constructor() {
    this.stage = new Konva.Stage({
      container: 'canvas-container',
      width: GAME_CONFIG.CANVAS_WIDTH,
      height: GAME_CONFIG.CANVAS_HEIGHT,
    })

    // map creates a layer
    this.map = new Map(this.stage, () => {
      this.hud = new Hud(this.stage) // hud creates it's own layer on top
      this.input = new Input() // keyboard events
      this.player = new Player(this.map, this.input)
    })

    // Debug output (development only)
    if (process.env.NODE_ENV !== 'production') {
      this.storeDiv = document.querySelector('.store > .value')
      if (this.storeDiv) {
        gameStore.subscribe(
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
    }
  }

  update(tFrame) {
    this.player && this.player.update()
    this.map && this.map.update()
    this.hud && this.hud.update()
  }

  mainLoop() {
    let msPrev = window.performance.now()
    const msPerFrame = 1000 / GAME_CONFIG.TARGET_FPS
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
