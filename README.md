# ind-serv

A game you can't win, simulating indentured servitude.

You owe the kiln owner $1,000. Shovel mud, mold bricks, bake them, ship them — each
brick pays down the debt. Your wife and son arrive to help. Then the fees start:
lodging, fuel, hospital bills when the kiln maims your family, and charges that
escalate faster than you can ever earn. There is no win state. When the debt
crosses $2,000, an **Accept your fate** button appears; it ends the game on a page
about real-world debt bondage — the most common form of modern slavery, endemic in
South Asia's brick kilns — and where to learn more and help.

The narrative is driven by `src/data/event.json` (milestone-triggered events keyed
to bricks shipped) and `src/data/npc.json` (dialog ladders keyed to the same
milestones). Design doc: `docs/superpowers/specs/2026-07-13-narrative-arc-design.md`.

---

Created using Javascript, Canvas API, Konva

## Usage analytics

Gameplay events go to PostHog (free tier) via `src/js/lib/analytics.js` — no
backend of our own. The public write-only project API key lives in
`ANALYTICS.POSTHOG_KEY` in `src/js/constants.js` (US cloud); clearing it turns
tracking into a no-op. Events captured: `page_loaded`, `game_started`,
`story_event` / `story_event_skipped`, `recruited`, `fate_available`, `gave_up`
(with final stats), `resource_link_clicked`, `video_engaged`, `share_clicked`,
`info_opened` / `info_closed`, `profile_link_clicked`, `contact_submitted`, and
`left` (pagehide beacon with progress state).

The in-game info modal has a contact form via Formspree; set
`CONTACT.FORMSPREE_ID` in `src/js/constants.js` to enable it (hidden otherwise).

## Sound

All effects are synthesized at play time by a vendored [ZzFX](https://github.com/KilledByAPixel/ZzFX)
(`src/js/lib/zzfx.js`) — no audio files. Params live in `src/js/lib/sfx.js`
(distinct sound per production step, debt-spin ticker, Peanuts-style dialogue
mumble, recruit chime, fate sting). Audio unlocks on the Start click per
browser autoplay policy; a mute toggle lives in the info modal (persisted).
In dev, tune live via `window.sfx.play('dig')` etc.

## Credits

- Character sprites: [MiniFolks – Villagers](https://lyaseek.itch.io/minifvillagers) by LYASeeK
- Map tiles: [Desert Map Tileset 16x16](https://beyonderboy.itch.io/desert-map-tileset-16x16) by BeyonderBoy
- Fonts: [04b03](https://www.dafont.com/04b-03.font) by Yuji Oshimoto and
  [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38

## Develop

- `npm start` — dev server
- `npm run build` — production build
- Deploys are automatic: every push to `main` builds and publishes to gh-pages
  via GitHub Actions (`.github/workflows/deploy.yml`). `npm run deploy` remains
  as a manual fallback.
