import Konva from 'konva'

export default class Sprite {
  constructor(layer) {
    this.layer = layer

    // prettier-ignore
    var animations = {
      idle: [
        // x, y, width, height (4 frames)
        0, 0, 128, 128,
        128, 0, 128, 128,
        128 * 2, 0, 128, 128,
        128 * 3, 0, 128, 128,
      ],
      walk: [
        0, 128, 128, 128,
        128, 128, 128, 128,
        128 * 2, 128, 128, 128,
        128 * 3, 128, 128, 128,
        128 * 4, 128, 128, 128,
        128 * 5, 128, 128, 128,
      ],
    }

    const imageObj = new Image()
    imageObj.onload = function () {
      var sprite = new Konva.Sprite({
        x: 100,
        y: 100,
        image: imageObj,
        animation: 'walk',
        animations: animations,
        frameRate: 6,
        frameIndex: 0,
      })
      layer.add(sprite)

      // start sprite animation
      sprite.start()
    }
    imageObj.src = './assets/img/BigVillagerWoman.png'
  }
}
