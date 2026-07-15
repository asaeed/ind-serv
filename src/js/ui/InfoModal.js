import track from '../lib/analytics'
import { CONTACT } from '../constants'

// Persistent (i) button on the game frame -> DOM modal (dark-ledger skin):
// creator credit, controls, art credits, contact form, profile links.
export default class InfoModal {
  constructor() {
    this.root = document.querySelector('.info-modal')
    this.button = document.querySelector('.info-button')
    this.form = this.root.querySelector('.info-modal__contact')
    this.status = this.root.querySelector('.info-modal__status')
    this.links = this.root.querySelector('.info-modal__links')

    // the contact form only exists once a Formspree ID is configured
    if (CONTACT.FORMSPREE_ID) this.form.classList.remove('hidden')

    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.handleBackdrop = (e) => {
      if (e.target === this.root) this.close()
    }
    this.handleEscape = (e) => {
      if (e.key === 'Escape' && !this.root.classList.contains('hidden')) this.close()
    }
    this.handleLinkClick = (e) => {
      const a = e.target.closest('a')
      if (a) track('profile_link_clicked', { which: a.textContent.trim() })
    }
    this.handleSubmit = this.handleSubmit.bind(this)

    this.button.addEventListener('click', this.open)
    this.root.querySelector('.info-modal__close').addEventListener('click', this.close)
    this.root.addEventListener('click', this.handleBackdrop)
    document.addEventListener('keydown', this.handleEscape)
    this.links.addEventListener('click', this.handleLinkClick)
    this.form.addEventListener('submit', this.handleSubmit)
  }

  open() {
    this.root.classList.remove('hidden')
    track('info_opened')
  }

  close() {
    this.root.classList.add('hidden')
    track('info_closed')
  }

  async handleSubmit(e) {
    e.preventDefault()
    track('contact_submitted')

    try {
      const res = await fetch(`https://formspree.io/f/${CONTACT.FORMSPREE_ID}`, {
        method: 'POST',
        body: new FormData(this.form),
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        this.form.classList.add('hidden')
        this.status.textContent = 'Sent. Thank you!'
      } else {
        this.status.textContent = 'Something went wrong - try the links below instead.'
      }
    } catch (err) {
      this.status.textContent = 'Something went wrong - try the links below instead.'
    }
    this.status.classList.remove('hidden')
  }

  dispose() {
    this.button.removeEventListener('click', this.open)
    this.root.removeEventListener('click', this.handleBackdrop)
    document.removeEventListener('keydown', this.handleEscape)
    this.links.removeEventListener('click', this.handleLinkClick)
    this.form.removeEventListener('submit', this.handleSubmit)
  }
}
