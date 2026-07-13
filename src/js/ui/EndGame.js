import gameStore from '../state/gameStore'

// DOM overlay (not canvas): the "Accept your fate" button and end page need
// real focusable links, so they live in index.html and are toggled here.
export default class EndGame {
  constructor() {
    this.fateButton = document.querySelector('.fate-button')
    this.endPage = document.querySelector('.end-page')

    this.handleClick = this.handleClick.bind(this)
    this.fateButton.addEventListener('click', this.handleClick)

    this.unsubscribe = gameStore.subscribe((state) => {
      if (state.fateAvailable && !state.gameOver) {
        this.fateButton.classList.remove('hidden')
      }
    })
  }

  handleClick() {
    const state = gameStore.getState()
    state.acceptFate()

    // stats as indictment
    const minutes = Math.max(1, Math.round((Date.now() - state.startTime) / 60000))
    this.endPage.querySelector('.end-stat--bricks').textContent = state.numBricksShipped
    this.endPage.querySelector('.end-stat--paid').textContent = `$${state.totalEarned}`
    this.endPage.querySelector('.end-stat--added').textContent = `$${state.totalCharged}`
    this.endPage.querySelector('.end-stat--time').textContent = `${minutes} min`

    this.fateButton.classList.add('hidden')
    document.querySelector('.main-container').classList.add('faded')
    setTimeout(() => {
      this.endPage.classList.remove('hidden')
    }, 1200) // matches the CSS fade duration
  }

  dispose() {
    if (this.unsubscribe) this.unsubscribe()
    this.fateButton.removeEventListener('click', this.handleClick)
  }
}
