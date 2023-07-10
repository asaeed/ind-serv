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
        console.log('showTextPanel:', state.showTextPanel)
        // Perform any necessary actions or UI updates here
        this.panel.opacity(1)

        setTimeout(() => {
          this.panel.opacity(0)
        }, 2000)
      },
      (state) => state.showTextPanel // Selector function, returns the part of the state to subscribe to (optional)
    )
  }
}
