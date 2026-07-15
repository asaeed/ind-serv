import './css/index.scss'
import Game from './js/Game'
import track from './js/lib/analytics'
import gameStore from './js/state/gameStore'

let game = new Game()
game.mainLoop()

// funnel bookends: visitors who bounce at the start screen, and players
// who leave without clicking "Accept your fate" (keepalive fetch survives unload)
track('page_loaded')
window.addEventListener('pagehide', () => {
  const s = gameStore.getState()
  track('left', {
    gameStarted: s.gameStarted,
    gaveUp: s.gameOver,
    bricksShipped: s.numBricksShipped,
    debt: s.debt,
  })
})

// needed for webpack hot reload
if (module.hot) {
  module.hot.dispose(() => {
    if (game && game.dispose) {
      game.dispose()
    }
  })
  module.hot.accept()
}
