import Konva from 'konva'
import gameStore from './gameStore'
import panelImagePath from '../assets/img/textboxblue20.png'

export default class TextPanel {
  constructor(layer) {
    this.layer = layer

    const imageObj = new Image()
    imageObj.onload = () => {
      this.panel = new Konva.Image({
        image: imageObj,
        x: 156,
        y: 380,
        scaleX: 0.5,
        scaleY: 0.5,
        opacity: 0,
      })
      this.layer.add(this.panel)
      this.layer.batchDraw()
    }
    imageObj.src = panelImagePath

    const unsubscribe = gameStore.subscribe(
      (state) => {
        if (state.isTextPanelVisible === true) this.panel.opacity(1)
        this.timeout = setTimeout(() => {
          this.panel.opacity(0)
          state.hideTextPanel()
          clearTimeout(this.timeout)
        }, 2000)
      },
      (state) => state.isTextPanelVisible
    )
  }
}
