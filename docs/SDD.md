# Software Design Document — Flip 7 Scorecard

**Date:** 2026-03-14
**Stack:** SvelteKit 2 · Svelte 5 · TypeScript · Tailwind CSS v4 · Vite

---

## 1. Architecture Overview

The app uses a **runes store + component decomposition** pattern, idiomatic for Svelte 5.

All game logic and state lives in a single module (`game.svelte.ts`) using Svelte 5 `$state` runes — a reactive primitive that automatically updates every component reading it when the value changes. Components import state and actions directly; there is no prop drilling or traditional event bus.

`localStorage` persistence is handled entirely inside `game.svelte.ts`, invisible to components.

```
src/
├── lib/
│   ├── game.svelte.ts            ← reactive state + game logic + localStorage
│   └── components/
│       ├── PlayerRow.svelte      ← one player: name, history, total, tap to expand
│       ├── ScoreInput.svelte     ← inline score entry (number input, Bust, Save)
│       └── CardCalculator.svelte ← (post-MVP) modal card calculator
└── routes/
    └── +page.svelte              ← app shell: header, player list, footer controls
```

---

## 2. Data Model

```ts
type Player = {
  id: string    // UUID — stable across renames
  name: string
}

type GameState = {
  players: Player[]

  // scores[playerId][roundIndex] = entered score, or null (not yet entered)
  // Players who join mid-game have no entries for earlier rounds.
  scores: Record<string, (number | null)[]>

  currentRound: number  // 0-indexed
}
```

### Mid-game player changes

| Event | Behaviour |
|-------|-----------|
| Player added mid-game | `scores[newId]` initialised to `[]`; earlier rounds show `--`; cumulative starts at 0 |
| Player removed mid-game | Removed from `players` and `scores`; all history discarded; current-round score dropped |

### Derived values (computed, not stored)

| Helper | Description |
|--------|-------------|
| `totalScore(playerId)` | Sum of all non-null scores across all rounds |
| `roundScore(playerId, round)` | Score for a specific round; `null` = not entered / player not in game yet |
| `getWinners()` | Returns `Player[]` with the highest `totalScore` if any player has reached 200+, else `null` |

---

## 3. `game.svelte.ts` — Public API

```ts
// Reactive state — import and read directly in components
export const game: GameState

// Mutations
export function addPlayer(name: string): void
export function removePlayer(id: string): void
export function renamePlayer(id: string, name: string): void
export function setScore(playerId: string, score: number): void  // bust = setScore(id, 0)
export function endRound(): void    // increments round, checks for winners, saves to localStorage
export function newGame(): void     // resets state, clears localStorage

// Derived helpers
export function totalScore(playerId: string): number
export function getWinners(): Player[] | null
```

Every mutation calls `persist()` internally, which writes `JSON.stringify(game)` to `localStorage['flip7_game']`.

---

## 4. Component Responsibilities

### `+page.svelte`
- Renders the page header (title + New Game button)
- Iterates `game.players` and renders one `<PlayerRow>` per player
- Renders "Add Player" input/button (hidden at 12 players)
- Renders "End Round" button (disabled if 0 players or no scores entered this round)
- Renders winner banner overlay when `getWinners()` is non-null
- Manages `expandedPlayerId` local state — which player row is open

### `PlayerRow.svelte`
Props: `player: Player`, `isExpanded: boolean`, `onExpand: () => void`

- Displays player name, all previous round totals (strikethrough, muted), cumulative total
- Tapping the row calls `onExpand()` to toggle expand state (managed in parent)
- When `isExpanded`, renders `<ScoreInput>` inline beneath the row header
- Long-press or edit icon reveals Rename / Remove actions

### `ScoreInput.svelte`
Props: `player: Player`, `currentRoundScore: number | null`

- Number input (type="number", inputmode="numeric") pre-filled with `currentRoundScore` if set
- **Bust** button calls `setScore(player.id, 0)`
- **Save / ✓** button calls `setScore(player.id, parsedValue)`

---

## 5. UI Layout

### Main screen (mobile, ~390px wide)

```
┌──────────────────────────┐
│ Flip 7        [New Game] │  header
├──────────────────────────┤
│ Alice  2̶3̶  4̶7̶  6̶2̶   89  │  collapsed row
│ Bob    0̶   1̶8̶  3̶1̶   44  │
│ Carol  3̶1̶  6̶2̶  --       │  -- = no score this round
│ ▾ Dave  5̶   2̶0̶          │  expanded row
│ ┌──────────────────────┐ │
│ │ [ 15 ] [Bust]  [✓]  │ │  score input
│ └──────────────────────┘ │
├──────────────────────────┤
│ [+ Add Player]           │
│ [End Round]              │  footer
└──────────────────────────┘
```

### Score display rules

- **Previous round totals**: `text-sm`, muted colour, `line-through`
- **Cumulative total**: `text-lg font-bold`, high-contrast colour
- **Pending `--`**: muted, no strikethrough, indicates score not yet entered this round

### Winner banner

Rendered as a full-screen overlay after `endRound()` detects winners:

```
┌──────────────────────────┐
│                          │
│   🎉 Alice wins!         │
│      214 points          │
│                          │
│       [New Game]         │
│                          │
└──────────────────────────┘
```

Ties: "Alice & Bob win with 214 points!"

---

## 6. State Machine

```
[App Load]
    ├─ valid localStorage → restore GameState
    └─ otherwise → GameState { players: [], scores: {}, currentRound: 0 }
         ↓
[Active Game]
    ├─ addPlayer / removePlayer / renamePlayer  (any time)
    ├─ setScore(playerId, score)                (editable until endRound)
    ├─ endRound()  [guard: ≥1 player, ≥1 score entered]
    │       → currentRound++
    │       → persist()
    │       → getWinners() !== null?
    │             yes → [Winner Screen]
    │             no  → [Active Game]
    └─ newGame() [confirm] → reset + clear localStorage → [Active Game]

[Winner Screen]
    └─ newGame() → [Active Game]
```

---

## 7. Persistence

| Event | Action |
|-------|--------|
| Any state mutation | `localStorage.setItem('flip7_game', JSON.stringify(game))` |
| App init | Parse `localStorage['flip7_game']`; validate required keys; fall back to empty state on failure |
| `newGame()` | `localStorage.removeItem('flip7_game')` |

Validation checks for the presence of `players`, `scores`, and `currentRound` keys. No schema migration is required for MVP — invalid/old data is silently discarded and replaced with a fresh game.

---

## 8. Technology Notes

| Concern | Decision |
|---------|----------|
| Reactivity | Svelte 5 `$state` runes — reactive by default, no store boilerplate |
| Derived values | Plain functions (not `$derived`) since they take arguments |
| Styling | Tailwind CSS v4 utility classes — no custom CSS files |
| IDs | `crypto.randomUUID()` for player IDs |
| Build / dev | Vite via SvelteKit |
| Deployment | Any static host (Netlify, Vercel, GitHub Pages) via `adapter-static` |

---

## 9. Post-MVP: Card Calculator

A `CardCalculator.svelte` modal, opened from the score entry row. Contains tappable buttons for:
- Number cards: 0–12
- Modifier cards: +2, +4, +6, +8, +10
- X2 multiplier

Calculates `(sum of selected number cards) × (2 if X2 selected, else 1) + (sum of flat modifiers)` and offers an "Apply" button that sets the score input to that value. Does not affect game state directly.
