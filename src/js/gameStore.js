import { create } from 'zustand'
import npcData from '../data/npc.json'
import mapData from '../data/map.json'
import itemData from '../data/item.json'
import { PlayerStates } from './Player'

const gameStore = create((set, get) => ({
  score: 0,
  numBricks: 0,
  mapData: mapData,
  npcData: npcData,
  itemData: itemData,
  textPanelContent: null,
  textPanelOptions: [],
  playerState: PlayerStates.STANDING,

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),

  setPlayerState: (newState) => {
    this.playerState = newState
    console.log(`Player is now ${this.playerState}`)
  },

  interactWith: (gameObject) => {
    const { numBricks, textPanelContent } = get()
    // if no npc or item in range or textpanel is open, close it
    if (textPanelContent !== null) {
      set((state) => ({ textPanelContent: null }))
      return
    }

    if (gameObject) {
      if (gameObject.type === 'npc') {
        const npc = gameObject
        let selectedSpeech = null

        selectedSpeech = '...'
        for (let i = 0; i < npc.speech?.length; i++) {
          if (numBricks >= npc.speech[i].minBricks) {
            selectedSpeech = npc.speech[i].text
          } else break
        }

        set((state) => ({ textPanelContent: selectedSpeech }))
      } else {
        const item = gameObject
        console.log(item)
        set((state) => ({
          textPanelContent: item.dialog.text,
          textPanelOptions: item.dialog.options,
        }))
      }
    }
  },
}))

export default gameStore
