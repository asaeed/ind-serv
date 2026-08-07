import SpriteAnimated from './sprites/SpriteAnimated'
import villagerMan from '../assets/img/MiniVillagerMan.png'
import gameStore from './state/gameStore'
import playerStore from './state/playerStore'
import { INTERACTION } from './constants'
import npcData from '../data/npc.json'

// stand-in for directionPress while a dialog holds the party still
const NO_DIRECTION = { up: 0, down: 0, left: 0, right: 0 }

export default class Player extends SpriteAnimated {
  constructor(
    map,
    input,
    characterId = 'player',
    spriteImage = null,
    characterController = null,
    screenX = null,
    screenY = null
  ) {
    const sprite = spriteImage || villagerMan

    const hasScreenPos = screenX !== null && screenY !== null

    // Default spawn should match a world/map location (not viewport center).
    // Configure in npc.json as { name: "player", gridX, gridY }.
    const playerSpawn = Array.isArray(npcData)
      ? npcData.find((n) => n && n.isInitialCharacter) || npcData.find((n) => n && n.name === 'player')
      : null
    let spawnPos = null

    if (playerSpawn && Number.isFinite(playerSpawn.gridX) && Number.isFinite(playerSpawn.gridY)) {
      spawnPos = map.coordsToPosition(playerSpawn.gridX, playerSpawn.gridY)
    } else {
      // Fallback if config is missing: spawn at map origin.
      spawnPos = map.coordsToPosition(0, 0)
    }

    const initialPos = hasScreenPos ? { x: screenX, y: screenY } : spawnPos

    super(map.layer, sprite, initialPos.x, initialPos.y)
    this.map = map
    this.input = input
    this.characterId = characterId
    this.characterController = characterController
    this.initX = map.stage.width() / 2
    this.initY = map.stage.height() / 2
    this.lastActionState = {}
    this.autoProductionCancelledFor = null
    this.lastInteractPress = 0
    this.interactionUntil = 0
  }

  update() {
    if (!this.sprite) return

    // Keep camera centering aligned with the current viewport.
    this.initX = this.map.stage.width() / 2
    this.initY = this.map.stage.height() / 2

    const playerState = playerStore.getState()
    const gameState = gameStore.getState()

    // Only respond to input if this is the active character
    const activeCharacterId = playerState.activeCharacterId
    if (this.characterId !== activeCharacterId) return

    const { isInteracting, speed, setIsInteracting } = playerState

    // Dialogs hold the party still. A movement key dismisses ONE card (edge-triggered,
    // below) rather than walking, so holding a direction can't blow through a queue of
    // them. With a single card up it clears on this frame and the still-held key walks
    // from the next one, which reads as "dismiss and go" in the same press.
    // Choice dialogs are excluded - they need a real selection.
    const panelIsOpen = Boolean(gameState.textPanelContent) && !gameState.textPanelOptions.length
    const press = panelIsOpen ? NO_DIRECTION : this.input.directionPress

    const store = playerStore.getState()
    const { setFacingDirection } = store

    if (press.left && press.right) setFacingDirection(this.input.lastXDirection)
    else if (press.left) setFacingDirection('left')
    else if (press.right) setFacingDirection('right')

    const stateAfterFacingUpdate = playerStore.getState()
    const active = stateAfterFacingUpdate.characters?.[stateAfterFacingUpdate.activeCharacterId]
    const facingDirection = active?.facingDirection || 'right'

    // Flip sprite to face the correct direction.
    this.sprite.scaleX(this.scale * (facingDirection === 'right' ? 1 : -1))
    if (press.up) {
      const newY = this.sprite.attrs.y - speed
      if (this.map.isPixelVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.down) {
      const newY = this.sprite.attrs.y + speed
      if (this.map.isPixelVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.left) {
      const newX = this.sprite.attrs.x - speed
      if (this.map.isPixelVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    if (press.right) {
      const newX = this.sprite.attrs.x + speed
      if (this.map.isPixelVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    const xFromCenter = this.initX - this.sprite.attrs.x + INTERACTION.CAMERA_OFFSET_X
    const yFromCenter = this.initY - this.sprite.attrs.y - INTERACTION.CAMERA_OFFSET_X

    const inInteractionWindow = Date.now() < this.interactionUntil

    if (press.up || press.down || press.left || press.right) {
      if (!isInteracting && !inInteractionWindow) this.sprite.animation('walk')
      this.centerCamera(xFromCenter, yFromCenter, 100, 50, speed)
    } else {
      if (!isInteracting && !inInteractionWindow) this.sprite.animation('idle')
      this.centerCamera(xFromCenter, yFromCenter, 10, 10, speed / 2)
    }

    // interaction should fire once per keypress, last for the animation duration of 400
    const interactJustPressed = this.input.interactPress && !this.lastInteractPress
    this.lastInteractPress = this.input.interactPress

    // The interact key dismisses an open dialog and stops there - it must not also fire a
    // fresh interaction, or dismissing the son's dialog would recruit the wife standing
    // next to him. TextPanel's any-key dismiss skips this key so the two can't both run.
    if (interactJustPressed && panelIsOpen) {
      gameState.closeTextPanel()
    } else if (interactJustPressed && !isInteracting && !inInteractionWindow) {
      this.sprite.animation('hurt')
      this.sprite.frameIndex(0)

      this.interactionUntil = Date.now() + 400
      setIsInteracting(true)
      setTimeout(() => setIsInteracting(false), 400)

      // to see if player is within range of any and kick off interaction
      const closestObject = this.map.checkProximity(this.sprite.attrs.x, this.sprite.attrs.y)
      gameState.interactWith(closestObject, this.characterId)

      // Start auto-production if interacting with an item. The station's first-use
      // dialog (opened by interactWith above) stays up narrating the work - it no
      // longer has to be dismissed before anything happens.
      if (closestObject && closestObject.type === 'item') {
        playerState.startAutoProduction(this.characterId, closestObject.name)
        this.autoProductionCancelledFor = null // Clear cancelled flag when manually starting
      }
    }

    // Movement keys dismiss too, but strictly one card per press: read the raw input
    // (not `press`, which is zeroed while a dialog is up) and edge-trigger it, so holding
    // a direction through a queue of cards doesn't clear them all in consecutive frames.
    const raw = this.input.directionPress
    const directionHeld = Boolean(raw.up || raw.down || raw.left || raw.right)
    const directionJustPressed = directionHeld && !this.lastDirectionPress
    this.lastDirectionPress = directionHeld

    if (directionJustPressed && panelIsOpen) {
      gameState.closeTextPanel()
    }

    // Auto-production: check if standing still near an item
    const isMoving = press.up || press.down || press.left || press.right
    const closestObject = this.map.checkProximity(this.sprite.attrs.x, this.sprite.attrs.y)
    const isNearItem = closestObject && closestObject.type === 'item'
    const currentAutoProduction = playerState.getAutoProductionItem(this.characterId)

    if (!isMoving && isNearItem) {
      // Standing still near an item
      const isActionInProgress = closestObject.action?.checkState ? gameState[closestObject.action.checkState] : false

      // Detect when a new action starts during auto-production and play animation
      const wasActionInProgress = this.lastActionState[closestObject.name] || false
      if (!wasActionInProgress && isActionInProgress && !isInteracting && !inInteractionWindow) {
        this.sprite.animation('hurt')
        this.sprite.frameIndex(0)
        this.interactionUntil = Date.now() + 400
        setIsInteracting(true)
        setTimeout(() => setIsInteracting(false), 400)
      }

      // Track action state for next frame
      this.lastActionState[closestObject.name] = isActionInProgress
    } else if (isMoving && isNearItem) {
      // Moving while near item - cancel auto-production and mark item
      if (currentAutoProduction) {
        this.autoProductionCancelledFor = currentAutoProduction
        playerState.stopAutoProduction(this.characterId)
      }
    } else {
      // Not near item - clear everything
      if (currentAutoProduction) {
        playerState.stopAutoProduction(this.characterId)
      }
      this.lastActionState = {}
      this.autoProductionCancelledFor = null // Reset when leaving item area
    }
  }

  centerCamera(xFromCenter, yFromCenter, xThresh, yThresh, speed) {
    if (Math.abs(xFromCenter) > xThresh) {
      const delta = speed * (xFromCenter > 0 ? 1 : -1)
      this.map.imageGroup.move({ x: delta, y: 0 })

      // Move all character sprites together
      if (this.characterController) {
        this.characterController.moveAllSprites(delta, 0)
      } else {
        this.sprite.move({ x: delta, y: 0 })
      }
    }

    if (Math.abs(yFromCenter) > yThresh) {
      const delta = speed * (yFromCenter > 0 ? 1 : -1)
      this.map.imageGroup.move({ x: 0, y: delta })

      // Move all character sprites together
      if (this.characterController) {
        this.characterController.moveAllSprites(0, delta)
      } else {
        this.sprite.move({ x: 0, y: delta })
      }
    }
  }

  // TODO:
  switchSprites(newSprite) {
    this.sprite = newSprite
  }

  // centerCameraAnim(xFromCenter, yFromCenter) {
  //   // if user has strayed more than threshold and animation is not already running
  //   if ((Math.abs(yFromCenter) > 10 || Math.abs(xFromCenter) > 10) && !this.isCentering) {
  //     const anim = new Konva.Animation((frame) => {
  //       let xDist = xFromCenter * (frame.timeDiff / 1000)
  //       let yDist = yFromCenter * (frame.timeDiff / 1000)
  //       this.map.imageGroup.move({ x: xDist, y: yDist })
  //       this.sprite.move({ x: xDist, y: yDist })
  //     })

  //     anim.start()
  //     this.isCentering = true

  //     setTimeout(() => {
  //       anim.stop()
  //       this.isCentering = false
  //     }, 1000)
  //   }
  // }
}
