import Player from '../Player'
import playerStore from '../state/playerStore'
import gameStore from '../state/gameStore'
import Particles from '../sprites/Particles'
import { PARTICLE_CONFIG } from '../constants'

export default class CharacterController {
  constructor(map, input) {
    this.map = map
    this.input = input
    this.characters = new Map()
    this.lastSwitchPress = 0
    // Spawn switch particles in imageGroup space so they move with camera pans.
    this.particles = new Particles(this.map.imageGroup)

    // Create the initial player character
    this.createCharacter('player')

    // Subscribe to gameStore to detect when NPCs are recruited
    this.unsubscribe = gameStore.subscribe((state) => {
      // Check for newly recruited NPCs
      for (const npcName of state.recruitedNpcs) {
        if (!this.characters.has(npcName)) {
          this.recruitNpc(npcName)
        }
      }
    })
  }

  createCharacter(characterId, sprite = null) {
    const player = new Player(this.map, this.input, characterId, sprite, this)
    this.characters.set(characterId, player)
    return player
  }

  moveAllSprites(deltaX, deltaY) {
    // Move all character sprites by the same amount (for camera following)
    for (const char of this.characters.values()) {
      if (char.sprite) {
        char.sprite.move({ x: deltaX, y: deltaY })
      }
    }
  }

  recruitNpc(npcName) {
    // Find NPC in the map
    const npcController = this.map.npcController
    const npcToRecruit = npcController.npcs.find((npc) => npc.name === npcName)

    if (npcToRecruit) {
      // Keep NPC's grid position for freezing its AI after recruitment
      const gridX = npcToRecruit.gridX
      const gridY = npcToRecruit.gridY

      // Load the sprite dynamically from the NPC's file
      const npcSprite = require('../../assets/img/' + npcToRecruit.file)

      // Spawn the controllable character exactly where the NPC is currently drawn.
      // NPC sprite position is relative to imageGroup, so add imageGroup offset to get screen position.
      const npcScreenX = npcToRecruit.o.sprite.x() + this.map.imageGroup.x()
      const npcScreenY = npcToRecruit.o.sprite.y() + this.map.imageGroup.y()

      // Create player at the NPC's screen position
      const player = new Player(this.map, this.input, npcName, npcSprite, this, npcScreenX, npcScreenY)

      this.characters.set(npcName, player)

      // Hide the NPC sprite
      if (npcToRecruit.o && npcToRecruit.o.sprite) {
        npcToRecruit.o.sprite.visible(false)
        npcToRecruit.o.sprite.listening(false)
      }

      // Mark as recruited to prevent NPC updates
      npcToRecruit.wander = 0
      npcToRecruit.targetX = gridX
      npcToRecruit.targetY = gridY
      npcToRecruit.recruited = true

      // Trigger particles at the NPC's position as join feedback.
      // (No auto-switch: Tab/B switches to them whenever the player chooses.)
      this._triggerSwitchParticlesAtLocal(npcToRecruit.o.sprite.x(), npcToRecruit.o.sprite.y())
    }
  }

  switchToCharacter(characterId) {
    const targetCharacter = this.characters.get(characterId)
    if (!targetCharacter) return

    const currentId = playerStore.getState().activeCharacterId
    if (currentId === characterId) return // Already on this character

    // Switch in the store
    playerStore.getState().switchCharacter(characterId)

    // Trigger a particle burst on the character we just switched to.
    if (targetCharacter.sprite) this._triggerSwitchParticles(targetCharacter)

    // Pan camera to the new character (only if sprite is loaded)
    if (targetCharacter.sprite) {
      this.panCameraTo(targetCharacter)
    }
  }

  _triggerSwitchParticles(character) {
    if (!character?.sprite) return

    // Character sprites are on the map layer (stage space). Convert to imageGroup-local coords.
    const localX = character.sprite.attrs.x - this.map.imageGroup.x()
    const localY = character.sprite.attrs.y - this.map.imageGroup.y()

    this._triggerSwitchParticlesAtLocal(localX, localY)
  }

  _triggerSwitchParticlesAtLocal(localX, localY) {
    this.particles.createParticles(localX, localY, 8, undefined, {
      speedMin: PARTICLE_CONFIG.DEFAULT_SPEED_MIN,
      speedMax: PARTICLE_CONFIG.DEFAULT_SPEED_MAX,
      sizeMin: PARTICLE_CONFIG.DEFAULT_SIZE_MIN,
      sizeMax: PARTICLE_CONFIG.DEFAULT_SIZE_MAX,
      life: PARTICLE_CONFIG.DEFAULT_LIFETIME,
      yOffset: 28,
      gravityY: 0,
    })
  }

  panCameraTo(character) {
    if (!character.sprite) return

    // Calculate how far we need to move the camera to center this character
    const targetSpriteX = character.sprite.attrs.x
    const targetSpriteY = character.sprite.attrs.y
    const currentCenterX = character.initX
    const currentCenterY = character.initY

    const deltaX = currentCenterX - targetSpriteX
    const deltaY = currentCenterY - targetSpriteY

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return // Already centered

    // Move the map and all character sprites instantly
    this.map.imageGroup.move({ x: deltaX, y: deltaY })
    for (const char of this.characters.values()) {
      if (char.sprite) {
        char.sprite.move({ x: deltaX, y: deltaY })
      }
    }
  }

  update() {
    const activeCharacterId = playerStore.getState().activeCharacterId
    const activeCharacter = this.characters.get(activeCharacterId)

    // Tab/B cycles through party members (recruiting happens by talking to them)
    if (this.input.switchCharacterPress && !this.lastSwitchPress) {
      const controllableChars = playerStore.getState().getControllableCharacters()
      if (controllableChars.length > 1) {
        const currentIndex = controllableChars.findIndex((c) => c.id === activeCharacterId)
        const nextIndex = (currentIndex + 1) % controllableChars.length
        this.switchToCharacter(controllableChars[nextIndex].id)
      }
    }
    this.lastSwitchPress = this.input.switchCharacterPress

    // Update only the active character
    if (activeCharacter) {
      activeCharacter.update()
    }

    // Update all other characters' visuals (but not their input/logic)
    for (const [id, character] of this.characters) {
      if (id !== activeCharacterId && character.sprite) {
        // Keep idle animation for inactive characters
        const playerState = playerStore.getState().characters[id]
        if (playerState && !playerState.isInteracting) character.sprite.animation('idle')
      }
    }

    // Update switch particles
    this.particles.update()
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}
