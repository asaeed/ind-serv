import { create } from 'zustand'

export const PlayerStates = {
  STANDING: 'standing',
  WALKING: 'walking',
  TALKING: 'talking',
  POKING: 'poking',
}

const playerStore = create((set) => ({
  playerState: PlayerStates.STANDING,
  facingDirection: 'right',
  isJumping: false,
  speed: 4,

  // actions
  setPlayerState: (newState) => {
    set({ playerState: newState })
    console.log(`Player is now ${newState}`)
  },

  setFacingDirection: (direction) => {
    set({ facingDirection: direction })
  },

  setIsJumping: (jumping) => {
    set({ isJumping: jumping })
  },

  setSpeed: (newSpeed) => {
    set({ speed: newSpeed })
  },
}))

export default playerStore
