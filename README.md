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

## Develop

- `npm start` — dev server
- `npm run build` — production build
- `npm run deploy` — publish `dist/` to gh-pages
