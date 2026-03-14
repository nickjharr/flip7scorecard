# Flip 7 Scorecard — Design Spec

**Date:** 2026-03-14
**Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS v4
**Scope:** MVP (card calculator deferred to post-MVP)

---

## 1. Product Overview

A mobile-first, single-page web scorecard for the card game **Flip 7**. Runs entirely in the browser with no backend — state is persisted in `localStorage`. One game tracked at a time. Supports up to 12 players.

### Flip 7 Scoring Rules (reference)

- Each player's round score = sum of number cards × (X2 if held) + flat modifiers (+2/+4/+6/+8/+10) + optional +15 Flip 7 bonus
- A player who **busts** scores **0** for the round
- Game ends when at least one player reaches **200+ cumulative points**; highest score wins

---

## 2. Requirements

### Functional (MVP)

| # | Requirement |
|---|-------------|
| F1 | Track 1–12 players |
| F2 | Add and remove players at any time during the game |
| F3 | Enter a score per player per round (no enforced turn order) |
| F4 | "Bust" shortcut sets a player's round score to 0; treated identically to a manually entered 0 and editable until End Round |
| F5 | Display cumulative score prominently per player |
| F6 | Display all previous round totals with strikethrough, low prominence |
| F7 | Current-round scores are editable (including bust scores) until "End Round" is confirmed |
| F8 | Explicit "End Round" button advances to the next round; enabled when at least one player has a score entered and there is at least one player in the game |
| F9 | Detect when any player reaches 200+ after End Round; display winner banner |
| F10 | "New Game" resets all state (with confirmation prompt) |
| F11 | Game state persisted to `localStorage`; survives page refresh |

### Non-Functional

- Mobile-first (primary target: phone passed around a table)
- Static content only — no server, no backend
- Single page (no routing)

### Post-MVP

- Card calculator modal: tap card buttons to build a hand; total calculated automatically; accessible from the score entry expand

---

## 3. Data Model

```ts
type Player = {
  id: string        // UUID, stable across renames
  name: string
}

type GameState = {
  players: Player[]
  // scores[playerId][roundIndex] = score entered, or null if not yet entered this round
  // A player who joins mid-game has no entries for earlier rounds (treated as if they weren't playing)
  scores: Record<string, (number | null)[]>
  currentRound: number  // 0-indexed
}
```

**Derived values** (not stored, computed on the fly):

- `totalScore(playerId)` — sum of all non-null scores for a player across all rounds
- `roundScore(playerId, round)` — score for a specific round (null = not entered / player not yet in game)

**Mid-game player changes:**

- **Adding a player** mid-game: their `scores` entry starts empty (`[]`). Earlier rounds show `--` in history. Their cumulative total starts at 0. No backfill.
- **Removing a player** mid-game: their entry is deleted from both `players` and `scores`. All historical data for that player is discarded. If they had already entered a score for the current round, it is dropped.

**localStorage key:** `flip7_game`
Serialised as JSON on every state mutation; deserialised on app load.

---

## 4. Architecture

### Approach: Runes Store + Component Decomposition

Game state lives in a single reactive module (`game.svelte.ts`) using Svelte 5 `$state` runes. Components import state and actions directly — no prop drilling, no traditional Svelte stores needed.

```
src/
├── lib/
│   ├── game.svelte.ts            ← reactive state + all game logic + localStorage
│   └── components/
│       ├── PlayerRow.svelte      ← player row: name, history, total, tap to expand
│       ├── ScoreInput.svelte     ← inline score entry (number input, bust, save)
│       └── CardCalculator.svelte ← (post-MVP) modal card calculator
└── routes/
    └── +page.svelte              ← app shell, player list, header controls
```

### `game.svelte.ts` API

```ts
// State (reactive — read directly in components)
export const game: GameState

// Actions
export function addPlayer(name: string): void
export function removePlayer(id: string): void
export function renamePlayer(id: string, name: string): void
// Bust is a UI shortcut for setScore(id, 0) — no separate action needed
export function setScore(playerId: string, score: number): void
export function endRound(): void   // advances round, checks for winner
export function newGame(): void    // resets all state + clears localStorage

// Derived helpers
export function totalScore(playerId: string): number
// Returns the highest-scoring player(s) if any have reached 200+, else null
export function getWinners(): Player[] | null
```

---

## 5. UI / Screen Design

### Main Screen

```
┌─────────────────────────────┐
│  Flip 7          [New Game] │  ← header
├─────────────────────────────┤
│  Alice   23̶  4̶7̶  62̶   89   │  ← player row (collapsed)
│  Bob     0̶   1̶8̶  31̶   44   │
│  Carol   3̶1̶  6̶2̶  --        │  ← -- = no score this round yet
│  ...                        │
├─────────────────────────────┤
│  [+ Add Player]             │  ← hidden when player count = 12
│  [End Round]                │  ← disabled: 0 players, or no scores entered yet
└─────────────────────────────┘
```

- Score history: muted text, strikethrough
- Current cumulative total: bold, prominent
- Current round's pending score shown as `--`

### Player Row — Expanded (score entry)

```
┌─────────────────────────────┐
│  Carol ▾                89  │
│  ┌───────────────────────┐  │
│  │ [  ___  ] [Bust] [✓]  │  │  ← number input, Bust = setScore(0), ✓ confirms
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- Only one player expanded at a time; tapping another collapses current
- Numeric keyboard triggered on mobile
- Previously entered score (including bust = 0) pre-populated; fully editable until End Round

### Player Management

- Long-press (or a visible edit icon) on a player row reveals **Rename** and **Remove** options
- Removing a player requires a brief confirmation to prevent accidents

### Winner Banner

Shown after End Round detects any player at 200+. Winner = player(s) with the highest total score among all players (regardless of whether they crossed 200):

```
┌─────────────────────────────┐
│  🎉 Alice wins with 214!    │
│  [New Game]                 │
└─────────────────────────────┘
```

If two or more players share the highest score, all are named: "Alice & Bob win with 214!"

---

## 6. State Transitions

```
[App Load]
    │
    ├─ localStorage has valid GameState → restore
    └─ no / invalid localStorage → empty state (0 players, round 0)
         │
         ▼
[Active Game]
    │  addPlayer / removePlayer / renamePlayer (any time)
    │  setScore(playerId, score)  ← editable until endRound; bust = setScore(id, 0)
    │
    ├─ endRound()  [enabled: ≥1 player, ≥1 score entered this round]
    │       → currentRound++
    │       → check: any player totalScore ≥ 200?
    │           ├─ yes → [Winner Screen]
    │           └─ no  → back to [Active Game]
    │
    └─ newGame() (with confirm) → reset state, clear localStorage → [Active Game]

[Winner Screen]
    └─ newGame() → [Active Game]
```

---

## 7. Persistence

- On every state mutation, `JSON.stringify(game)` is written to `localStorage['flip7_game']`
- On app init, attempt `JSON.parse(localStorage['flip7_game'])` and validate shape (check for required keys); fall back to empty state if missing or malformed
- `newGame()` clears the `localStorage` entry

---

## 8. Out of Scope (MVP)

- Turn order enforcement
- Multiple simultaneous games
- Game history / statistics
- Undo/redo
- Card calculator (post-MVP)
- PWA / offline install
- Backend / sync
