import SpriteAnimated from './sprites/SpriteAnimated'
import villagerMan from '../assets/img/MiniVillagerMan.png'
import gameStore from './state/gameStore'
import playerStore from './state/playerStore'
import { INTERACTION } from './constants'
import npcData from '../data/npc.json'

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
    const press = this.input.directionPress

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

    if (interactJustPressed && !isInteracting && !inInteractionWindow) {
      this.sprite.animation('hurt')
      this.sprite.frameIndex(0)

      this.interactionUntil = Date.now() + 400
      setIsInteracting(true)
      setTimeout(() => setIsInteracting(false), 400)

      // to see if player is within range of any and kick off interaction
      const closestObject = this.map.checkProximity(this.sprite.attrs.x, this.sprite.attrs.y)
      gameState.interactWith(closestObject, this.characterId)

      // Start auto-production if interacting with an item
      if (closestObject && closestObject.type === 'item') {
        playerState.startAutoProduction(this.characterId, closestObject.name)
        this.autoProductionCancelledFor = null // Clear cancelled flag when manually starting

        // If we just started auto-production, close the panel.
        // This is intentionally done here (at the source of the user input),
        // so background auto-production ticks never close panels.
        if (gameState.textPanelContent) {
          gameState.interactWith(undefined)
        }
      }
    }

    // reset text panel on movement
    if (gameState.textPanelContent) {
      // move to dismiss
      if ((press.up || press.down || press.left || press.right) && !isInteracting && !inInteractionWindow) {
        gameState.interactWith(undefined)
      }
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
