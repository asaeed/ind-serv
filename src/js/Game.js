import Konva from 'konva'
import Input from './Input'
import Map from './Map'
import CharacterController from './controllers/CharacterController'
import Hud from './ui/Hud'
import TouchControls from './ui/TouchControls'
import EndGame from './ui/EndGame'
import StartGame from './ui/StartGame'
import InfoModal from './ui/InfoModal'
import gameStore from './state/gameStore'
import { GAME_CONFIG } from './constants'

export default class Game {
  constructor() {
    this.stage = new Konva.Stage({
      container: 'canvas-container',
      width: GAME_CONFIG.CANVAS_WIDTH,
      height: GAME_CONFIG.CANVAS_HEIGHT,
    })

    this._handleResize = this._handleResize.bind(this)
    this._handleResize()
    window.addEventListener('resize', this._handleResize)
    window.addEventListener('orientationchange', this._handleResize)

    // map creates a layer
    this.map = new Map(this.stage, () => {
      this.hud = new Hud(this.stage) // hud creates it's own layer on top
      this.input = new Input() // keyboard events
      this.touchControls = new TouchControls(this.input)
      this.touchControls.init()
      this.characterController = new CharacterController(this.map, this.input)
      this.endGame = new EndGame()
      this.startGame = new StartGame() // opening narration fires when Start is clicked
      this.infoModal = new InfoModal()
      this._applyUrlParams() // dev/review shortcuts (?end, ?bricks=N)
    })

    // Debug output (development only)
    if (process.env.NODE_ENV !== 'production') {
      window.gameStore = gameStore // console access for testing (e.g. fast-forwarding bricks)
      window.sfx = require('./lib/sfx').default // live sound-param tuning in the console
      this.storeDiv = document.querySelector('.store > .value')
      if (this.storeDiv) {
        this.storeDiv.parentElement.style.display = 'block' // hidden by default in CSS
        gameStore.subscribe(
          (state) => {
            const s = JSON.parse(JSON.stringify(state))
            s.mapData = undefined
            s.npcData = undefined
            s.itemData = undefined
            s.tracking = undefined // Hide tracking data from debug output
            this.storeDiv.innerText = JSON.stringify(s, null, 4)
          },
          (state) => state
        )
      }
    }
  }

  // dev/review shortcuts via URL params:
  //   ?end        reveal the end screen immediately (no full playthrough needed)
  //   ?bricks=N   start the game already N bricks in (family + arrows appear if N >= 13)
  // Note: ?bricks doesn't retro-fire past events (no debt banners / price drops).
  _applyUrlParams() {
    const params = new URLSearchParams(window.location.search)

    const bricks = parseInt(params.get('bricks'), 10)
    if (Number.isFinite(bricks) && bricks > 0) {
      gameStore.getState().startGame()
      gameStore.setState({ numBricksShipped: bricks })
      document.querySelector('.start-page')?.classList.add('hidden')
    }

    if (params.has('end')) {
      gameStore.getState().startGame() // sets startTime so the "years worked" stat renders
      document.querySelector('.start-page')?.classList.add('hidden')
      this.endGame.handleClick() // acceptFate + fill stats + reveal the end page
    }
  }

  update(tFrame) {
    const { gameStarted, gameOver } = gameStore.getState()
    if (!gameStarted || gameOver) return // start screen or end page is showing
    this.characterController && this.characterController.update()
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

    // cleanup character controller
    if (this.characterController && this.characterController.dispose) {
      this.characterController.dispose()
    }

    // cleanup input event listeners
    if (this.input && this.input.dispose) {
      this.input.dispose()
    }

    if (this.touchControls && this.touchControls.dispose) {
      this.touchControls.dispose()
    }

    if (this.endGame && this.endGame.dispose) {
      this.endGame.dispose()
    }

    if (this.infoModal && this.infoModal.dispose) {
      this.infoModal.dispose()
    }

    // destroy konva stage (this also destroys all layers and shapes)
    if (this.stage) {
      this.stage.destroy()
    }

    window.removeEventListener('resize', this._handleResize)
    window.removeEventListener('orientationchange', this._handleResize)
  }

  _handleResize() {
    const container = document.getElementById('canvas-container')
    if (!container || !this.stage) return

    const isMobileLayout = window.matchMedia && window.matchMedia('(max-width: 820px)').matches
    if (!isMobileLayout) {
      // Restore original desktop sizing.
      this.stage.width(GAME_CONFIG.CANVAS_WIDTH)
      this.stage.height(GAME_CONFIG.CANVAS_HEIGHT)
      this.stage.batchDraw()
      return
    }

    // Mobile: use the container's CSS-driven size (fullscreen)
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return

    this.stage.width(Math.floor(width))
    this.stage.height(Math.floor(height))

    // Keep pixel art crisp when stretching.
    const canvas = container.querySelector('canvas')
    if (canvas) {
      canvas.style.imageRendering = 'pixelated'
    }

    this.stage.batchDraw()
  }
}
