# Design: Flip 7 With a Vengeance Mode

**Date:** 2026-04-22  
**Status:** Approved

---

## Overview

Add a persistent toggle to the Card Calculator that switches between the base Flip 7 card set and the "With a Vengeance" card set. The two sets are mutually exclusive — in Vengeance mode the positive modifiers, ×2 multiplier, and 0–12 number cards are replaced entirely.

---

## Card Sets

| | Base game | Vengeance |
|---|---|---|
| Number cards | 0–12 (one of each) | 0–13 (13 selectable twice) |
| Modifier cards | +2, +4, +6, +8, +10 | -2, -4, -6, -8, -10 |
| Multiplier | ×2 (doubles number sum) | ÷2 (halves number sum, floor) |
| Flip 7 bonus | +15 for 7 different number cards | same |

---

## 1. Mode Storage (`game.svelte.ts`)

A new `vengeanceMode` reactive object follows the same pattern as `flip7Banner`. It is stored in a separate localStorage key (`flip7_vengeance`) so it survives `newGame()` and `playAgain()` — it is a preference, not game state.

```ts
function loadVengeanceMode(): boolean {
  if (!browser) return false;
  try {
    const raw = localStorage.getItem('flip7_vengeance');
    return raw ? (JSON.parse(raw) as boolean) : false;
  } catch { return false; }
}

export const vengeanceMode = $state({ active: loadVengeanceMode() });

export function setVengeanceMode(val: boolean): void {
  vengeanceMode.active = val;
  if (browser) localStorage.setItem('flip7_vengeance', JSON.stringify(val));
}
```

`vengeanceMode.active` is initialised at module load time via `loadVengeanceMode()`, mirroring the `loadInitialState` pattern already used for game state.

---

## 2. `calcCardTotal` Signature (`gameLogic.ts`)

Replace `x2: boolean` with `multiplier: 'x2' | 'div2' | null`. Negative modifiers already work since mod sum is a plain `reduce`.

```ts
export function calcCardTotal(
  numbers: number[],
  modifiers: number[],
  multiplier: 'x2' | 'div2' | null
): number {
  const numSum = numbers.reduce((a, b) => a + b, 0);
  const modSum = modifiers.reduce((a, b) => a + b, 0);
  let result = numSum;
  if (multiplier === 'x2') result *= 2;
  else if (multiplier === 'div2') result = Math.floor(result / 2);
  return result + modSum;
}
```

All existing callers pass `x2Selected ? 'x2' : null` in base mode; Vengeance mode passes `div2Selected ? 'div2' : null`.

---

## 3. CardCalculator (`CardCalculator.svelte`)

### Mode toggle

A pill toggle in the calculator header ("Base | Vengeance") calls `setVengeanceMode`. Switching modes resets all current selections (numbers, modifiers, multiplier) because the card sets are incompatible.

### Card sets

Derived from `vengeanceMode.active`:

- `NUMBER_CARDS`: `[0..12]` (base) or `[0..13]` (vengeance)
- `MODIFIER_CARDS`: `[2,4,6,8,10]` (base) or `[-2,-4,-6,-8,-10]` (vengeance)
- Multiplier button label: `×2` (base) or `÷2` (vengeance)
- Modifier display prefix: `+` (base) or empty/`-` (vengeance, since values are already negative)

### Lucky 13 — three-state button

The 13 button cycles 0 → 1 → 2 → 0. Internally `selectedNumbers` may contain two 13s (e.g. `[3, 7, 13, 13]`). Visual states:

- 0: gray, label `13`
- 1: amber, label `13`
- 2: amber with a small `×2` badge, label `13`

`toggleNumber` for 13 in Vengeance mode: counts existing 13s in `selectedNumbers`; if `< 2` appends one, if `=== 2` removes both.

All other number cards remain boolean toggles (unchanged).

### Flip 7 detection

Change `selectedNumbers.length === FLIP_7_CARD_COUNT` to `new Set(selectedNumbers).size === FLIP_7_CARD_COUNT`. Two 13s count as one unique card, so a hand of `[0,1,2,3,4,5,13,13]` (8 items, 7 unique) correctly triggers Flip 7.

### Negative total display

The calculator displays negative totals freely in the breakdown and total. The Apply button passes the raw total to `onApply`; flooring to 0 happens in `ScoreInput`.

---

## 4. ScoreInput (`ScoreInput.svelte`)

Import `vengeanceMode` and floor the applied total when active:

```ts
onApply={(total, isFlip7) => {
  const saved = vengeanceMode.active ? Math.max(0, total) : total;
  inputValue = String(saved);
  calculatorOpen = false;
  if (isFlip7) {
    pendingFlip7Score = saved;
    showFlip7Confirm = true;
  } else {
    commitSave(saved);
  }
}}
```

The manual input path (`min="0"`, `parsed < 0` guard in `handleSave`) is unchanged.

---

## 5. Tests (`gameLogic.test.ts`)

- `calcCardTotal` with `'div2'` multiplier: odd number sum floors correctly
- `calcCardTotal` with negative modifiers: total goes below zero
- Existing `x2` tests updated for the new `'x2'` string literal
- Flip 7 detection: `new Set(selectedNumbers).size` logic (covered by existing CardCalculator behaviour, no pure function to test directly)

---

## Out of Scope

- Action cards (Freeze, Flip Three, Swap, Steal, Second Chance, Just One More) — these affect turn order and player targeting, not score calculation
- Cumulative negative scores — per official rules, round score floors at 0 before being recorded
- Winning condition change — still 200+ cumulative points
