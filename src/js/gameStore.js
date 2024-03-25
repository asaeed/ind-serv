import { create } from 'zustand'
import npcData from '../data/npc.json' // Import the JSON file
import mapData from '../data/map.json' // Import the JSON file
import { PlayerStates } from './Player'

const gameStore = create((set, get) => ({
  score: 0,
  numBricks: 0,
  mapData: mapData,
  npcData: npcData,
  textPanelContent: null,
  playerState: PlayerStates.STANDING,

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),

  setPlayerState: (newState) => {
    this.playerState = newState
    console.log(`Player is now ${this.playerState}`)
  },

  interactWith: (npcName) => {
    const { npcData, numBricks, textPanelContent } = get()
    // if no npc in range or textpanel is open, close it
    if (textPanelContent !== null) {
      set((state) => ({ textPanelContent: null }))
      return
    }

    let selectedSpeech = null
    if (npcName) {
      const npc = npcData.find((n) => n.name === npcName)
      selectedSpeech = '...'
      for (let i = 0; i < npc.speech?.length; i++) {
        if (numBricks >= npc.speech[i].minBricks) {
          selectedSpeech = npc.speech[i].text
        } else break
      }
    }
    set((state) => ({ textPanelContent: selectedSpeech }))
  },
}))

export default gameStore
