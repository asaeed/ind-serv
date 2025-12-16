import Konva from 'konva'
import gameStore from '../state/gameStore'
import TextPanel from './TextPanel'

export default class Hud {
  constructor(stage) {
    this.stage = stage
    this.layer = new Konva.Layer()
    this.stage.add(this.layer)

    // configurable HUD properties
    this.padding = 20
    this.fontSize = 10
    this.lineHeight = 24
    this.debtFontSize = 20
    this.fontFamily = 'Press Start 2P'
    this.bgColor = '#1a1a1a'
    this.bgOpacity = 0.85
    this.textColor = '#ffffff'
    this.debtColor = '#ff5555'
    this.stageColors = {
      mud: '#8B4513',
      molded: '#A0826D',
      baked: '#D2691E',
      bricks: '#CD853F',
    }

    this.createHUD()
  }

  createHUD() {
    const hudWidth = 280
    const hudHeight = 200

    // background panel
    this.bg = new Konva.Rect({
      x: this.padding,
      y: this.padding,
      width: hudWidth,
      height: hudHeight,
      fill: this.bgColor,
      opacity: this.bgOpacity,
      cornerRadius: 8,
    })
    this.layer.add(this.bg)

    // debt display (large, prominent)
    this.debtLabel = new Konva.Text({
      x: this.padding + 15,
      y: this.padding + 15,
      text: 'DEBT',
      fontSize: 8,
      fontFamily: this.fontFamily,
      fill: '#888',
    })
    this.layer.add(this.debtLabel)

    this.debtValue = new Konva.Text({
      x: this.padding + 15,
      y: this.padding + 35,
      text: '$1000',
      fontSize: this.debtFontSize,
      fontFamily: this.fontFamily,
      fill: this.debtColor,
    })
    this.layer.add(this.debtValue)

    // production pipeline section
    const pipelineY = this.padding + 85

    this.pipelineTitle = new Konva.Text({
      x: this.padding + 15,
      y: pipelineY,
      text: 'PRODUCTION PIPELINE',
      fontSize: 7,
      fontFamily: this.fontFamily,
      fill: '#888',
    })
    this.layer.add(this.pipelineTitle)

    // create text elements for each stage
    this.mudText = this.createStageText(pipelineY + 25, 'Mud Shoveled:', this.stageColors.mud)
    this.bricksMoldedText = this.createStageText(pipelineY + 47, 'Bricks Molded:', this.stageColors.molded)
    this.bricksBakedText = this.createStageText(pipelineY + 69, 'Bricks Baked:', this.stageColors.baked)
    this.bricksShippedText = this.createStageText(pipelineY + 91, 'Bricks Shipped:', this.stageColors.bricks)

    // add text panel for dialogs
    this.textPanel = new TextPanel(this.layer)

    this.layer.batchDraw()
  }

  createStageText(y, label, color) {
    const labelText = new Konva.Text({
      x: this.padding + 20,
      y: y,
      text: label,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fill: this.textColor,
    })
    this.layer.add(labelText)

    const valueText = new Konva.Text({
      x: this.padding + 180,
      y: y,
      text: '0',
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fill: color,
      align: 'right',
      width: 60,
    })
    this.layer.add(valueText)

    return { label: labelText, value: valueText }
  }

  update() {
    const gameState = gameStore.getState()

    // update debt
    this.debtValue.text(`$${gameState.debt}`)

    // update production pipeline
    this.mudText.value.text(gameState.numMud.toString())
    this.bricksMoldedText.value.text(gameState.numBricksMolded.toString())
    this.bricksBakedText.value.text(gameState.numBricksBaked.toString())
    this.bricksShippedText.value.text(gameState.numBricksShipped.toString())

    this.layer.batchDraw()
  }
}
