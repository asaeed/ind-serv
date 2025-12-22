import { create } from 'zustand'
import npcData from '../../data/npc.json'
import mapData from '../../data/map.json'
import itemData from '../../data/item.json'

const gameStore = create((set, get) => ({
  score: 0,
  debt: 1000,
  money: 0,
  hasWon: false,
  creatingMud: false,
  moldingBricks: false,
  bakingBricks: false,
  shippingBricks: false,
  numMud: 8,
  numBricksMolded: 8,
  numBricksBaked: 8,
  numBricksShipped: 8,
  mapData,
  npcData,
  itemData,
  textPanelContent: null,
  textPanelOptions: [],
  textPanelOptionIdx: 0,
  recruitedNpcs: [], // Array of recruited NPC names

  // Organized tracking data (keeps store clean)
  tracking: {
    dialogsSeen: {}, // { npcName: true }
    itemsUsed: {}, // { itemName: true }
  },

  // actions
  increaseScore: () => set((state) => ({ score: state.score + 1 })),

  interactWith: (gameObject, characterId = null) => {
    const { numBricksShipped, textPanelContent } = get()
    const playerStore = require('./playerStore').default

    // if text panel is open and it's an NPC dialog, just close it
    if (textPanelContent !== null && (!gameObject || gameObject.type === 'npc')) {
      set((state) => ({ textPanelContent: null, textPanelOptions: [] }))
      return
    }

    // if text panel is open and it's an item, close it and continue to execute action
    if (textPanelContent !== null && gameObject && gameObject.type === 'item') {
      set((state) => ({ textPanelContent: null, textPanelOptions: [] }))
      // continue to execute the action below
    }

    if (gameObject) {
      if (gameObject.type === 'npc') {
        const npc = gameObject

        // Handle recruitable NPC
        if (npc.recruitable && !get().recruitedNpcs.includes(npc.name)) {
          const hasSeenDialog = get().tracking.dialogsSeen[npc.name]
          if (hasSeenDialog) {
            // Second interaction - recruit them
            get().recruitNpc(npc.name)
            set((state) => ({
              textPanelContent: `${npc.name} has joined you! Press TAB to switch between characters.`,
              tracking: {
                ...state.tracking,
                dialogsSeen: { ...state.tracking.dialogsSeen, [npc.name]: true },
              },
            }))
            return
          } else {
            // First interaction - show dialog
            set((state) => ({
              tracking: {
                ...state.tracking,
                dialogsSeen: { ...state.tracking.dialogsSeen, [npc.name]: true },
              },
            }))
          }
        }

        let selectedSpeech = null
        selectedSpeech = '...'
        for (let i = 0; i < npc.speech?.length; i++) {
          if (numBricksShipped >= npc.speech[i].minBricks) {
            selectedSpeech = npc.speech[i].text
          } else break
        }

        set((state) => ({ textPanelContent: selectedSpeech }))
      } else if (gameObject.type === 'item') {
        const item = gameObject

        // show dialog on first use if configured
        if (item.action?.showOnFirstUse) {
          const hasUsedBefore = get().tracking.itemsUsed[item.name]
          if (!hasUsedBefore) {
            set((state) => ({
              textPanelContent: item.dialog.text,
              textPanelOptions: item.dialog.options || [],
              tracking: {
                ...state.tracking,
                itemsUsed: { ...state.tracking.itemsUsed, [item.name]: true },
              },
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
              // Check if we should continue before updating state
              const shouldContinue = characterId
                ? playerStore.getState().getAutoProductionItem(characterId) === item.name
                : false

              set((state) => ({
                [item.action.checkState]: false,
                [item.action.creates]: state[item.action.creates] + 1,
              }))

              // Auto-production: retrigger on next tick if still active
              // Small delay allows ItemController to detect state changes for visual effects
              if (
                shouldContinue &&
                characterId &&
                playerStore.getState().getAutoProductionItem(characterId) === item.name
              ) {
                setTimeout(() => get().interactWith(item, characterId), 16)
              }
            }, item.action.duration)
          }
        } else if (item.action?.type === 'convert') {
          const isConverting = get()[item.action.checkState]
          const hasResource = get()[item.action.consumes] > 0

          if (!isConverting && hasResource) {
            set(() => ({ [item.action.checkState]: true }))

            setTimeout(() => {
              // Check if we should continue before updating state
              const shouldContinue = characterId
                ? playerStore.getState().getAutoProductionItem(characterId) === item.name
                : false

              set((state) => {
                const newState = {
                  [item.action.checkState]: false,
                  [item.action.consumes]: state[item.action.consumes] - 1,
                  [item.action.creates]: state[item.action.creates] + 1,
                }

                // Economy: Earn money from shipping bricks and reduce debt
                if (item.name === 'truck' && item.action.creates === 'numBricksShipped') {
                  const moneyEarned = 10 // $10 per brick
                  const newMoney = state.money + moneyEarned
                  const newDebt = Math.max(0, state.debt - moneyEarned)

                  newState.money = newMoney
                  newState.debt = newDebt

                  // Check win condition
                  if (newDebt === 0 && !state.hasWon) {
                    newState.hasWon = true
                    newState.textPanelContent = '🎉 YOU WON! Debt paid off! You are FREE!'
                  }
                }

                return newState
              })

              // Auto-production: retrigger on next tick if still active
              // Small delay allows ItemController to detect state changes for visual effects
              if (
                shouldContinue &&
                characterId &&
                playerStore.getState().getAutoProductionItem(characterId) === item.name
              ) {
                setTimeout(() => get().interactWith(item, characterId), 16)
              }
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

  // Recruit NPC
  recruitNpc: (npcName) => {
    set((state) => ({
      recruitedNpcs: [...state.recruitedNpcs, npcName],
    }))

    // Add to player store as controllable character
    const playerStore = require('./playerStore').default
    playerStore.getState().addCharacter(npcName, {
      sprite: null, // Will be set by CharacterController
    })
  },
}))

export default gameStore
