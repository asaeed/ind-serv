import { create } from 'zustand'

const gameStore = create((set) => ({
  score: 0,
  level: 1,
  lives: 3,
  showTextPanel: false,

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),
  decreaseLives: () => set((state) => ({ lives: state.lives - 1 })),
  increaseLevel: () => set((state) => ({ level: state.level + 1 })),
}))

export default gameStore
