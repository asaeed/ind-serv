import { create } from 'zustand'

const gameStore = create((set) => ({
  score: 0,
  lives: 3,
  isTextPanelVisible: false,

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),
  showTextPanel: () => set((state) => ({ isTextPanelVisible: true })),
  hideTextPanel: () => set((state) => ({ isTextPanelVisible: false })),
}))

export default gameStore
