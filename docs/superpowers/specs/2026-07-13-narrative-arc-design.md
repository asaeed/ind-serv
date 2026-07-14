# Narrative Arc & Ending — Design

Branch: `narrative-arc` · Date: 2026-07-13

## Intent

Turn the current open-ended brick-making sandbox into a short, guided experience
(~10–15 min): hopeful at first, then visibly rigged, ending in hopelessness. The
player can never pay off the debt. When debt crosses a threshold, an
**"Accept your fate"** button appears; clicking it ends the game on a page about
real-world debt bondage and how to help.

Narration style is middle-ground: scripted events announce themselves in the
existing TextPanel; when dismissed, the debt counter visibly spins up
(fast, then decelerating — wheel-of-fortune feel).

## Cast

| Character | Sprite | Role |
|---|---|---|
| player | MiniVillagerMan | you |
| kilnOwner | MiniNobleMan | falsely warm creditor; mouthpiece for fees ("it's all in the ledger") |
| ownersWife | MiniNobleWoman | entitled, oblivious to the harm ("my husband gives these people purpose") |
| worker | MiniWorker | clue-giver: explains the production chain, auto-work hint |
| oldMan | MiniOldMan | clue-giver: bricks → money → debt ("I've been counting mine for thirty years") |
| oldWoman | MiniOldWoman | clue-giver: switching/recruiting hint; foreshadowing |
| wife | MiniVillagerWoman | player's wife — recruitable, appears after 20 bricks |
| son | MiniPeasant | player's son — recruitable, appears after 20 bricks |

Removed from `npc.json`: queen, princess, nobleWoman-as-decoration (sprite is
reused for ownersWife). Recruits join to help pay **your** debt — no debt
merging. Dialog ladders (existing `minBricks` mechanism) darken as the story
progresses; clue-givers' early lines teach the player what to do.

## Narrative script

Opening (TextPanel on game start):
> "You borrowed $1,000 for your father's funeral. The kiln owner was glad to help."

Events keyed to `numBricksShipped` (all copy/values tunable in `events.json`):

| Trigger | Event | Debt | Other effects |
|---|---|---|---|
| 0 (on Start) | Opening card — the funeral loan | +1,000 | debt starts at $0 and spins up on dismiss |
| 7 | Lodging fee — "You didn't think the roof was free?" | +150 | |
| 13 | "Your wife and son arrive at the kiln gates." | — | wife + son NPCs appear |
| 16 | "The market is down." | — | brick price $10 → $7 |
| 19 | Shovel breaks — replacement charged to the ledger | +75 | |
| 23 | Kiln fuel charge | +120 | |
| 26 | "The market is down again." | — | brick price $7 → $5 |
| 29 * | Wife burned at the kiln — hospital bill | +200 | wife speed ×0.5 permanently |
| 36 | Ledger "recalculation" — interest and fees | +250 | |
| 42 * | Son loses a hand to the mold — hospital bill | +400 | son speed ×0.5 permanently |
| 46, then every 7 | Recurring charges (food, lodging, "upkeep") | +150, +200, +250, … (+50 each) | guarantees debt growth |

(Triggers compressed ~×0.65 on 2026-07-13 after a playtest read ~20 min to the
give-up point; target is ~12–14 min. NPC `minBricks` ladders are synced to the
same beats.)

\* Injury events additionally require that character to have been recruited;
if the player never recruits, injuries are skipped and the recurring charges
still make the game unwinnable.

**Balance goal:** late-game max earnings are $5/brick while recurring charges
escalate without bound, so past ~46 bricks the debt slope is strictly positive
no matter how the player plays. The $2,000 threshold should land around brick
46–50. Exact values are playtest-tuned.

## Mechanics

### Event system (new)
- `src/data/event.json` (singular, matching `item.json`/`npc.json`) — list of
  `{ id, trigger: { bricksShipped, requiresRecruit? }, debtDelta?, brickPrice?, injures?, text, repeat? }`.
  Family appearance is not an event effect: NpcController reveals NPCs with
  `appearAtBricks` on its own; the 20-brick event is pure narration.
- `checkEvents()` in `gameStore`, called after each shipped-brick increment.
  Fires at most one event per ship; marks one-shots as done.
- **Start screen**: a full-screen overlay with a Start Game button; the game
  boots frozen behind it (`gameStarted` gates the update loop). Clicking Start
  fades the overlay and fires the opening event — that's when the "You
  borrowed $1,000" card appears.
- Firing an event opens the TextPanel with its text and holds `debtDelta` as
  `pendingDebtDelta`. **On panel dismiss**, the delta is applied to `debt` —
  that's what the HUD animates.
- **Production pauses while an event banner is up** (`eventPanelOpen`):
  in-flight actions finish, no new actions start, and no second banner can
  fire. Dismissal applies the debt, resumes paused auto-production chains, and
  shows any milestone crossed in the meantime. One banner at a time.
- The hardcoded truck economy block in `interactWith` (`gameStore.js:164`) is
  replaced by this system; `brickPrice` becomes store state (starts at 10).
- Win state removed: no `hasWon`, no "YOU WON" text. `Math.max(0, …)` floor
  stays as a safety guard only.

### Debt spin (HUD)
- HUD keeps `displayDebt` easing toward actual debt each frame
  (`displayDebt += (debt − displayDebt) × 0.08`, snap when < $1). Exponential
  ease-out reads as fast-spin-then-settle. Red flash/particles on event hits.
- Routine per-brick −$10 payments apply immediately (small ticks); the spin is
  reserved for event deltas, which land on panel dismiss.

### Family appearance (20 bricks)
- New `appearAtBricks` field in `npc.json`. NpcController creates these sprites
  hidden (excluded from proximity + vacancy while hidden) and reveals them when
  the threshold is met, alongside the arrival event text.
- Recruiting: talking to a recruitable NPC recruits them on the spot (their
  dialog gains a "has joined you" notice + switch hint). Tab/B then switches
  between party members at any time — no proximity or open-panel requirement.

### Injuries (permanent half speed)
- Per-character `workSpeedMultiplier` in `playerStore` (default 1).
- Injury events set the target character's multiplier to 0.5 — permanent for
  both the burn and the hand.
- Effective action duration in `interactWith` = `action.duration / multiplier`
  for the acting character (applies to manual and auto-production).

### Accept your fate (ending)
- When settled debt ≥ **$2,000**, a persistent HTML overlay button appears:
  **"Accept your fate."** The game keeps running if ignored — the treadmill is
  clickable forever; realizing the button is the only move left is the point.
- On click: fade the canvas (CSS), then a full-screen HTML end page:
  1. Epilogue: *"The debt outlives you. It passes to your children."*
  2. Stats as indictment: bricks made, debt paid ($X), debt added by the owner
     ($Y), time worked in years (1 real minute = 1 year; the HUD shows a live
     "YEARS WORKED" counter during play, clock starts at the Start click).
  3. Educational pivot: this is debt bondage (bonded labor), the most common
     form of modern slavery; brick kilns are its emblematic setting. Links:
     Anti-Slavery International, ILO forced-labour programme, Walk Free /
     Global Slavery Index, GoodWeave International.
- HTML overlay (not canvas) because the page needs real links. Org URLs
  (verified live 2026-07-13): antislavery.org/slavery-today/bonded-labour,
  freedomfund.org, walkfree.org/global-slavery-index, goodweave.org,
  ilo.org/topics-and-sectors/forced-labour-modern-slavery-and-trafficking-persons.
- Track for stats: total earned, total event debt added, start timestamp.

## Files touched

- `src/data/event.json` (new), `src/data/npc.json` (cast rewrite)
- `src/js/state/gameStore.js` (event engine, brickPrice, pendingDebtDelta, stats, win-state removal)
- `src/js/state/playerStore.js` (workSpeedMultiplier)
- `src/js/ui/Hud.js` (debt spin), `src/js/controllers/NpcController.js` (appearAtBricks)
- `src/index.html` + `src/css/index.scss` (give-up button, end page)
- `README.md` (describe the arc + ending)

## Tunables (single place, `events.json` / constants)

- Starting debt $1,000 (applied as the opening event's debtDelta; the counter
  starts at $0 and spins up) · brick price 10 → 7 → 5 · give-up threshold $2,000
- Event triggers/deltas per table above · recurring charge base +150, step +50
- Injury multiplier 0.5 (both permanent)
