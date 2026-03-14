# Card Calculator — Design Spec

**Jira:** SE-8
**Date:** 2026-03-14
**Status:** Approved

---

## Overview

A card calculator modal accessible from each player's score entry row (`ScoreInput`). Players tap pill-style buttons to toggle their hand of cards; the total is calculated automatically and applied to the score input. Keeps the main scoreboard uncluttered.

---

## User Flow

1. Player expands their score row — `ScoreInput` becomes visible.
2. Player taps the **🃏 Calc** button next to the score input field.
3. The **Card Calculator modal** slides up as a bottom sheet.
4. Player taps cards to toggle them on/off. The total updates live.
5. Player either:
   - Taps **Apply** → total is written to the score input field only (not persisted). Modal closes. Player still taps Save to commit. This is intentionally asymmetric with Bust — Apply is a shortcut to fill the input, not a commit action.
   - Taps **Bust** → `onBust()` fires. `ScoreInput`'s callback calls its own internal `handleBust()`, which sets `inputValue = '0'` and immediately calls `setScore(player.id, 0)` — the score is committed at this point, no Save required. Modal closes. The score row does not collapse (consistent with existing Bust behaviour in `ScoreInput`).

---

## Modal Design

### Layout

Bottom sheet modal with drag handle. Single-column layout:

```
┌─────────────────────────────────┐
│  ————                           │  ← drag handle
│  Card Calculator    [ Bust ]    │  ← title + Bust (top-right, small)
│  21                             │  ← running total (amber, large)
│  (7+4) × 2 + 0                  │  ← formula breakdown (muted, small)
│                                 │
│  NUMBER CARDS                   │
│  [0][1][2][3][4][5][6]          │  ← wrapping pill buttons
│  [7][8][9][10][11][12]          │
│                                 │
│  MODIFIER CARDS                 │
│  [+2][+4][+6][+8][+10]          │
│                                 │
│  [✕2]  doubles your number...   │
│                                 │
│  [        Apply 21            ] │  ← full-width amber button
└─────────────────────────────────┘
```

### Card Types & Interaction

| Type | Values | Behaviour |
|------|--------|-----------|
| Number cards | 0–12 (13 cards) | Toggle. Amber highlight when selected. |
| Modifier cards | +2, +4, +6, +8, +10 | Toggle. Amber highlight when selected. |
| X2 multiplier | ✕2 | Toggle. Purple highlight when selected. |

All cards are unique — no duplicates. A duplicate in real play = bust, so only one of each is offered.

### Dismissing without applying

There is no backdrop-tap-to-dismiss or drag-to-close in this iteration. The only close paths are Apply and Bust. The drag handle is decorative only.

### Formula

```
total = (sum of selected number cards) × (X2 ? 2 : 1) + (sum of selected modifier cards)
```

Formula breakdown string shown beneath the total in muted text.

**Rendering rules** — build the string from these parts:

```
const numSum = numbers.reduce((a, b) => a + b, 0);
const modSum = modifiers.reduce((a, b) => a + b, 0);

// Parentheses only when X2 is active AND there are multiple numbers (to show grouping)
const numberPart = numbers.length === 0 ? ''
  : (x2Selected && numbers.length > 1) ? `(${numbers.join('+')})`
  : `${numSum}`;

const multiplierPart = x2Selected && numbers.length > 0 ? ' × 2' : '';

// Leading ' + ' when there's a number part; bare '+' when modifiers are the only term
const modifierPart = modifiers.length === 0 ? ''
  : (numberPart || multiplierPart) ? ` + ${modSum}`
  : `+${modSum}`;

const breakdown = `${numberPart}${multiplierPart}${modifierPart}`;
// empty string when nothing is selected
```

Resulting display examples:

| Situation | Display |
|-----------|---------|
| Numbers + X2 + modifiers | `(3+7) × 2 + 4` |
| Single number + X2 + modifiers | `7 × 2 + 4` |
| Numbers + X2, no modifiers | `(3+7) × 2` |
| Numbers, no X2, modifiers | `10 + 4` |
| Numbers only | `10` |
| Modifiers only (no numbers, regardless of X2) | `+4` (X2 term omitted — no numbers to multiply) |
| X2 only, no numbers, no modifiers | _(empty string — total shows 0)_ |
| Nothing selected | _(empty string — total shows 0)_ |

### Buttons

- **Bust** — small, outlined red, top-right corner. Fires `onBust()`. `ScoreInput`'s callback calls its own `handleBust()` internally — `CardCalculator` has no direct knowledge of `setScore` or `player.id` (the closure in `ScoreInput` handles this).
- **Apply** — full-width amber, bottom. Always enabled. Fires `onApply(total)` which sets the score input field value in `ScoreInput` — even when total is 0. Does not call `setScore`. Player still presses Save to commit. Label includes the current total (e.g. "Apply 21", "Apply 0").

---

## Trigger Button

A small **🃏 Calc** button added to `ScoreInput` alongside the existing Bust and Save buttons. Tapping it sets `calculatorOpen = true`.

---

## Scoring Logic

Pure exported function added to `gameLogic.ts`. Import directly from `$lib/gameLogic` in `CardCalculator.svelte` — do not re-export via `game.svelte.ts`, which is reserved for reactive state and should not grow to include pure utilities.

```ts
export function calcCardTotal(
  numbers: number[],   // selected number card values
  modifiers: number[], // selected modifier card values
  x2: boolean
): number {
  const numSum = numbers.reduce((a, b) => a + b, 0);
  const modSum = modifiers.reduce((a, b) => a + b, 0);
  return numSum * (x2 ? 2 : 1) + modSum;
}
```

This is pure and independently testable.

---

## State

### Modal open/close — owned by `ScoreInput`

```ts
// ScoreInput.svelte
let calculatorOpen = $state(false);
```

`CardCalculator` is conditionally mounted: `{#if calculatorOpen}<CardCalculator .../>{/if}`. It uses fixed positioning to overlay the screen as a bottom sheet. No portal required.

### Calculator selections — owned by `CardCalculator`

Local to the modal component. Resets each time the modal mounts (i.e. each open). Use plain arrays for Svelte 5 reactivity — toggling reassigns the array so `$state` detects the change:

```ts
let selectedNumbers = $state<number[]>([]);
let selectedModifiers = $state<number[]>([]);
let x2Selected = $state(false);

function toggleNumber(n: number) {
  selectedNumbers = selectedNumbers.includes(n)
    ? selectedNumbers.filter(x => x !== n)
    : [...selectedNumbers, n];
}

function toggleModifier(m: number) {
  selectedModifiers = selectedModifiers.includes(m)
    ? selectedModifiers.filter(x => x !== m)
    : [...selectedModifiers, m];
}
```

---

## Component Structure

```
ScoreInput.svelte
  ├─ let calculatorOpen = $state(false)
  └─ {#if calculatorOpen}
       <CardCalculator
         onApply={(total) => { inputValue = String(total); calculatorOpen = false; }}
         onBust={() => { handleBust(); calculatorOpen = false; }}
       />
     {/if}
```

### `CardCalculator` props

```ts
interface Props {
  onApply: (total: number) => void;
  onBust: () => void;
}
```

`CardCalculator` receives no `playerId` and calls no game state functions directly. All side effects are delegated to the callbacks. The `player.id` closure lives in `ScoreInput`, which already has it in scope.

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/components/CardCalculator.svelte` | Calculator modal component |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/gameLogic.ts` | Add exported `calcCardTotal()` pure function |
| `src/lib/components/ScoreInput.svelte` | Add Calc trigger button; own `calculatorOpen` state; wire up `CardCalculator` |
| `src/lib/gameLogic.test.ts` | Add unit tests for `calcCardTotal()` (file already exists) |

---

## Tests

Unit tests for `calcCardTotal()` in `gameLogic.test.ts`:

- Returns 0 when nothing selected
- Sums number cards correctly
- Sums modifier cards correctly
- Applies X2 to number total only (not modifiers)
- X2 with no numbers selected returns only modifier sum
- Combined: numbers + X2 + modifiers

---

## Out of Scope

- Persisting calculator state between opens
- Undo/redo within the calculator
- Backdrop dismiss or drag-to-close (can be added later)
- Animations on the bottom sheet (can be added later)
- Accessibility (ARIA labels on pill buttons) — deferred; consistent with current codebase baseline
