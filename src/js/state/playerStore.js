import { create } from 'zustand'

export const PlayerStates = {
  STANDING: 'standing',
  WALKING: 'walking',
  TALKING: 'talking',
  POKING: 'poking',
}

const playerStore = create((set, get) => ({
  // Multi-character system
  characters: {
    player: {
      id: 'player',
      playerState: PlayerStates.STANDING,
      facingDirection: 'right',
      isJumping: false,
      speed: 4,
      controllable: true,
      autoProductionItem: null, // Track per-character auto-production
    },
  },
  activeCharacterId: 'player',

  // Legacy getters for backwards compatibility
  get playerState() {
    return get().characters[get().activeCharacterId]?.playerState
  },
  get facingDirection() {
    return get().characters[get().activeCharacterId]?.facingDirection
  },
  get isJumping() {
    return get().characters[get().activeCharacterId]?.isJumping
  },
  get speed() {
    return get().characters[get().activeCharacterId]?.speed
  },

  // actions
  setPlayerState: (newState) => {
    const activeId = get().activeCharacterId
    set((state) => ({
      characters: {
        ...state.characters,
        [activeId]: { ...state.characters[activeId], playerState: newState },
      },
    }))
    console.log(`${activeId} is now ${newState}`)
  },

  setFacingDirection: (direction) => {
    const activeId = get().activeCharacterId
    set((state) => ({
      characters: {
        ...state.characters,
        [activeId]: { ...state.characters[activeId], facingDirection: direction },
      },
    }))
  },

  setIsJumping: (jumping) => {
    const activeId = get().activeCharacterId
    set((state) => ({
      characters: {
        ...state.characters,
        [activeId]: { ...state.characters[activeId], isJumping: jumping },
      },
    }))
  },

  setSpeed: (newSpeed) => {
    const activeId = get().activeCharacterId
    set((state) => ({
      characters: {
        ...state.characters,
        [activeId]: { ...state.characters[activeId], speed: newSpeed },
      },
    }))
  },

  // Multi-character actions
  addCharacter: (id, characterData) => {
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          id,
          playerState: PlayerStates.STANDING,
          facingDirection: 'right',
          isJumping: false,
          speed: 4,
          controllable: true,
          autoProductionItem: null,
          ...characterData,
        },
      },
    }))
  },

  switchCharacter: (characterId) => {
    const char = get().characters[characterId]
    if (char && char.controllable) {
      set({ activeCharacterId: characterId })
    }
  },

  getActiveCharacter: () => {
    return get().characters[get().activeCharacterId]
  },

  getControllableCharacters: () => {
    return Object.values(get().characters).filter((char) => char.controllable)
  },

  // Per-character auto-production
  startAutoProduction: (characterId, itemName) => {
    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: { ...state.characters[characterId], autoProductionItem: itemName },
      },
    }))
  },

  stopAutoProduction: (characterId) => {
    set((state) => ({
      characters: {
        ...state.characters,
        [characterId]: { ...state.characters[characterId], autoProductionItem: null },
      },
    }))
  },

  getAutoProductionItem: (characterId) => {
    return get().characters[characterId]?.autoProductionItem
  },
}))

export default playerStore
