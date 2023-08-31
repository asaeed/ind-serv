import { create } from 'zustand'
import npcData from '../data/npc.json' // Import the JSON file

const gameStore = create((set) => ({
  score: 0,
  lives: 3,
  npcData: npcData,
  isTextPanelVisible: false,

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),
  showTextPanel: () => set((state) => ({ isTextPanelVisible: true })),
  hideTextPanel: () => set((state) => ({ isTextPanelVisible: false })),
}))

export default gameStore
