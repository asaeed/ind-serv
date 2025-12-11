import { create } from 'zustand'
import npcData from '../../data/npc.json'
import mapData from '../../data/map.json'
import itemData from '../../data/item.json'

const gameStore = create((set, get) => ({
  score: 0,
  creatingMud: false,
  numMud: 0,
  numMolded: 0,
  numBaked: 0,
  numBricks: 0,
  mapData,
  npcData,
  itemData,
  textPanelContent: null,
  textPanelOptions: [],
  textPanelOptionIdx: 0,

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),

  interactWith: (gameObject) => {
    const { numBricks, textPanelContent } = get()
    // if no npc or item in range or textpanel is open, close it
    if (textPanelContent !== null) {
      set((state) => ({ textPanelContent: null, textPanelOptions: [] }))
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
      } else if (gameObject.type === 'item') {
        const item = gameObject

        // show dialog on first use if configured
        if (item.action?.showOnFirstUse) {
          const currentCount = get()[item.action.creates]
          if (currentCount === 0) {
            set(() => ({
              textPanelContent: item.dialog.text,
              textPanelOptions: item.dialog.options || [],
            }))
          }
        }

        // handle item action if configured
        if (item.action?.type === 'create') {
          const isCreating = get()[item.action.checkState]
          if (!isCreating) {
            set(() => ({ [item.action.checkState]: true }))

            setTimeout(() => {
              set((state) => ({
                [item.action.checkState]: false,
                [item.action.creates]: state[item.action.creates] + 1,
              }))
            }, item.action.duration)
          }
        }
      }
    }
  },
}))

export default gameStore
