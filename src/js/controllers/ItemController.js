import Konva from 'konva'
import SpriteStatic from '../sprites/SpriteStatic'
import gameStore from '../state/gameStore'
import MapClass from '../Map'
import Particles from '../sprites/Particles'

export default class ItemController {
  constructor(map) {
    this.map = map
    this.group = this.map.imageGroup
    this.items = []
    this.progressBars = new Map()
    this.particles = new Particles(this.group)

    // create items
    const itemData = gameStore.getState().itemData
    for (const item of itemData) this.createItem(item)
  }

  createItem(item) {
    const { x, y } = this.map.coordsToPosition(item.gridX, item.gridY)
    const sprite = require('../../assets/img/' + item.file)

    // apply offsets and scale from item configuration (defaults if not specified)
    const offsetX = item.offsetX || 0
    const offsetY = item.offsetY || 0
    const scale = item.scale || 1

    // pre-calculate center position for multi-cell items (for particle effects)
    const blocksWidth = item.blocksWidth || 1
    const blocksHeight = item.blocksHeight || 1
    const centerGridX = item.gridX + (blocksWidth - 1) / 2
    const centerGridY = item.gridY + (blocksHeight - 1) / 2
    const { x: centerX, y: centerY } = this.map.coordsToPosition(centerGridX, centerGridY)

    this.items.push({
      o: new SpriteStatic(this.group, sprite, x + offsetX, y + offsetY, scale),
      centerX,
      centerY,
      ...item,
    })
  }

  isVacant(gridX, gridY) {
    for (const item of this.items) {
      const blocksWidth = item.blocksWidth || 1
      const blocksHeight = item.blocksHeight || 1

      // check if gridX, gridY falls within the item's blocked area
      for (let dx = 0; dx < blocksWidth; dx++) {
        for (let dy = 0; dy < blocksHeight; dy++) {
          if (item.gridX + dx === gridX && item.gridY + dy === gridY) {
            return false
          }
        }
      }
    }
    return true
  }

  getClosest(x, y) {
    // for multi-cell items, create interaction points for each cell they occupy
    const positions = []

    for (const item of this.items) {
      const blocksWidth = item.blocksWidth || 1
      const blocksHeight = item.blocksHeight || 1

      // for single-cell items, use the sprite position
      if (blocksWidth === 1 && blocksHeight === 1) {
        positions.push({
          ...item,
          x: item.o.image.x(),
          y: item.o.image.y(),
        })
      } else {
        // for multi-cell items, create an interaction point at the center of each cell
        for (let dx = 0; dx < blocksWidth; dx++) {
          for (let dy = 0; dy < blocksHeight; dy++) {
            const { x: cellX, y: cellY } = this.map.coordsToPosition(item.gridX + dx, item.gridY + dy)
            positions.push({
              ...item,
              x: cellX,
              y: cellY,
            })
          }
        }
      }
    }

    return MapClass.findClosest(positions, x, y)
  }

  createProgressBar(item) {
    // only create if image is loaded and has position methods
    if (!item.o?.image || typeof item.o.image.x !== 'function') return

    // calculate bar width based on sprite width for multi-cell items
    const spriteWidth = item.o.image.width() * item.o.image.scaleX()
    const barWidth = spriteWidth || 32
    const barHeight = 4
    const barOffsetX = item.barOffsetX || 0
    const barOffsetY = -8

    // center the progress bar on the sprite
    const centerX = item.o.image.x() + barOffsetX
    const y = item.o.image.y() + barOffsetY

    // background
    const bg = new Konva.Rect({
      x: centerX - barWidth / 2,
      y: y,
      width: barWidth,
      height: barHeight,
      fill: '#333',
      opacity: 0.8,
    })

    // progress fill
    const fill = new Konva.Rect({
      x: centerX - barWidth / 2,
      y: y,
      width: 0,
      height: barHeight,
      fill: '#3ff086ff',
    })

    this.group.add(bg)
    this.group.add(fill)

    this.progressBars.set(item.name, {
      bg,
      fill,
      barWidth,
      startTime: Date.now(),
      duration: item.action.duration,
    })
  }

  removeProgressBar(itemName) {
    const bar = this.progressBars.get(itemName)
    if (bar) {
      bar.bg.destroy()
      bar.fill.destroy()
      this.progressBars.delete(itemName)
    }
  }

  update() {
    const gameState = gameStore.getState()

    // update item visual states based on actions
    for (const item of this.items) {
      const actionType = item.action?.type
      if ((actionType === 'create' || actionType === 'convert') && item.o?.image) {
        const wasActive = item.wasActive || false
        const isActive = gameState[item.action.checkState]

        if (item.o.image.opacity) {
          item.o.image.opacity(isActive ? 0.5 : 1)
        }

        // show progress bar when action starts
        if (!wasActive && isActive) {
          this.createProgressBar(item)
        }

        // trigger particle effect when action completes
        if (wasActive && !isActive) {
          this.particles.createParticles(item.centerX, item.centerY, 8, item.particleColor, {
            speedMin: 2,
            speedMax: 5,
            sizeMin: 3,
            sizeMax: 6,
            life: 30,
            yOffset: 32,
            gravityY: 0,
          })
          this.removeProgressBar(item.name)
        }

        item.wasActive = isActive
      }
    }

    // update progress bars
    for (const bar of this.progressBars.values()) {
      const elapsed = Date.now() - bar.startTime
      const progress = Math.min(elapsed / bar.duration, 1)
      bar.fill.width(bar.barWidth * progress)
    }

    // update particles
    this.particles.update()
  }
}
