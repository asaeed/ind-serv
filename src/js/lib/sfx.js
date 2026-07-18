import { zzfx, zzfxX } from './zzfx'

// All sounds are synthesized at play time by ZzFX - no audio files.
// ponytail: params are ears-tuned guesses; tweak live via window.sfx.play('name') in the dev console.
const SOUNDS = {
  dig: [0.4, 0.1, 80, 0.005, 0.03, 0.13, 4, 1.8, -6, 0, 0, 0, 0, 0.4], // shovel: earthy thud
  mold: [0.35, 0.05, 330, 0.002, 0.03, 0.06, 1, 2.5, -8], // brick press: clack (higher pitch)
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

  // a warm major chord that fades out — played once when the game starts
  chord() {
    if (muted) return
    // zzfx(vol, rand, freq, attack, sustain, release[long=fade], shape[1=triangle], shapeCurve, ...)
    for (const freq of [261.63, 329.63, 392.0, 523.25]) {
      zzfx(0.16, 0.02, freq, 0.04, 0.18, 0.7, 1, 1.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.1)
    }
  },

  // rising tick while the debt counter spins; throttled so the 60fps HUD loop can call it freely
  _lastTick: 0,
  spinTick(progress) {
    const now = performance.now()
    if (muted || now - this._lastTick < 70) return
    this._lastTick = now
    zzfx(0.1, 0, 500 + 700 * Math.min(1, Math.max(0, progress)), 0.001, 0.008, 0.03, 1, 1.2)
  },

  // Peanuts-teacher mumble for characters talking (never narration):
  // soft triangle-wave syllables with a speech-like prosody walk,
  // trailing downward on the last syllable like the end of a sentence
  _mumbleTimer: null,
  _mumbleFreq: 180,
  mumble(text) {
    if (muted) return
    clearTimeout(this._mumbleTimer)
    const syllables = Math.max(2, Math.min(8, Math.round((text || '').length / 16)))
    this._mumbleFreq = 220 + Math.random() * 30
    const speak = (i) => {
      if (i >= syllables || muted) return
      this._mumbleFreq = Math.max(180, Math.min(300, this._mumbleFreq + (Math.random() - 0.5) * 50))
      const last = i === syllables - 1
      const freq = last ? this._mumbleFreq * 0.82 : this._mumbleFreq
      const dur = 0.06 + Math.random() * 0.05 + (last ? 0.05 : 0)
      zzfx(0.08, 0.02, freq, 0.02, dur, 0.09, 1, 1.05, -1.5, 0, 0, 0, 0, 0, 3.5, 0, 0, 0.6, 0.03)
      this._mumbleTimer = setTimeout(() => speak(i + 1), 120 + Math.random() * 90)
    }
    speak(0)
  },
}

export default sfx
