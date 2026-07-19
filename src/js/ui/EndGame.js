import gameStore from '../state/gameStore'
import track from '../lib/analytics'
import sfx from '../lib/sfx'
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

    // social share buttons: build intent URLs from the game URL, track clicks
    this.socialsEl = this.endPage.querySelector('.end-page__socials')
    const url = encodeURIComponent(CONTACT.GAME_URL)
    const msg = encodeURIComponent("A game you can't win — about debt bondage. The only winning move is giving up.")
    const shareUrls = {
      x: `https://twitter.com/intent/tweet?text=${msg}&url=${url}`,
      reddit: `https://www.reddit.com/submit?url=${url}&title=${msg}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://api.whatsapp.com/send?text=${msg}%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      // Instagram has no web share-intent; point at the site for now (swap for a profile URL)
      instagram: 'https://www.instagram.com/',
    }
    this.socialsEl.querySelectorAll('.social-btn').forEach((a) => {
      if (shareUrls[a.dataset.share]) a.href = shareUrls[a.dataset.share]
    })
    this.handleSocialClick = (e) => {
      const a = e.target.closest('.social-btn')
      if (a) track('share_clicked', { platform: a.dataset.share })
    }
    this.socialsEl.addEventListener('click', this.handleSocialClick)

    // scroll hint: fade the glowing arrow out the moment the player scrolls
    this.scrollArrow = this.endPage.querySelector('.scroll-arrow')
    this.handleEndScroll = () => {
      if (this.endPage.scrollTop > 40) {
        this.scrollArrow.classList.add('scroll-arrow--hidden')
        this.endPage.removeEventListener('scroll', this.handleEndScroll)
      }
    }
    this.endPage.addEventListener('scroll', this.handleEndScroll)

    this.unsubscribe = gameStore.subscribe((state) => {
      if (state.fateAvailable && !state.gameOver) {
        if (this.fateButton.classList.contains('hidden')) {
          sfx.play('fate') // one somber note as it appears
          this.fateButton.classList.remove('hidden')
        }
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
    this.socialsEl.removeEventListener('click', this.handleSocialClick)
    this.endPage.removeEventListener('scroll', this.handleEndScroll)
  }
}
