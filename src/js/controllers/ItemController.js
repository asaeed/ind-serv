import Konva from 'konva'
import SpriteStatic from '../sprites/SpriteStatic'
import gameStore from '../state/gameStore'
import MapClass from '../Map'
import Particles from '../sprites/Particles'
import sfx from '../lib/sfx'
import { SPRITE_DEFAULTS, PARTICLE_CONFIG, INTERACTION } from '../constants'
import { placeMarker } from '../ui/objectiveMarker.mjs'

// each production step completing gets its own voice
const COMPLETION_SOUNDS = { shovel: 'dig', mold: 'mold', kiln: 'kiln', truck: 'ship' }

// Guided tutorial: an arrow bobs over the next station once you hold the resource
// it consumes, and disappears the moment you first interact with that station.
// { itemName: resourceThatMustExist }
const TUTORIAL_ARROWS = { mold: 'numMud', kiln: 'numBricksMolded', truck: 'numBricksBaked' }

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

    this.buildTutorialArrows()
  }

  buildTutorialArrows() {
    // like the family recruit arrows, these live in their own top layer in SCREEN
    // space (not the camera-panned imageGroup) so they can pin to the view edge when
    // the station is off-screen. Raised above the HUD lazily on first update().
    this.markerLayer = new Konva.Layer({ listening: false })
    this.map.stage.add(this.markerLayer)
    this._markerLayerRaised = false

    this.tutorialArrows = []
    for (const [name, needs] of Object.entries(TUTORIAL_ARROWS)) {
      const item = this.items.find((it) => it.name === name)
      if (!item) continue
      const node = this.buildArrow()
      node.visible(false)
      this.markerLayer.add(node)
      this.tutorialArrows.push({ node, item, needs, slot: this.tutorialArrows.length * 44 })
    }
  }

  // a green down-pointing triangle with its tip at the group origin, so it can
  // hang just above a station. Drawn with Konva - no image asset.
  buildArrow() {
    const g = new Konva.Group({ listening: false })
    const green = '#3ff086'
    const stroke = '#0a3a22'
    g.add(new Konva.RegularPolygon({ x: 0, y: -13, sides: 3, radius: 12, rotation: 180, fill: green, stroke, strokeWidth: 1.5 }))
    return g
  }

  createItem(item) {
    const { x, y } = this.map.coordsToPosition(item.gridX, item.gridY)
    const sprite = require('../../assets/img/' + item.file)

    // apply offsets and scale from item configuration (defaults if not specified)
    const offsetX = item.offsetX ?? SPRITE_DEFAULTS.offsetX
    const offsetY = item.offsetY ?? SPRITE_DEFAULTS.offsetY
    const scale = item.scale ?? SPRITE_DEFAULTS.scale

    // pre-calculate center position for multi-cell items (for particle effects)
    const blocksWidth = item.blocksWidth ?? SPRITE_DEFAULTS.blocksWidth
    const blocksHeight = item.blocksHeight ?? SPRITE_DEFAULTS.blocksHeight
    const centerGridX = item.gridX + (blocksWidth - 1) / 2
    const centerGridY = item.gridY + (blocksHeight - 1) / 2
    const { x: centerX, y: centerY } = this.map.coordsToPosition(centerGridX, centerGridY)

    this.items.push({
      o: new SpriteStatic(this.group, sprite, x + offsetX, y + offsetY, scale),
      centerX,
      centerY,
      ...item,
      type: 'item',
    })
  }

  isVacant(gridX, gridY) {
    for (const item of this.items) {
      const blocksWidth = item.blocksWidth ?? SPRITE_DEFAULTS.blocksWidth
      const blocksHeight = item.blocksHeight ?? SPRITE_DEFAULTS.blocksHeight

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
      const blocksWidth = item.blocksWidth ?? SPRITE_DEFAULTS.blocksWidth
      const blocksHeight = item.blocksHeight ?? SPRITE_DEFAULTS.blocksHeight

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
    const barWidth = spriteWidth || INTERACTION.CAMERA_OFFSET_X
    const barHeight = 4
    const barOffsetX = item.barOffsetX ?? 0
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
      // effective duration is injury-scaled per acting character
      duration: gameStore.getState().activeActionDurations[item.name] ?? item.action.duration,
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
          sfx.play(COMPLETION_SOUNDS[item.name])
          this.particles.createParticles(item.centerX, item.centerY, 8, item.particleColor, {
            speedMin: PARTICLE_CONFIG.DEFAULT_SPEED_MIN,
            speedMax: PARTICLE_CONFIG.DEFAULT_SPEED_MAX,
            sizeMin: PARTICLE_CONFIG.DEFAULT_SIZE_MIN,
            sizeMax: PARTICLE_CONFIG.DEFAULT_SIZE_MAX,
            life: PARTICLE_CONFIG.DEFAULT_LIFETIME,
            yOffset: INTERACTION.CAMERA_OFFSET_X,
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

    // tutorial arrows: bob over the next station until it's first used. On-screen
    // they hover above the station; off-screen they pin to the view edge.
    const bob = Math.abs(Math.sin(performance.now() / 1000 * 2.4)) * 7
    const off = this.group.position() // camera pan (imageGroup offset)
    for (const arrow of this.tutorialArrows) {
      const img = arrow.item.o?.image
      const used = gameState.tracking.itemsUsed[arrow.item.name]
      const show = !used && gameState[arrow.needs] >= 1 && img && typeof img.x === 'function'
      arrow.node.visible(!!show)
      if (show) {
        if (!this._markerLayerRaised) {
          this.markerLayer.moveToTop() // above the HUD, which is created after this controller
          this._markerLayerRaised = true
        }
        const sx = img.x() + (arrow.item.barOffsetX ?? 0) + off.x
        const sy = img.y() + off.y
        placeMarker(arrow.node, sx, sy, this.map.stage, { bob, slot: arrow.slot, hover: 14 })
      }
    }

    // update particles
    this.particles.update()
  }
}
