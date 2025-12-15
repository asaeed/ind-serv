import { create } from 'zustand'
import npcData from '../../data/npc.json'
import mapData from '../../data/map.json'
import itemData from '../../data/item.json'

const gameStore = create((set, get) => ({
  score: 0,
  debt: 1000,
  creatingMud: false,
  bakingMud: false,
  numMud: 0,
  numMudMolded: 5,
  numMudBaked: 0,
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
          const hasUsedBefore = get()[`hasUsed_${item.name}`]
          if (!hasUsedBefore) {
            set(() => ({
              textPanelContent: item.dialog.text,
              textPanelOptions: item.dialog.options || [],
              [`hasUsed_${item.name}`]: true,
            }))
            return // don't execute action when showing dialog
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
        } else if (item.action?.type === 'convert') {
          const isConverting = get()[item.action.checkState]
          const hasResource = get()[item.action.consumes] > 0

          if (!isConverting && hasResource) {
            set(() => ({ [item.action.checkState]: true }))

            setTimeout(() => {
              set((state) => ({
                [item.action.checkState]: false,
                [item.action.consumes]: state[item.action.consumes] - 1,
                [item.action.creates]: state[item.action.creates] + 1,
              }))
            }, item.action.duration)
          } else if (!isConverting && !hasResource) {
            // show "no resources" dialog
            // convert camelCase to readable format: numMudMolded -> "mud molded"
            const resourceName = item.action.consumes
              .replace('num', '')
              .replace(/([A-Z])/g, ' $1')
              .toLowerCase()
              .trim()
            set(() => ({
              textPanelContent: `No ${resourceName} to convert.`,
              textPanelOptions: [],
            }))
          }
        }
      }
    }
  },
}))

export default gameStore
