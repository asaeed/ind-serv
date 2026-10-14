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
// The shovel starts the chain, so it has no prerequisite - its arrow shows from
// the first frame. { itemName: resourceThatMustExist | null }
const TUTORIAL_ARROWS = { shovel: null, mold: 'numMud', kiln: 'numBricksMolded', truck: 'numBricksBaked' }

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
      this.tutorialArrows.push({ node, item, needs })
    }
  }

  // Green twin of the family objective markers: same geometry, outline weight and glow
  // as createObjectiveMarker in NpcController, so both read as "go here" arrows. Points
  // DOWN at rotation 0, which is what placeMarker expects.
  buildArrow() {
    return new Konva.Line({
      points: [-11, -10, 11, -10, 0, 8],
      closed: true,
      fill: '#3ff086',
      stroke: '#0a3a22',
      strokeWidth: 3,
      lineJoin: 'round',
      shadowColor: '#3ff086',
      shadowBlur: 12,
      shadowOpacity: 0.9,
      listening: false,
    })
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

  createProgressBar(item, action) {
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
      action,
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

  update(now = performance.now()) {
    const gameState = gameStore.getState()

    // update item visual states based on actions
    for (const item of this.items) {
      const actionType = item.action?.type
      if ((actionType === 'create' || actionType === 'convert') && item.o?.image) {
        const action = gameState.activeActions[item.name]

        if (item.o.image.opacity) {
          item.o.image.opacity(action ? 0.5 : 1)
        }

        // Compare cycles, not an active flag: a completion + restart can happen
        // between draws without the renderer ever seeing an inactive station.
        const bar = this.progressBars.get(item.name)
        if (action && bar?.action !== action) {
          this.removeProgressBar(item.name)
          this.createProgressBar(item, action)
        } else if (!action && bar) {
          this.removeProgressBar(item.name)
        }

        // trigger particle effect when action completes
        const completed = gameState.actionCompletions[item.name] || 0
        if (completed > (item.lastCompletionCount || 0)) {
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
        }

        item.lastCompletionCount = completed
      }
    }

    // update progress bars
    for (const bar of this.progressBars.values()) {
      const elapsed = now - bar.action.startedAt
      const progress = Math.max(0, Math.min(elapsed / bar.action.duration, 1))
      bar.fill.width(bar.barWidth * progress)
    }

    // tutorial arrows: bob over the next station until it's first used. On-screen
    // they hover above the station; off-screen they pin to the view edge.
    const t = now / 1000
    const bob = Math.abs(Math.sin(t * 2.4)) * 7
    const off = this.group.position() // camera pan (imageGroup offset)
    for (const arrow of this.tutorialArrows) {
      const img = arrow.item.o?.image
      const used = gameState.tracking.itemsUsed[arrow.item.name]
      const hasResource = arrow.needs === null || gameState[arrow.needs] >= 1
      const show = !used && hasResource && img && typeof img.x === 'function'
      arrow.node.visible(!!show)
      if (show) {
        if (!this._markerLayerRaised) {
          this.markerLayer.moveToTop() // above the HUD, which is created after this controller
          this._markerLayerRaised = true
        }
        const sx = img.x() + (arrow.item.barOffsetX ?? 0) + off.x
        const sy = img.y() + off.y
        // no slot: the four stations are spread across the map and never share an edge
        // position, so a lane offset would only hold the arrow off its station's true axis
        placeMarker(arrow.node, sx, sy, this.map.stage, { bob, hover: 14 })
        arrow.node.shadowBlur(10 + (Math.sin(t * 2.4) + 1) * 6) // same pulse as the family markers
      }
    }

    // update particles
    this.particles.update()
  }
}
