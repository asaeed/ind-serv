import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { create } from 'zustand'

// These classes use webpack imports. Run their actual store/render code with
// browser and canvas dependencies injected, so frame gaps are deterministic.
const source = (file) => fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
class Shape {
  constructor(attrs = {}) { this.attrs = { ...attrs } }
  x() { return this.attrs.x || 0 }
  y() { return this.attrs.y || 0 }
  scaleX() { return 1 }
  width(value) {
    if (value !== undefined) this.attrs.width = value
    return this.attrs.width || 0
  }
  opacity(value) { this.attrs.opacity = value }
  destroy() { this.destroyed = true }
}

function setup() {
  let now = 0
  let wallTime = 0
  let particleBursts = 0
  const timers = []
  const sounds = []
  const context = vm.createContext({
    create,
    console,
    performance: { now: () => now },
    Date: class extends Date { static now() { return wallTime } },
    window: { matchMedia: () => ({ matches: false }) },
    setTimeout: (callback, delay) => timers.push({ callback, at: now + delay }),
    require: (name) => {
      assert.equal(name, './playerStore')
      return { default: context.playerStore }
    },
    track: () => {},
    sfx: { play: (sound) => sounds.push(sound) },
    Konva: { Rect: Shape },
    npcData: JSON.parse(source('data/npc.json')),
    mapData: JSON.parse(source('data/map.json')),
    itemData: JSON.parse(source('data/item.json')),
    eventData: JSON.parse(source('data/event.json')),
  })
  vm.runInContext(source('js/constants.js').replace(/^export /gm, ''), context)
  const load = (file, name) => {
    const code = source(file).replace(/^import .+\n/gm, '')
      .replace(/^export default class /m, 'class ')
      .replace(/^export /gm, '')
      .replace(new RegExp(`^default ${name}$`, 'm'), '')
    vm.runInContext(`${code}\nglobalThis.${name} = ${name}`, context, { filename: file })
  }
  load('js/state/playerStore.js', 'playerStore')
  load('js/state/gameStore.js', 'gameStore')
  load('js/controllers/ItemController.js', 'ItemController')
  const store = context.gameStore
  const players = context.playerStore
  store.setState({
    gameStarted: true,
    eventsDone: { opening: true },
    tracking: { dialogsSeen: {}, itemsUsed: { shovel: true, mold: true, kiln: true, truck: true } },
  })
  const controller = Object.create(context.ItemController.prototype)
  controller.group = { add: () => {}, position: () => ({ x: 0, y: 0 }) }
  controller.items = context.itemData.map((item) => ({
    ...item, type: 'item', o: { image: new Shape({ width: 64 }) },
  }))
  controller.progressBars = new Map()
  controller.tutorialArrows = []
  controller.particles = { createParticles: () => particleBursts++, update: () => {} }

  return {
    store, players, controller, sounds,
    get particleBursts() { return particleBursts },
    get timerCount() { return timers.length },
    start(name, characterId = 'player', auto = true) {
      const item = controller.items.find((item) => item.name === name)
      if (auto && characterId) players.getState().startAutoProduction(characterId, name)
      store.getState().interactWith(item, characterId)
      controller.update(now)
      return item
    },
    frame(timestamp) {
      // Support the old timer implementation too: the regression must fail on
      // its stale bar, rather than just on a missing new store method.
      while (timers.some((timer) => timer.at <= timestamp)) {
        timers.sort((a, b) => a.at - b.at)
        const timer = timers.shift()
        now = timer.at
        wallTime = now
        timer.callback()
      }
      now = timestamp
      wallTime = now
      store.getState().advanceProduction?.(now)
      controller.update(now)
    },
    changeWallTime(timestamp) { wallTime = timestamp },
  }
}

// Reproduce the missed 16ms inactive pulse at every station, both healthy and
// injured. The next visible frame must credit the unit and reset its bar.
for (const name of ['shovel', 'mold', 'kiln', 'truck']) {
  for (const workSpeed of [1, 0.5]) {
    const f = setup()
    f.store.setState({ numMud: 5, numBricksMolded: 5, numBricksBaked: 5 })
    f.players.getState().setWorkSpeedMultiplier('player', workSpeed)
    const item = f.start(name)
    const duration = item.action.duration / workSpeed
    const initialCount = f.store.getState()[item.action.creates]
    const firstBar = f.controller.progressBars.get(name)
    f.frame(duration - 1)
    assert.equal(f.store.getState()[item.action.creates], initialCount)
    assert.ok(firstBar.fill.width() / firstBar.barWidth < 1)
    f.frame(duration + 33) // no render during completion + the old 16ms restart
    const nextBar = f.controller.progressBars.get(name)
    assert.equal(f.store.getState()[item.action.creates], initialCount + 1)
    assert.notEqual(nextBar, firstBar, `${name}: a new cycle must replace the old bar`)
    assert.ok(nextBar.fill.width() / nextBar.barWidth < 0.05, `${name}: the next bar must start empty`)
    assert.equal(nextBar.action.duration, duration, 'injury duration must match the actual work')
    assert.equal(f.sounds.length, 1, 'completion feedback must survive a missed transition')
    assert.equal(f.particleBursts, 1)
    f.frame(duration + 34)
    assert.equal(f.sounds.length, 1, 'feedback must fire once per completed unit')
    assert.equal(f.store.getState()[item.action.creates], initialCount + 1)
    f.frame(duration * 2 + 33)
    assert.equal(f.store.getState()[item.action.creates], initialCount + 2)
    assert.equal(f.sounds.length, 2)
    assert.equal(f.timerCount, 0, 'work cycles must not depend on timeout delivery')
    assert.doesNotThrow(() => JSON.stringify(f.store.getState()), 'canvas objects must stay out of store JSON')
  }
}

// A late frame finishes one unit and starts fresh, never a backlog of units.
{
  const f = setup()
  f.start('shovel')
  f.frame(30000)
  assert.equal(f.store.getState().numMud, 1)
  assert.equal(f.store.getState().activeActions.shovel.startedAt, 30000)
  assert.equal(f.controller.progressBars.get('shovel').fill.width(), 0)
}

// Moving away lets the in-flight unit finish, then stops the chain.
{
  const f = setup()
  f.start('shovel')
  f.players.getState().stopAutoProduction('player')
  f.frame(1000)
  assert.equal(f.store.getState().numMud, 1)
  assert.equal(f.store.getState().creatingMud, false)
  assert.equal(f.controller.progressBars.has('shovel'), false)
  f.frame(5000)
  assert.equal(f.store.getState().numMud, 1)
}

// Conversion consumes exactly one input; running out stops without a stale bar.
{
  const f = setup()
  f.store.setState({ numMud: 1 })
  f.start('mold')
  f.frame(1500)
  assert.equal(f.store.getState().numMud, 0)
  assert.equal(f.store.getState().numBricksMolded, 1)
  assert.equal(f.store.getState().moldingBricks, false)
  assert.equal(f.controller.progressBars.has('mold'), false)
  f.frame(3000)
  assert.equal(f.store.getState().numMud, 0)
  assert.equal(f.store.getState().numBricksMolded, 1)
}

// The stockpile cap still stops work on the unit that fills it.
{
  const f = setup()
  f.store.setState({ numMud: 19 })
  f.start('shovel')
  f.frame(1000)
  assert.equal(f.store.getState().numMud, 20)
  assert.equal(f.players.getState().getAutoProductionItem('player'), null)
  assert.equal(f.controller.progressBars.has('shovel'), false)
}

// Story banners allow in-flight work to finish but hold the next unit until
// dismissal. Injury-scaled family work resumes immediately with a fresh bar.
{
  const f = setup()
  f.players.getState().addCharacter('wife', {})
  f.players.getState().setWorkSpeedMultiplier('wife', 0.5)
  f.start('shovel', 'wife')
  f.store.setState({ eventPanelOpen: true, textPanelContent: 'Fees are due.' })
  f.frame(2000)
  assert.equal(f.store.getState().numMud, 1)
  assert.equal(f.controller.progressBars.has('shovel'), false)
  f.store.getState().closeTextPanel()
  f.controller.update(2000)
  assert.equal(f.store.getState().activeActions.shovel.startedAt, 2000)
  assert.equal(f.controller.progressBars.get('shovel').fill.width(), 0)
  assert.equal(f.timerCount, 0)
}

// Shipping keeps its economy and event effects; the milestone pauses the chain.
{
  const f = setup()
  const milestone = JSON.parse(source('data/event.json')).find((event) => event.id === 'lodging').trigger.bricksShipped
  f.store.setState({ numBricksBaked: 3, numBricksShipped: milestone - 1, debt: 1000 })
  f.start('truck')
  f.frame(1500)
  assert.equal(f.store.getState().numBricksShipped, milestone)
  assert.equal(f.store.getState().numBricksBaked, 2)
  assert.equal(f.store.getState().money, 10)
  assert.equal(f.store.getState().debt, 990)
  assert.equal(f.store.getState().eventPanelOpen, true)
  assert.equal(f.controller.progressBars.has('truck'), false)
  f.store.getState().closeTextPanel()
  f.controller.update(1500)
  assert.equal(f.controller.progressBars.get('truck').fill.width(), 0)
}

// A queued event that stops the party must not briefly restart paused work.
{
  const f = setup()
  f.start('shovel')
  const milestone = JSON.parse(source('data/event.json')).find((event) => event.id === 'familyArrives').trigger.bricksShipped
  f.store.setState({
    numBricksShipped: milestone,
    eventsDone: { opening: true, lodging: true },
    eventPanelOpen: true,
    textPanelContent: 'An earlier banner is still open.',
  })
  f.frame(1000)
  f.store.getState().closeTextPanel()
  assert.equal(f.store.getState().eventPanelOpen, true)
  assert.equal(f.store.getState().creatingMud, false)
  assert.equal(f.players.getState().getAutoProductionItem('player'), null)
}

// A wall-clock adjustment cannot fill a bar ahead of the monotonic work clock.
{
  const f = setup()
  f.start('shovel')
  f.changeWallTime(60000)
  f.controller.update(500)
  const bar = f.controller.progressBars.get('shovel')
  assert.equal(bar.fill.width() / bar.barWidth, 0.5)
  assert.equal(f.store.getState().numMud, 0)
}

console.log('productionTiming: all assertions passed')
