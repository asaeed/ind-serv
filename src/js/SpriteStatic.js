import Konva from 'konva'

export default class SpriteStatic {
  constructor(group, imagePath, x, y) {
    this.group = group
    this.scale = 0.35
    this.x = x
    this.y = y

    const w = 32
    const h = 32

    console.log('in constructor')

    const imageObj = new Image()
    imageObj.onload = () => {
      console.log('image onload')
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
    console.log('setting image path')
    imageObj.src = imagePath
  }

  update() {}
}
