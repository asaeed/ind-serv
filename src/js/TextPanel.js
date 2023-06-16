import Konva from 'konva'
import panelImagePath from '../assets/img/textboxblue20.png'

export default class TextPanel {
  constructor(layer) {
    this.layer = layer

    const imageObj = new Image()
    imageObj.onload = () => {
      var panel = new Konva.Image({
        image: imageObj,
        x: 156,
        y: 380,
        scaleX: 0.5,
        scaleY: 0.5,
      })
      this.layer.add(panel)
      this.layer.batchDraw()
    }
    imageObj.src = panelImagePath
  }
}
