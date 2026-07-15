import { create } from 'zustand'
import npcData from '../../data/npc.json'
import mapData from '../../data/map.json'
import itemData from '../../data/item.json'
import eventData from '../../data/event.json'
import { ECONOMY } from '../constants'
import track from '../lib/analytics'

const getSwitchKeyLabel = () => {
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches
  return isMobile ? 'B' : 'Tab'
}

const gameStore = create((set, get) => ({
  score: 0,
  debt: 0, // spins up to $1,000 when the opening event is dismissed (its debtDelta)
  money: 0,
  brickPrice: ECONOMY.STARTING_BRICK_PRICE,
  creatingMud: false,
  moldingBricks: false,
  bakingBricks: false,
  shippingBricks: false,
  numMud: 0,
  numBricksMolded: 0,
  numBricksBaked: 0,
  numBricksShipped: 0,
  mapData,
  npcData,
  itemData,
  // narrative event engine
  eventsDone: {}, // { eventId: true }
  recurringCount: 0, // how many times the repeating charge has fired
  pendingDebtDelta: 0, // applied (with HUD spin) when the event panel is dismissed
  eventPanelOpen: false, // while true, production pauses and no new event can fire
  fateAvailable: false, // debt crossed GIVE_UP_THRESHOLD; "Accept your fate" shown
  gameStarted: false, // false until the start-screen button is clicked; game is frozen
  gameOver: false,
  // stats for the end page
  totalEarned: 0,
  totalCharged: 0,
  startTime: Date.now(),
  // effective duration of in-flight actions, keyed by item name (injury-scaled; drives progress bars)
  activeActionDurations: {},
  textPanelContent: null,
  textPanelOptions: [],
  textPanelOptionIdx: 0,
  activeNpcDialogName: null,
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

    // characterId is passed for per-character interactions.
    // Background auto-production also passes characterId. We'll distinguish those cases below.
    const hasCharacter = Boolean(characterId)

    // If text panel is open and it's an NPC dialog, just close it.
    // But don't let background auto-production close panels.
    if (textPanelContent !== null && (!gameObject || gameObject.type === 'npc')) {
      // NPC dialogs are only opened via manual interaction; auto-production shouldn't be invoking NPC dialogs.
      get().closeTextPanel()
      return
    }

    if (textPanelContent !== null && gameObject && gameObject.type === 'item') {
      // Keep the panel open by default; item dialogs are dismissed by an explicit user action.
      // Auto-production background ticks must not close panels.
      // continue to execute the action below
    }

    if (gameObject) {
      if (gameObject.type === 'npc') {
        const npc = gameObject

        // Talking to a recruitable NPC recruits them on the spot;
        // TAB/B switches to them any time after (panel open or not).
        const justRecruited = npc.recruitable && !get().recruitedNpcs.includes(npc.name)
        if (justRecruited) {
          get().recruitNpc(npc.name)
          set((state) => ({
            tracking: {
              ...state.tracking,
              dialogsSeen: { ...state.tracking.dialogsSeen, [npc.name]: true },
            },
          }))
        }

        let selectedSpeech = null
        selectedSpeech = '...'
        for (let i = 0; i < npc.speech?.length; i++) {
          if (numBricksShipped >= npc.speech[i].minBricks) {
            selectedSpeech = npc.speech[i].text
          } else break
        }

        // Dynamically append the joined notice + switch hint.
        // (Do not store this string in npc.json; keep it short - the panel clips long text.)
        if (justRecruited) {
          const keyLabel = getSwitchKeyLabel()
          selectedSpeech = `${selectedSpeech}\n\n${npc.name} joined! Press ${keyLabel} to switch.`
        }

        set((state) => ({ textPanelContent: selectedSpeech, activeNpcDialogName: npc.name }))
      } else if (gameObject.type === 'item') {
        const item = gameObject

        // production pauses while an event banner is up; in-flight actions finish,
        // nothing new starts. closeTextPanel resumes paused auto-production chains.
        if (get().eventPanelOpen) return

        // show dialog on first use if configured
        if (item.action?.showOnFirstUse) {
          const hasUsedBefore = get().tracking.itemsUsed[item.name]
          if (!hasUsedBefore) {
            set((state) => ({
              textPanelContent: item.dialog.text,
              textPanelOptions: item.dialog.options || [],
              activeNpcDialogName: null,
              tracking: {
                ...state.tracking,
                itemsUsed: { ...state.tracking.itemsUsed, [item.name]: true },
              },
            }))
            return // don't execute action when showing dialog
          }
        }

        // handle item action if configured
        // injured characters work at half speed: scale the action duration
        const workSpeed = characterId ? playerStore.getState().getWorkSpeedMultiplier(characterId) : 1
        const duration = item.action?.duration / workSpeed

        if (item.action?.type === 'create') {
          const isCreating = get()[item.action.checkState]
          if (!isCreating) {
            set((state) => ({
              [item.action.checkState]: true,
              activeActionDurations: { ...state.activeActionDurations, [item.name]: duration },
            }))

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
            }, duration)
          }
        } else if (item.action?.type === 'convert') {
          const isConverting = get()[item.action.checkState]
          const hasResource = get()[item.action.consumes] > 0

          if (!isConverting && hasResource) {
            set((state) => ({
              [item.action.checkState]: true,
              activeActionDurations: { ...state.activeActionDurations, [item.name]: duration },
            }))

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

                // Economy: shipping bricks earns money and pays down debt.
                // There is no win state - the event script guarantees debt outruns earnings.
                if (item.action.creates === 'numBricksShipped') {
                  newState.money = state.money + state.brickPrice
                  newState.debt = Math.max(0, state.debt - state.brickPrice)
                  newState.totalEarned = state.totalEarned + state.brickPrice
                }

                return newState
              })

              // narrative events fire on shipped-brick milestones
              if (item.action.creates === 'numBricksShipped') get().checkEvents()

              // Auto-production: retrigger on next tick if still active
              // Small delay allows ItemController to detect state changes for visual effects
              if (
                shouldContinue &&
                characterId &&
                playerStore.getState().getAutoProductionItem(characterId) === item.name
              ) {
                setTimeout(() => get().interactWith(item, characterId), 16)
              }
            }, duration)
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
              activeNpcDialogName: null,
            }))
          }
        }
      }
    }
  },

  // Close the text panel; if a narrative event was showing, its debt hit lands now
  // (the HUD animates the jump - dismissing the bad news is what makes it real).
  closeTextPanel: () => {
    const wasEventPanel = get().eventPanelOpen
    const { pendingDebtDelta, debt, fateAvailable, numBricksShipped } = get()
    if (pendingDebtDelta && !fateAvailable && debt + pendingDebtDelta >= ECONOMY.GIVE_UP_THRESHOLD) {
      track('fate_available', { debt: debt + pendingDebtDelta, bricksShipped: numBricksShipped })
    }

    set((state) => {
      const newState = {
        textPanelContent: null,
        textPanelOptions: [],
        activeNpcDialogName: null,
        eventPanelOpen: false,
      }

      if (state.pendingDebtDelta) {
        const newDebt = state.debt + state.pendingDebtDelta
        newState.debt = newDebt
        newState.totalCharged = state.totalCharged + state.pendingDebtDelta
        newState.pendingDebtDelta = 0
        if (newDebt >= ECONOMY.GIVE_UP_THRESHOLD) newState.fateAvailable = true
      }

      return newState
    })

    if (wasEventPanel) {
      // resume auto-production chains that were paused by the banner
      const playerStore = require('./playerStore').default
      for (const char of Object.values(playerStore.getState().characters)) {
        if (char.autoProductionItem) {
          const itemDef = get().itemData.find((i) => i.name === char.autoProductionItem)
          if (itemDef) setTimeout(() => get().interactWith({ ...itemDef, type: 'item' }, char.id), 50)
        }
      }

      // a milestone crossed while the banner was up shows now
      get().checkEvents()
    }
  },

  // Narrative event engine: fires at most one event per shipped brick.
  // Events show their text immediately; debtDelta is held in pendingDebtDelta
  // until the panel is dismissed. Also called once at startup for the opening card.
  checkEvents: () => {
    const state = get()
    const shipped = state.numBricksShipped

    // one banner at a time: while one is up, later milestones wait for dismissal
    if (state.eventPanelOpen) return

    for (const ev of eventData) {
      if (state.eventsDone[ev.id]) continue

      // repeating charge: escalates forever, never marked done
      if (ev.repeat) {
        const nextAt = ev.trigger.bricksShipped + state.recurringCount * ev.repeat.every
        if (shipped < nextAt) continue

        const amount = ev.debtDelta + state.recurringCount * ev.repeat.escalate
        // rotate through text variants so the recurring charge doesn't read as a stamp
        const template = ev.texts ? ev.texts[state.recurringCount % ev.texts.length] : ev.text
        track('story_event', { id: ev.id, debtDelta: amount, bricksShipped: shipped, occurrence: state.recurringCount + 1 })
        set((s) => ({
          recurringCount: s.recurringCount + 1,
          pendingDebtDelta: s.pendingDebtDelta + amount,
          textPanelContent: template.replace('${amount}', amount),
          textPanelOptions: [],
          activeNpcDialogName: null,
          eventPanelOpen: true,
        }))
        return
      }

      if (shipped < ev.trigger.bricksShipped) continue

      // injury events need the target working at the kiln; skip permanently otherwise
      if (ev.trigger.requiresRecruit && !state.recruitedNpcs.includes(ev.trigger.requiresRecruit)) {
        track('story_event_skipped', { id: ev.id, bricksShipped: shipped })
        set((s) => ({ eventsDone: { ...s.eventsDone, [ev.id]: true } }))
        continue
      }

      if (ev.injures) {
        const playerStore = require('./playerStore').default
        playerStore.getState().setWorkSpeedMultiplier(ev.injures, ECONOMY.INJURY_SPEED_MULTIPLIER)
      }

      track('story_event', { id: ev.id, debtDelta: ev.debtDelta || 0, bricksShipped: shipped })
      set((s) => ({
        eventsDone: { ...s.eventsDone, [ev.id]: true },
        pendingDebtDelta: s.pendingDebtDelta + (ev.debtDelta || 0),
        ...(ev.brickPrice ? { brickPrice: ev.brickPrice } : {}),
        textPanelContent: ev.text,
        textPanelOptions: [],
        activeNpcDialogName: null,
        eventPanelOpen: true,
      }))
      return
    }
  },

  acceptFate: () => {
    const s = get()
    track('gave_up', {
      bricksShipped: s.numBricksShipped,
      debt: s.debt,
      debtPaid: s.totalEarned,
      debtAdded: s.totalCharged,
      yearsWorked: Math.floor((Date.now() - s.startTime) / 60000),
      recruited: s.recruitedNpcs,
    })
    set({ gameOver: true })
  },

  // Start-screen button clicked: unfreeze the game and fire the opening narration.
  // The year clock (1 real minute = 1 year) starts now, not at page load.
  startGame: () => {
    track('game_started')
    set({ gameStarted: true, startTime: Date.now() })
    get().checkEvents()
  },

  // Recruit NPC: they join the party as a controllable character
  recruitNpc: (npcName) => {
    track('recruited', { npc: npcName, bricksShipped: get().numBricksShipped })

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
