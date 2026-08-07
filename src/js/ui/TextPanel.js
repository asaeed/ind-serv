import Konva from 'konva'
import gameStore from '../state/gameStore'
import sfx from '../lib/sfx'
import panelImagePath from '../../assets/img/textboxblue20.png'
import { INTERACT_KEY } from '../constants'

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

      // Cue arrow for events that point the player at an objective (event `showArrow`).
      // Same shape and colours as the objective markers in NpcController, so the panel
      // is showing the player the very arrow they're being told to follow.
      this.cueArrow = new Konva.Line({
        points: [-11, -10, 11, -10, 0, 8],
        closed: true,
        fill: '#ffde3d',
        stroke: '#7a5200',
        strokeWidth: 3,
        lineJoin: 'round',
        listening: false,
        visible: false,
      })

      this.group.add(this.panel)
      this.group.add(this.panelText)
      this.group.add(this.cueArrow)
      this.layer.add(this.group)

      // Initial layout once assets are ready.
      this.layout()

      // Show content that was set before assets loaded (e.g. the opening narration).
      const state = gameStore.getState()
      if (state.textPanelContent) {
        this.panelText.text(this.formatText(state.textPanelContent, state.textPanelOptions, state.textPanelOptionIdx))
        this.placeCueArrow(state.textPanelArrow)
        this.group.opacity(1)
        this.layout()
      }
    }
    imageObj.src = panelImagePath

    // any key or click/tap dismisses an open dialog. Grace period so the input
    // that opened the panel (or a held movement key) doesn't instantly close it —
    // same reason Player.js guards its interaction window.
    this.openedAt = Date.now() // covers the opening card, which is set before we subscribe
    this.handleDismissInput = (e) => {
      const state = gameStore.getState()
      if (!state.textPanelContent) return
      if (state.textPanelOptions.length) return // choice dialogs need a real selection
      if (Date.now() - this.openedAt < 350) return
      if (e.type === 'keydown') {
        const el = document.activeElement
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
        // Player.js owns the interact key. If we closed the panel here too, the same
        // press would dismiss AND fire a fresh interaction one frame later - which is
        // how dismissing the son's dialog ended up recruiting the wife beside him.
        if (e.key === INTERACT_KEY) return
      } else if (e.target.closest?.('button, a, input, textarea, .info-modal')) {
        return // UI chrome clicks do their own thing
      }
      state.closeTextPanel()
    }
    document.addEventListener('keydown', this.handleDismissInput)
    document.addEventListener('pointerdown', this.handleDismissInput)

    const unsubscribe = gameStore.subscribe(
      (state, prevState) => {
        // characters talking get the Peanuts-teacher mumble; narration banners
        // and item instructions (activeNpcDialogName is null for those) stay silent
        if (
          state.textPanelContent &&
          state.activeNpcDialogName &&
          state.textPanelContent !== prevState?.textPanelContent
        ) {
          sfx.mumble(state.textPanelContent)
        }
        if (state.textPanelContent && state.textPanelContent !== prevState?.textPanelContent) {
          this.openedAt = Date.now() // arm the dismiss grace period
        }
        if (!this.panelText) return // assets not loaded yet; onload will catch up
        if (state.textPanelContent) {
          this.panelText.text(this.formatText(state.textPanelContent, state.textPanelOptions, state.textPanelOptionIdx))
          this.placeCueArrow(state.textPanelArrow)
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

  // Sit the cue arrow in the indent of the instruction paragraph (the one after the
  // blank line), so it reads as a legend for the arrows the copy says to follow.
  // The panel is only ~200px tall and the copy fills it, so there is no room below.
  placeCueArrow(show) {
    if (!this.cueArrow) return
    this.cueArrow.visible(Boolean(show))
    if (!show) return

    // Konva wraps into textArr; the blank entry is the paragraph break.
    const lines = this.panelText.textArr || []
    const breakIdx = lines.findIndex((l) => !l.text)
    const lineIdx = breakIdx === -1 ? Math.max(0, lines.length - 1) : breakIdx + 1
    const lineHeightPx = this.panelText.fontSize() * this.panelText.lineHeight()

    this.cueArrow.position({
      x: this.paddingX + 13,
      y: this.paddingY + (lineIdx + 0.5) * lineHeightPx,
    })
  }

  formatText(content, options, idx) {
    const body = typeof content === 'string' ? content : content?.text
    return `${body}\n\n${options.map((o, i) => `  ${i === idx ? '->' : '  '} ${o}`).join('\n')}`
  }
}
