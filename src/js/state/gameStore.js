import { create } from 'zustand'
import npcData from '../../data/npc.json'
import mapData from '../../data/map.json'
import itemData from '../../data/item.json'

const createTime = 1000

const gameStore = create((set, get) => ({
  score: 0,
  creatingMud: false,
  numMud: 0,
  numMolded: 0,
  numBaked: 0,
  numBricks: 0,
  mapData: mapData,
  npcData: npcData,
  itemData: itemData,
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
        const { numMud, creatingMud } = get()

        // first time show dialog
        if (numMud === 0) {
          set((state) => ({
            textPanelContent: item.dialog.text,
            textPanelOptions: item.dialog.options || [],
          }))
        }

        if (gameObject.name === 'shovel' && !creatingMud) {
          // kick off mud creation.
          set((state) => ({ creatingMud: true }))

          setTimeout(() => {
            set((state) => ({
              creatingMud: false,
              numMud: state.numMud + 1,
            }))
          }, createTime)
        }
      }
    }
  },
}))

export default gameStore
