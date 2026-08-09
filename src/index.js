import './css/index.scss'
import Game from './js/Game'
import track from './js/lib/analytics'
import gameStore from './js/state/gameStore'

// Lock out pinch-zoom. The viewport meta already says user-scalable=no, but iOS Safari has
// ignored that since iOS 10 - and because the canvas sets touch-action:none, a player who
// pinches in then has no way to pinch back out and is stuck zoomed for the rest of the
// game. Safari's non-standard gesture events are the only reliable hook; dblclick covers
// double-tap-to-zoom.
for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
}

// Multi-touch pinch on browsers without those gesture events (Android/Chrome). Single
// touches fall through untouched, so the D-pad and tap-to-move keep working.
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault()
  },
  { passive: false }
)

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
