import { zzfx, zzfxX } from './zzfx'

// All sounds are synthesized at play time by ZzFX - no audio files.
// ponytail: params are ears-tuned guesses; tweak live via window.sfx.play('name') in the dev console.
const SOUNDS = {
  dig: [0.4, 0.1, 80, 0.005, 0.03, 0.13, 4, 1.8, -6, 0, 0, 0, 0, 0.4], // shovel: earthy thud
  mold: [0.35, 0.05, 220, 0.002, 0.03, 0.06, 1, 2.5, -8], // brick press: clack
  kiln: [0.3, 0.1, 50, 0.01, 0.15, 0.35, 4, 2, 0, 0, 0, 0, 0, 0.8, 0, 0.2], // fire: low whoosh
  ship: [0.35, 0.05, 1046, 0.001, 0.06, 0.2, 0, 1.4, 0, 0, 262, 0.06], // truck load: coin blip
  recruit: [0.3, 0.05, 523, 0.005, 0.08, 0.2, 0, 1.6, 0, 0, 131, 0.08], // family joins: rising chime
  fate: [0.5, 0.05, 130, 0.02, 0.25, 0.5, 2, 1.2, -1, -0.5], // the button appears: somber slide down
}

const MUTE_KEY = 'ind-serv-muted'
let muted = false
try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch (e) {
  // private browsing etc. - default to sound on
}

const sfx = {
  // browsers allow audio only after a user gesture; the Start click is ours
  unlock() {
    if (zzfxX.state === 'suspended') zzfxX.resume()
  },

  isMuted() {
    return muted
  },

  toggleMute() {
    muted = !muted
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch (e) {}
    return muted
  },

  play(name) {
    if (!muted && SOUNDS[name]) zzfx(...SOUNDS[name])
  },

  // rising tick while the debt counter spins; throttled so the 60fps HUD loop can call it freely
  _lastTick: 0,
  spinTick(progress) {
    const now = performance.now()
    if (muted || now - this._lastTick < 70) return
    this._lastTick = now
    zzfx(0.1, 0, 500 + 700 * Math.min(1, Math.max(0, progress)), 0.001, 0.008, 0.03, 1, 1.2)
  },

  // Peanuts-teacher mumble: a short run of warbly syllables, one per ~14 chars of dialogue
  _mumbleTimer: null,
  mumble(text) {
    if (muted) return
    clearTimeout(this._mumbleTimer)
    const syllables = Math.max(2, Math.min(9, Math.round((text || '').length / 14)))
    const speak = (i) => {
      if (i >= syllables || muted) return
      const freq = 150 + Math.random() * 90 + (i % 3) * 15
      zzfx(0.15, 0.1, freq, 0.01, 0.06 + Math.random() * 0.05, 0.05, 2, 1.3, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0.8, 0.01, 0.4)
      this._mumbleTimer = setTimeout(() => speak(i + 1), 90 + Math.random() * 70)
    }
    speak(0)
  },
}

export default sfx
