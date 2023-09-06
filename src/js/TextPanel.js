import Konva from 'konva'
import gameStore from './gameStore'
import panelImagePath from '../assets/img/textboxblue20.png'

export default class TextPanel {
  constructor(layer) {
    this.layer = layer

    const panelW = 690
    const panelH = 300
    const padding = 20

    this.group = new Konva.Group({
      x: 156,
      y: 380,
      opacity: 0,
    })

    const imageObj = new Image()
    imageObj.onload = () => {
      this.panel = new Konva.Image({
        image: imageObj,
        x: 0,
        y: 0,
        scaleX: 0.5,
        scaleY: 0.5,
      })

      this.panelText = new Konva.Text({
        x: padding,
        y: padding,
        width: panelW - padding * 2,
        text: '',
        fontSize: 20,
        lineHeight: 1.5,
        fontFamily: 'Press Start 2P',
        fill: '#137391',
      })

      this.group.add(this.panel)
      this.group.add(this.panelText)
      this.layer.add(this.group)
    }
    imageObj.src = panelImagePath

    const unsubscribe = gameStore.subscribe(
      (state) => {
        if (state.textPanelContent) {
          this.panelText.text(state.textPanelContent)
          this.group.opacity(1)
        } else this.group.opacity(0)
      },
      (state) => state.textPanelContent
    )
  }
}
