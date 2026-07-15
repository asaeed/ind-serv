import gameStore from '../state/gameStore'
import track from '../lib/analytics'
import { CONTACT } from '../constants'

// DOM overlay (not canvas): the "Accept your fate" button and end page need
// real focusable links, so they live in index.html and are toggled here.
export default class EndGame {
  constructor() {
    this.fateButton = document.querySelector('.fate-button')
    this.endPage = document.querySelector('.end-page')

    this.handleClick = this.handleClick.bind(this)
    this.fateButton.addEventListener('click', this.handleClick)

    // which resource links get clicked is the end page's whole point
    this.linksEl = this.endPage.querySelector('.end-page__links')
    this.handleLinkClick = (e) => {
      const a = e.target.closest('a')
      if (a) track('resource_link_clicked', { url: a.href })
    }
    this.linksEl.addEventListener('click', this.handleLinkClick)

    // clicks inside the YouTube iframe are invisible cross-origin; the
    // focus-shift-on-click trick catches the first play interaction
    this.videoIframe = this.endPage.querySelector('.end-page__video iframe')
    this._videoTracked = false
    this.handleWindowBlur = () => {
      if (!this._videoTracked && document.activeElement === this.videoIframe) {
        this._videoTracked = true
        track('video_engaged')
      }
    }
    window.addEventListener('blur', this.handleWindowBlur)

    // share nudge: copy the game URL to the clipboard
    this.shareButton = this.endPage.querySelector('.share-button')
    this.handleShare = async () => {
      track('share_clicked')
      try {
        await navigator.clipboard.writeText(CONTACT.GAME_URL)
        this.shareButton.textContent = 'Copied!'
        setTimeout(() => {
          this.shareButton.textContent = 'Copy link'
        }, 2000)
      } catch (err) {
        this.shareButton.textContent = CONTACT.GAME_URL // clipboard blocked: show the URL itself
      }
    }
    this.shareButton.addEventListener('click', this.handleShare)

    this.unsubscribe = gameStore.subscribe((state) => {
      if (state.fateAvailable && !state.gameOver) {
        this.fateButton.classList.remove('hidden')
      }
    })
  }

  handleClick() {
    const state = gameStore.getState()
    state.acceptFate()

    // stats as indictment (1 real minute = 1 year worked)
    const years = Math.max(1, Math.floor((Date.now() - state.startTime) / 60000))
    this.endPage.querySelector('.end-stat--bricks').textContent = state.numBricksShipped
    this.endPage.querySelector('.end-stat--paid').textContent = `$${state.totalEarned}`
    this.endPage.querySelector('.end-stat--added').textContent = `$${state.totalCharged}`
    this.endPage.querySelector('.end-stat--time').textContent = years === 1 ? '1 year' : `${years} years`

    this.fateButton.classList.add('hidden')
    document.querySelector('.main-container').classList.add('faded')
    setTimeout(() => {
      this.endPage.classList.remove('hidden')
    }, 1200) // matches the CSS fade duration
  }

  dispose() {
    if (this.unsubscribe) this.unsubscribe()
    this.fateButton.removeEventListener('click', this.handleClick)
    this.linksEl.removeEventListener('click', this.handleLinkClick)
    window.removeEventListener('blur', this.handleWindowBlur)
    this.shareButton.removeEventListener('click', this.handleShare)
  }
}
