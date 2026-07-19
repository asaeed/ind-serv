import gameStore from '../state/gameStore'
import sfx from '../lib/sfx'

// Start-screen overlay (DOM, mirrors EndGame). The game boots frozen behind it;
// clicking Start fades the overlay, unfreezes the loop, and fires the opening event.
export default class StartGame {
  constructor() {
    this.startPage = document.querySelector('.start-page')
    this.startButton = document.querySelector('.start-button')

    this.handleClick = this.handleClick.bind(this)
    this.startButton.addEventListener('click', this.handleClick)
  }

  handleClick() {
    sfx.unlock() // the gesture browsers require before any audio can play
    sfx.chord() // a warm chord that fades out as the game begins
    gameStore.getState().startGame()

    this.startPage.classList.add('fading')
    setTimeout(() => {
      this.startPage.classList.add('hidden')
    }, 1200) // matches the CSS fade duration
  }

  dispose() {
    this.startButton.removeEventListener('click', this.handleClick)
  }
}
