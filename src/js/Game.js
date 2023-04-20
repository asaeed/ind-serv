import Konva from 'konva'
import Sprite from './Sprite'

export default class Game {
  constructor(document) {
    this.framesDiv = document.querySelector('.frame-num > .value')
    this.secondsDiv = document.querySelector('.seconds-passed > .value')
    this.startTime = Date.now()

    this.stage = new Konva.Stage({
      container: 'canvas-container', // id of container <div>
      width: 1000,
      height: 600,
    })

    this.layerStatic = new Konva.Layer()
    this.layerAnim = new Konva.Layer()

    this.sprite = new Sprite(this.layerAnim)

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
    this.layerAnim.add(this.blueHex)
  }

  update(tFrame) {
    this.framesDiv.innerHTML = tFrame
    this.secondsDiv.innerHTML = (Date.now() - this.startTime) / 1000

    var period = 2000
    var scale = Math.sin((tFrame * 2 * Math.PI) / period) + 0.001
    this.blueHex.scale({ x: scale, y: scale })
  }

  mainLoop() {
    const main = (tFrame) => {
      this.stopMain = window.requestAnimationFrame(main)
      this.update(tFrame) // pass rAF's timestamp.
    }
    main()
  }
}
