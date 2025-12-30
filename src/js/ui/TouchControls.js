export default class TouchControls {
  constructor(input, rootEl = document) {
    this.input = input
    this.rootEl = rootEl

    this.touchRoot = rootEl.querySelector('.touch-controls')

    this._activeDirections = new Set()

    this._onPointerDown = this._onPointerDown.bind(this)
    this._onPointerUp = this._onPointerUp.bind(this)
    this._onPointerCancelOrLeave = this._onPointerCancelOrLeave.bind(this)

    this._onTouchStart = this._onTouchStart.bind(this)
    this._onTouchEnd = this._onTouchEnd.bind(this)
    this._onTouchCancel = this._onTouchCancel.bind(this)

    this._isEnabled = false
  }

  init() {
    if (!this.touchRoot) return

    this._updateEnabledState()

    this._onResize = () => this._updateEnabledState()
    window.addEventListener('resize', this._onResize)
    window.addEventListener('orientationchange', this._onResize)
  }

  dispose() {
    if (!this.touchRoot) return
    this._disable()
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize)
      window.removeEventListener('orientationchange', this._onResize)
    }
  }

  _shouldEnable() {
    return window.matchMedia && window.matchMedia('(max-width: 820px)').matches
  }

  _updateEnabledState() {
    const shouldEnable = this._shouldEnable()
    if (shouldEnable && !this._isEnabled) this._enable()
    if (!shouldEnable && this._isEnabled) this._disable()
  }

  _enable() {
    this._isEnabled = true
    this.touchRoot.setAttribute('aria-hidden', 'false')

    // Ensure iOS Safari doesn't interpret gestures as scrolling/zooming.
    this.touchRoot.style.touchAction = 'none'

    // Use pointer events so it works for touch + mouse.
    this.touchRoot.addEventListener('pointerdown', this._onPointerDown, { passive: false })
    window.addEventListener('pointerup', this._onPointerUp, { passive: false })
    window.addEventListener('pointercancel', this._onPointerCancelOrLeave, { passive: false })
    window.addEventListener('blur', this._onPointerCancelOrLeave)

    // Fallback for iOS Safari edge-cases: attach touch events as well.
    this.touchRoot.addEventListener('touchstart', this._onTouchStart, { passive: false })
    this.touchRoot.addEventListener('touchend', this._onTouchEnd, { passive: false })
    this.touchRoot.addEventListener('touchcancel', this._onTouchCancel, { passive: false })

    // Prevent long-press context menu on iOS.
    this._onContextMenu = (e) => e.preventDefault()
    this.touchRoot.addEventListener('contextmenu', this._onContextMenu)
  }

  _disable() {
    if (!this._isEnabled) return
    this._isEnabled = false
    this._releaseAll()
    this.touchRoot.setAttribute('aria-hidden', 'true')

    this.touchRoot.removeEventListener('pointerdown', this._onPointerDown)
    window.removeEventListener('pointerup', this._onPointerUp)
    window.removeEventListener('pointercancel', this._onPointerCancelOrLeave)
    window.removeEventListener('blur', this._onPointerCancelOrLeave)

    this.touchRoot.removeEventListener('touchstart', this._onTouchStart)
    this.touchRoot.removeEventListener('touchend', this._onTouchEnd)
    this.touchRoot.removeEventListener('touchcancel', this._onTouchCancel)

    if (this._onContextMenu) {
      this.touchRoot.removeEventListener('contextmenu', this._onContextMenu)
    }
  }

  _onPointerDown(e) {
    const btn = e.target.closest('button')
    if (!btn || !this.touchRoot.contains(btn)) return

    // Keep the page from scrolling when pressing controls.
    e.preventDefault()
    try {
      btn.setPointerCapture(e.pointerId)
    } catch {
      // Some browsers may throw if capture isn't allowed; safe to ignore.
    }

    const dir = btn.dataset.dir
    const action = btn.dataset.action

    if (dir) {
      this._activeDirections.add(dir)
      this.input.setDirection(dir, 1)
    }

    if (action === 'interact') {
      this.input.setInteract(1)
    }

    if (action === 'switch') {
      this.input.setSwitchCharacter(1)
    }
  }

  _onTouchStart(e) {
    const touchTarget = e.target
    const btn = touchTarget && touchTarget.closest ? touchTarget.closest('button') : null
    if (!btn || !this.touchRoot.contains(btn)) return

    e.preventDefault()
    const dir = btn.dataset.dir
    const action = btn.dataset.action
    if (dir) {
      this._activeDirections.add(dir)
      this.input.setDirection(dir, 1)
    }
    if (action === 'interact') {
      this.input.setInteract(1)
    }

    if (action === 'switch') {
      this.input.setSwitchCharacter(1)
    }
  }

  _onTouchEnd(e) {
    const touchTarget = e.target
    const btn = touchTarget && touchTarget.closest ? touchTarget.closest('button') : null
    if (btn && this.touchRoot.contains(btn)) {
      e.preventDefault()
      const dir = btn.dataset.dir
      const action = btn.dataset.action
      if (dir) {
        this._activeDirections.delete(dir)
        this.input.setDirection(dir, 0)
      }
      if (action === 'interact') {
        this.input.setInteract(0)
      }

      if (action === 'switch') {
        this.input.setSwitchCharacter(0)
      }
      return
    }

    this._releaseAll()
  }

  _onTouchCancel() {
    this._releaseAll()
  }

  _onPointerUp(e) {
    if (!this.touchRoot) return

    // If pointerup happened on a button, release only that.
    const btn = e.target && e.target.closest ? e.target.closest('button') : null
    if (btn && this.touchRoot.contains(btn)) {
      e.preventDefault()
      const dir = btn.dataset.dir
      const action = btn.dataset.action

      if (dir) {
        this._activeDirections.delete(dir)
        this.input.setDirection(dir, 0)
      }
      if (action === 'interact') {
        this.input.setInteract(0)
      }

      if (action === 'switch') {
        this.input.setSwitchCharacter(0)
      }
      return
    }

    // Otherwise, release all (e.g., finger lifted off-screen).
    this._releaseAll()
  }

  _onPointerCancelOrLeave() {
    this._releaseAll()
  }

  _releaseAll() {
    for (const dir of this._activeDirections) {
      this.input.setDirection(dir, 0)
    }
    this._activeDirections.clear()
    this.input.setInteract(0)
    this.input.setSwitchCharacter(0)
  }
}
