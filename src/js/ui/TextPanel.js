import Konva from 'konva'
import gameStore from '../state/gameStore'
import sfx from '../lib/sfx'
import panelImagePath from '../../assets/img/textboxblue20.png'

export default class TextPanel {
  constructor(layer) {
    this.layer = layer

    this.panelW = 690
    this.panelH = 300
    this.paddingX = 20
    this.paddingY = 12
    this.basePanelScale = 0.5

    this.topOffset = 0

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
        scaleX: this.basePanelScale,
        scaleY: this.basePanelScale,
      })

      this.panelText = new Konva.Text({
        x: this.paddingX,
        y: this.paddingY,
        width: this.panelW - this.paddingX * 2,
        text: '',
        fontSize: 20,
        lineHeight: 1.5,
        fontFamily: 'Press Start 2P',
        fill: '#137391',
      })

      this.group.add(this.panel)
      this.group.add(this.panelText)
      this.layer.add(this.group)

      // Initial layout once assets are ready.
      this.layout()

      // Show content that was set before assets loaded (e.g. the opening narration).
      const state = gameStore.getState()
      if (state.textPanelContent) {
        this.panelText.text(this.formatText(state.textPanelContent, state.textPanelOptions, state.textPanelOptionIdx))
        this.group.opacity(1)
        this.layout()
      }
    }
    imageObj.src = panelImagePath

    const unsubscribe = gameStore.subscribe(
      (state, prevState) => {
        // new dialogue gets the Peanuts-teacher mumble
        if (state.textPanelContent && state.textPanelContent !== prevState?.textPanelContent) {
          sfx.mumble(state.textPanelContent)
        }
        if (!this.panelText) return // assets not loaded yet; onload will catch up
        if (state.textPanelContent) {
          this.panelText.text(this.formatText(state.textPanelContent, state.textPanelOptions, state.textPanelOptionIdx))
          this.group.opacity(1)
          this.layout()
        } else this.group.opacity(0)
      },
      (state) => state.textPanelContent
    )
  }

  layout({ topOffset } = {}) {
    if (typeof topOffset === 'number') this.topOffset = topOffset

    const stage = this.layer?.getStage?.()
    if (!stage) return

    const isMobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches

    if (!isMobile) {
      // Keep original desktop placement.
      this.group.scale({ x: 1, y: 1 })
      this.group.position({ x: 156, y: 380 })
      return
    }

    const marginX = 12
    const availableW = Math.max(0, stage.width() - marginX * 2)
    const scale = this.panelW > 0 ? Math.min(1, availableW / this.panelW) : 1

    this.group.scale({ x: scale, y: scale })

    const x = Math.max(marginX, (stage.width() - this.panelW * scale) / 2)
    const y = Math.max(12, this.topOffset)

    this.group.position({ x, y })
  }

  formatText(content, options, idx) {
    const body = typeof content === 'string' ? content : content?.text
    return `${body}\n\n${options.map((o, i) => `  ${i === idx ? '->' : '  '} ${o}`).join('\n')}`
  }
}
