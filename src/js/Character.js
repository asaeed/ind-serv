import Konva from 'konva'

export default class Character {
  constructor(layer, imagePath, x, y) {
    this.layer = layer
    this.scale = 4
    this.facingDirection = 'right'
    this.x = x
    this.y = y

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
    imageObj.onload = () => {
      this.sprite = new Konva.Sprite({
        x: this.x,
        y: this.y,
        image: imageObj,
        animation: 'walk',
        animations: animations,
        frameRate: 6,
        frameIndex: 0,
        scaleX: this.scale,
        scaleY: this.scale,
        offsetX: w / 2,
        offsetY: h / 2,
      })
      this.layer.add(this.sprite)
      this.sprite.start() // start sprite animation
      console.log(this.sprite.attrs)
    }
    imageObj.src = imagePath
  }

  update() {}
}
