import gameStore from './state/gameStore'
import playerStore from './state/playerStore'

// Tap/click to play. One Konva stage listener covers mouse and touch alike, so desktop
// and mobile share this path - no separate touch handling.
//
// A tap resolves in this order:
//   1. a party member  -> switch to them (same as Tab)
//   2. something already in reach -> interact (same as Space)
//   3. anything else -> walk there, routing around scenery
//
// Taps while a dialog is up are ignored: TextPanel owns pointer dismissal, and letting
// both run would dismiss the card AND issue an order from the same tap - the exact
// double-ownership bug the interact and movement keys already had.
const SWITCH_TAP_RADIUS = 34 // a bit over half a tile, so tapping a character is forgiving

export default class TapControls {
  constructor(map, characterController) {
    this.map = map
    this.characterController = characterController
    this.stage = map.stage

    this.handlePointer = () => this.onPointer()
    this.stage.on('pointerdown', this.handlePointer)
  }

  activeCharacter() {
    return this.characterController.characters.get(playerStore.getState().activeCharacterId)
  }

  onPointer() {
    const state = gameStore.getState()
    if (!state.gameStarted || state.gameOver) return
    if (state.textPanelContent) return // TextPanel dismisses it; one owner per input

    const pointer = this.stage.getPointerPosition()
    const active = this.activeCharacter()
    if (!pointer || !active?.sprite) return

    if (this.trySwitch(pointer)) return
    if (this.tryInteract(pointer, active)) return
    this.walkTo(pointer, active)
  }

  // Tapping a recruited family member takes control of them.
  trySwitch(pointer) {
    const activeId = playerStore.getState().activeCharacterId
    for (const [id, character] of this.characterController.characters) {
      if (id === activeId || !character.sprite) continue
      const dx = character.sprite.x() - pointer.x
      const dy = character.sprite.y() - pointer.y
      if (Math.hypot(dx, dy) <= SWITCH_TAP_RADIUS) {
        this.characterController.switchToCharacter(id)
        return true
      }
    }
    return false
  }

  // Interact only when the tapped thing is the same thing the interact key would reach,
  // so tapping a distant kiln walks there instead of working it from across the map.
  tryInteract(pointer, active) {
    const tapped = this.map.checkProximity(pointer.x, pointer.y)
    if (!tapped) return false

    const inReach = this.map.checkProximity(active.sprite.attrs.x, active.sprite.attrs.y)
    if (!inReach || inReach.name !== tapped.name) return false

    active.setPath([])
    active.triggerInteraction(inReach)
    return true
  }

  // The character's own cell comes from positionToCoords (the collision convention used
  // by isVacant/hasCharacterAt); the destination comes from tileAtPoint, because a tap is
  // a point on the drawn grid, not a sprite anchor. Using positionToCoords for both is
  // what made clicks land a square below the cursor.
  walkTo(pointer, active) {
    const from = this.map.positionToCoords(active.sprite.attrs.x, active.sprite.attrs.y)
    const to = this.map.tileAtPoint(pointer.x, pointer.y)
    active.setPath(this.map.pathTo(from.gridX, from.gridY, to.gridX, to.gridY, active.characterId))
  }

  dispose() {
    this.stage.off('pointerdown', this.handlePointer)
  }
}
