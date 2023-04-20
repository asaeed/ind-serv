import Konva from 'konva'
import imagePath from '../assets/img/MiniVillagerWoman.png'

export default class Sprite {
  constructor(layer) {
    this.layer = layer

    const w = 32
    const h = 32

    // prettier-ignore
    const animations = {
      idle: [
        // x, y, width, height (4 frames)
        0, 0, w, h,
        w, 0, w, h,
        w * 2, 0, w, h,
        w * 3, 0, w, h,
      ],
      walk: [
        0, h, w, h,
        w, h, w, h,
        w * 2, h, w, h,
        w * 3, h, w, h,
        w * 4, h, w, h,
        w * 5, h, w, h,
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
        scaleX: 4,
        scaleY: 4,
      })
      layer.add(sprite)

      // start sprite animation
      sprite.start()
    }
    imageObj.src = imagePath
  }
}
