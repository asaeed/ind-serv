import Konva from 'konva'

export default class Hud {
  constructor(stage) {
    this.stage = stage
    this.layer = new Konva.Layer({ imageSmoothingEnabled: false })

    this.circle = new Konva.Circle({
      x: this.stage.width() - 20,
      y: this.stage.height() - 20,
      radius: 20,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 4,
    })

    this.layer.add(this.circle)
    this.stage.add(this.layer)
  }

  update() {}
}
