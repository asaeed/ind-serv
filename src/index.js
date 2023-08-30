import './css/index.scss'
import Game from './js/Game'

const game = new Game()
game.mainLoop()

// needed for webpack hot reload
if (module.hot) {
  module.hot.accept()
}
