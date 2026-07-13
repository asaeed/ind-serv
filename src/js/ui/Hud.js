import Konva from 'konva'
import gameStore from '../state/gameStore'
import TextPanel from './TextPanel'
import Particles from '../sprites/Particles'

export default class Hud {
  constructor(stage) {
    this.stage = stage
    this.layer = new Konva.Layer()
    this.stage.add(this.layer)

    // configurable HUD properties
    this.padding = 20
    this.fontSize = 10
    this.valueFontSize = 14
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
      baked: 'white',
      bricks: '#CD853F',
    }

    // track previous values for particle effects
    this.previousValues = {
      numMud: 0,
      numBricksMolded: 0,
      numBricksBaked: 0,
      numBricksShipped: 0,
    }

    // displayed debt eases toward actual debt so event hits spin up
    // wheel-of-fortune style (fast, then settling); payments tick down instantly
    this.displayDebt = gameStore.getState().debt

    this.particles = new Particles(this.layer)

    this.createHUD()
  }

  createHUD() {
    this.hudWidth = 280
    this.hudHeight = 200

    // background panel
    this.bg = new Konva.Rect({
      x: this.padding,
      y: this.padding,
      width: this.hudWidth,
      height: this.hudHeight,
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
      text: `$${gameStore.getState().debt}`,
      fontSize: this.debtFontSize,
      fontFamily: this.fontFamily,
      fill: this.debtColor,
    })
    this.layer.add(this.debtValue)

    // money display
    this.moneyLabel = new Konva.Text({
      x: this.padding + 155,
      y: this.padding + 15,
      text: 'MONEY',
      fontSize: 8,
      fontFamily: this.fontFamily,
      fill: '#888',
    })
    this.layer.add(this.moneyLabel)

    this.moneyValue = new Konva.Text({
      x: this.padding + 155,
      y: this.padding + 35,
      text: '$0',
      fontSize: this.debtFontSize,
      fontFamily: this.fontFamily,
      fill: '#3ff086ff',
    })
    this.layer.add(this.moneyValue)

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
    this.textPanel.layout({ topOffset: this.padding + this.hudHeight + 12 })

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
      y: y - 2,
      text: '0',
      fontSize: this.valueFontSize,
      fontFamily: this.fontFamily,
      fill: color,
      align: 'right',
      width: 60,
    })
    this.layer.add(valueText)

    return { label: labelText, value: valueText }
  }

  updateValue(textObj, currentValue, previousValue) {
    textObj.text(currentValue.toString())

    // create particles if value increased
    if (currentValue > previousValue) {
      const x = textObj.x() + textObj.width() / 2 + 22
      const y = textObj.y() + textObj.height() / 2 + 4
      const color = textObj.fill()
      this.particles.createParticles(x, y, 6, color, {
        speedMin: 1,
        speedMax: 3,
        sizeMin: 2,
        sizeMax: 4,
        life: 20,
        gravityY: -1,
      })
    }
  }

  update() {
    const gameState = gameStore.getState()

    // update debt and money
    const targetDebt = gameState.debt
    if (targetDebt < this.displayDebt) {
      this.displayDebt = targetDebt // payments land instantly
    } else if (targetDebt > this.displayDebt) {
      // exponential ease-out reads as a spin-up that decelerates
      this.displayDebt += Math.max(1, (targetDebt - this.displayDebt) * 0.08)
      if (targetDebt - this.displayDebt < 1) this.displayDebt = targetDebt
    }
    this.debtValue.text(`$${Math.round(this.displayDebt)}`)
    this.debtValue.fill(targetDebt > this.displayDebt ? '#ff1111' : this.debtColor)
    this.moneyValue.text(`$${gameState.money}`)

    // update production pipeline with particle effects
    this.updateValue(this.mudText.value, gameState.numMud, this.previousValues.numMud)
    this.updateValue(this.bricksMoldedText.value, gameState.numBricksMolded, this.previousValues.numBricksMolded)
    this.updateValue(this.bricksBakedText.value, gameState.numBricksBaked, this.previousValues.numBricksBaked)
    this.updateValue(this.bricksShippedText.value, gameState.numBricksShipped, this.previousValues.numBricksShipped)

    // store current values for next frame
    this.previousValues.numMud = gameState.numMud
    this.previousValues.numBricksMolded = gameState.numBricksMolded
    this.previousValues.numBricksBaked = gameState.numBricksBaked
    this.previousValues.numBricksShipped = gameState.numBricksShipped

    // update particles
    this.particles.update()

    // Keep text panel positioned correctly on mobile/resizes.
    if (this.textPanel && this.textPanel.layout) {
      this.textPanel.layout({ topOffset: this.padding + this.hudHeight + 12 })
    }

    this.layer.batchDraw()
  }
}
