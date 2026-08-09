import Konva from 'konva'
import gameStore from './state/gameStore'
import playerStore from './state/playerStore'
import { INTERACTION } from './constants'

// Tap/click to play. One Konva stage listener covers mouse and touch alike, so desktop
// and mobile share this path - no separate touch handling.
//
// A tap resolves in this order:
//   1. a party member  -> switch to them (same as Tab)
//   2. something already in reach -> interact (same as Space)
//   3. anything else -> walk there, routing around scenery
//
// A tap while a dialog is up only dismisses it. This class owns that dismissal for taps
// on the canvas rather than sharing it with TextPanel's document-level handler: letting
// both run would dismiss the card AND issue an order from the same tap, the exact
// double-ownership bug the interact and movement keys already had.
const SWITCH_TAP_RADIUS = 34 // a bit over half a tile, so tapping a character is forgiving
const TAP_RIPPLE_FROM = 7
const TAP_RIPPLE_TO = 28

export default class TapControls {
  constructor(map, characterController) {
    this.map = map
    this.characterController = characterController
    this.stage = map.stage

    // Tap feedback: a ring that expands and fades where you pressed. Screen space, so it
    // marks the spot on the display rather than drifting with the camera - it's an
    // acknowledgement of the input, not a marker on the world. One reused node: taps are
    // sequential, and restarting beats allocating a shape per press.
    this.fxLayer = new Konva.Layer({ listening: false })
    this.stage.add(this.fxLayer)
    this.ripple = new Konva.Circle({
      radius: TAP_RIPPLE_FROM,
      stroke: '#3ff086',
      strokeWidth: 3,
      shadowColor: '#3ff086',
      shadowBlur: 8,
      shadowOpacity: 0.8,
      opacity: 0,
      listening: false,
    })
    this.fxLayer.add(this.ripple)

    this.handlePointer = () => this.onPointer()
    this.stage.on('pointerdown', this.handlePointer)
  }

  // Fires for every tap the game acts on, including one that only dismisses a dialog -
  // the point is to confirm "I got that, there".
  showTapFeedback(pointer) {
    if (!pointer) return
    this.rippleTween?.destroy()

    this.ripple.position(pointer)
    this.ripple.radius(TAP_RIPPLE_FROM)
    this.ripple.opacity(0.95)
    this.fxLayer.moveToTop()

    this.rippleTween = new Konva.Tween({
      node: this.ripple,
      radius: TAP_RIPPLE_TO,
      opacity: 0,
      duration: 0.32,
      easing: Konva.Easings.EaseOut,
    })
    this.rippleTween.play()
  }

  activeCharacter() {
    return this.characterController.characters.get(playerStore.getState().activeCharacterId)
  }

  onPointer() {
    const state = gameStore.getState()
    if (!state.gameStarted || state.gameOver) return

    // A tap on the canvas with a dialog up ONLY dismisses it - it must not also become a
    // walk order. TapControls owns that dismissal rather than sharing it with TextPanel's
    // document-level handler, so the outcome can't depend on which listener the browser
    // runs first. Choice dialogs are left alone; they need a real selection.
    const pointer = this.stage.getPointerPosition()

    if (state.textPanelContent) {
      if (!state.textPanelOptions.length) {
        state.closeTextPanel()
        this.showTapFeedback(pointer)
      }
      return
    }

    const active = this.activeCharacter()
    if (!pointer || !active?.sprite) return

    this.showTapFeedback(pointer)

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
    const tapped = this.map.checkProximity(pointer.x, pointer.y, INTERACTION.TAP_HIT_DISTANCE)
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
    this.rippleTween?.destroy()
    this.fxLayer.destroy()
  }
}
