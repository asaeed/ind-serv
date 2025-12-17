import './css/index.scss'
import Game from './js/Game'

let game = new Game()
game.mainLoop()

// needed for webpack hot reload
if (module.hot) {
  module.hot.dispose(() => {
    if (game && game.dispose) {
      game.dispose()
    }
  })
  module.hot.accept()
}
