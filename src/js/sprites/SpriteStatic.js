import Konva from 'konva'

export default class SpriteStatic {
  constructor(group, imagePath, x, y, scaleMultiplier = 1) {
    this.group = group
    this.baseScale = 0.35
    this.scale = this.baseScale * scaleMultiplier
    this.x = x
    this.y = y

    const w = 32
    const h = 32

    const imageObj = new Image()
    imageObj.onload = () => {
      this.image = new Konva.Image({
        x: this.x,
        y: this.y,
        image: imageObj,
        scaleX: this.scale,
        scaleY: this.scale,
        offsetX: w * 1.5,
        offsetY: 0,
      })
      this.group.add(this.image)
      // console.log(this.image.attrs)
    }
    imageObj.src = imagePath
  }

  update() {}
}
