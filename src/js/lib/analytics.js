import { ANALYTICS } from '../constants'

// anonymous per-browser player id
const distinctId = (() => {
  try {
    let id = localStorage.getItem('ind-serv-player-id')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('ind-serv-player-id', id)
    }
    return id
  } catch (e) {
    return 'anon-' + Math.random().toString(36).slice(2) // e.g. private browsing
  }
})()

// Fire-and-forget usage event to PostHog's capture endpoint.
// No-op until POSTHOG_KEY is set in constants.js; must never break the game.
export default function track(event, properties = {}) {
  if (!ANALYTICS.POSTHOG_KEY) return
  fetch(`${ANALYTICS.POSTHOG_HOST}/i/v0/e/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: ANALYTICS.POSTHOG_KEY, event, distinct_id: distinctId, properties }),
    keepalive: true,
  }).catch(() => {})
}
