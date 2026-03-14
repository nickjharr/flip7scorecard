# Card Calculator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bottom-sheet card calculator modal to each player's score entry row, letting players tap cards to build their hand and auto-calculate their round score.

**Architecture:** A new `CardCalculator.svelte` component is conditionally mounted inside `ScoreInput.svelte`. It owns its own selection state (arrays of toggled cards) and emits two callbacks: `onApply(total)` which fills the score input, and `onBust()` which delegates to `ScoreInput`'s existing `handleBust()`. The scoring formula lives as a pure exported function in `gameLogic.ts`.

**Tech Stack:** Svelte 5 (runes: `$state`, `$props`, `$derived`), TypeScript, Tailwind CSS v4, Vitest

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/lib/gameLogic.ts` | Modify | Add `export function calcCardTotal()` |
| `src/lib/gameLogic.test.ts` | Modify | Add `describe('calcCardTotal')` block |
| `src/lib/components/CardCalculator.svelte` | **Create** | New bottom-sheet calculator component |
| `src/lib/components/ScoreInput.svelte` | Modify | Add Calc button, `calculatorOpen` state, mount `CardCalculator` |

---

## Chunk 1: Pure Scoring Logic + Tests

### Task 1: Add `calcCardTotal` tests (red)

**Files:**
- Modify: `src/lib/gameLogic.test.ts`

- [ ] **Step 1: Add the failing test block**

Open `src/lib/gameLogic.test.ts` and append this block at the end of the file (after the `createEmptyGame` describe block):

```ts
describe('calcCardTotal', () => {
  it('returns 0 when nothing is selected', () => {
    expect(calcCardTotal([], [], false)).toBe(0);
  });

  it('sums number cards correctly', () => {
    expect(calcCardTotal([3, 7, 2], [], false)).toBe(12);
  });

  it('sums modifier cards correctly', () => {
    expect(calcCardTotal([], [4, 6], false)).toBe(10);
  });

  it('applies X2 to number total only, not modifiers', () => {
    expect(calcCardTotal([5], [4], true)).toBe(14); // (5 × 2) + 4
  });

  it('X2 with no number cards returns only modifier sum', () => {
    expect(calcCardTotal([], [8], true)).toBe(8); // (0 × 2) + 8 = 8
  });

  it('combines numbers, X2, and modifiers correctly', () => {
    expect(calcCardTotal([3, 7], [2, 4], true)).toBe(26); // (10 × 2) + 6
  });
});
```

Also update the import line at the top of the file from:
```ts
import { totalScore, getWinners, createEmptyGame } from './gameLogic';
```
to:
```ts
import { totalScore, getWinners, createEmptyGame, calcCardTotal } from './gameLogic';
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd C:/Users/judi_/Projects/flip7scorecard/flip7scorecard
npm test
```

Expected: 6 new failures — `calcCardTotal is not a function` or similar. All existing tests should still pass.

---

### Task 2: Implement `calcCardTotal` (green)

**Files:**
- Modify: `src/lib/gameLogic.ts`

- [ ] **Step 1: Add the function**

Append to the end of `src/lib/gameLogic.ts`:

```ts
/**
 * Calculates the score for a hand of Flip 7 cards.
 * X2 multiplier applies only to the number card total, not modifiers.
 */
export function calcCardTotal(
  numbers: number[],   // selected number card values (0–12)
  modifiers: number[], // selected modifier card values (+2/+4/+6/+8/+10)
  x2: boolean          // whether the X2 multiplier card is held
): number {
  const numSum = numbers.reduce((a, b) => a + b, 0);
  const modSum = modifiers.reduce((a, b) => a + b, 0);
  return numSum * (x2 ? 2 : 1) + modSum;
}
```

- [ ] **Step 2: Run tests to confirm all pass**

```bash
npm test
```

Expected: All tests pass including the 6 new `calcCardTotal` tests. Output should include:
```
✓ calcCardTotal > returns 0 when nothing is selected
✓ calcCardTotal > sums number cards correctly
...
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/gameLogic.ts src/lib/gameLogic.test.ts
git commit -m "feat(SE-8): add calcCardTotal pure function with tests"
```

---

## Chunk 2: CardCalculator Component + ScoreInput Integration

### Task 3: Create `CardCalculator.svelte`

**Files:**
- Create: `src/lib/components/CardCalculator.svelte`

- [ ] **Step 1: Create the component file**

Create `src/lib/components/CardCalculator.svelte` with the following content:

```svelte
<script lang="ts">
  import { calcCardTotal } from '$lib/gameLogic';

  let {
    onApply,
    onBust,
  }: {
    onApply: (total: number) => void;
    onBust: () => void;
  } = $props();

  // --- Selection state (resets each time modal mounts) ---
  let selectedNumbers = $state<number[]>([]);
  let selectedModifiers = $state<number[]>([]);
  let x2Selected = $state(false);

  const NUMBER_CARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MODIFIER_CARDS = [2, 4, 6, 8, 10];

  function toggleNumber(n: number) {
    selectedNumbers = selectedNumbers.includes(n)
      ? selectedNumbers.filter((x) => x !== n)
      : [...selectedNumbers, n];
  }

  function toggleModifier(m: number) {
    selectedModifiers = selectedModifiers.includes(m)
      ? selectedModifiers.filter((x) => x !== m)
      : [...selectedModifiers, m];
  }

  // --- Derived total ---
  let total = $derived(calcCardTotal(selectedNumbers, selectedModifiers, x2Selected));

  // --- Formula breakdown string ---
  let breakdown = $derived((() => {
    const numSum = selectedNumbers.reduce((a, b) => a + b, 0);
    const modSum = selectedModifiers.reduce((a, b) => a + b, 0);

    const numberPart =
      selectedNumbers.length === 0
        ? ''
        : x2Selected && selectedNumbers.length > 1
          ? `(${selectedNumbers.join('+')})`
          : `${numSum}`;

    const multiplierPart = x2Selected && selectedNumbers.length > 0 ? ' × 2' : '';

    const modifierPart =
      selectedModifiers.length === 0
        ? ''
        : numberPart || multiplierPart
          ? ` + ${modSum}`
          : `+${modSum}`;

    return `${numberPart}${multiplierPart}${modifierPart}`;
  })());
</script>

<!-- Fixed overlay backdrop (no close-on-click — Apply/Bust are the only exits) -->
<div class="fixed inset-0 z-40 bg-black/50"></div>

<!-- Bottom sheet panel -->
<div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-gray-900 border-t border-gray-700 p-5">
  <!-- Drag handle (decorative) -->
  <div class="flex justify-center mb-4">
    <div class="w-8 h-1 rounded-full bg-gray-600"></div>
  </div>

  <!-- Header: title + Bust -->
  <div class="flex items-start justify-between mb-4">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Card Calculator</p>
      <p class="text-3xl font-bold text-amber-400 leading-none">{total}</p>
      {#if breakdown}
        <p class="text-xs text-gray-500 mt-0.5">{breakdown}</p>
      {/if}
    </div>
    <button
      onclick={onBust}
      class="border border-red-600 text-red-400 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-red-950 transition-colors"
    >
      Bust
    </button>
  </div>

  <!-- Number cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Number Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each NUMBER_CARDS as n}
      <button
        onclick={() => toggleNumber(n)}
        class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors
          {selectedNumbers.includes(n)
            ? 'bg-amber-400 text-gray-900 border-amber-400'
            : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
      >
        {n}
      </button>
    {/each}
  </div>

  <!-- Modifier cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Modifier Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each MODIFIER_CARDS as m}
      <button
        onclick={() => toggleModifier(m)}
        class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors
          {selectedModifiers.includes(m)
            ? 'bg-amber-400 text-gray-900 border-amber-400'
            : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
      >
        +{m}
      </button>
    {/each}
  </div>

  <!-- X2 multiplier -->
  <div class="flex items-center gap-3 mb-5">
    <button
      onclick={() => (x2Selected = !x2Selected)}
      class="rounded-full px-4 py-1.5 text-sm font-bold border transition-colors
        {x2Selected
          ? 'bg-purple-600 text-white border-purple-600'
          : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
    >
      ✕2
    </button>
    <span class="text-xs text-gray-500">doubles your number total</span>
  </div>

  <!-- Apply button -->
  <button
    onclick={() => onApply(total)}
    class="w-full rounded-xl bg-amber-400 text-gray-900 font-bold py-3 text-base hover:bg-amber-300 transition-colors"
  >
    Apply {total}
  </button>
</div>
```

- [ ] **Step 2: Verify the file was created**

```bash
ls "C:/Users/judi_/Projects/flip7scorecard/flip7scorecard/src/lib/components/"
```

Expected: `CardCalculator.svelte` appears alongside `PlayerRow.svelte` and `ScoreInput.svelte`.

---

### Task 4: Wire `CardCalculator` into `ScoreInput`

**Files:**
- Modify: `src/lib/components/ScoreInput.svelte`

- [ ] **Step 1: Update `ScoreInput.svelte`**

Replace the entire contents of `src/lib/components/ScoreInput.svelte` with:

```svelte
<script lang="ts">
  import type { Player } from '$lib/types';
  import { setScore } from '$lib/game.svelte';
  import CardCalculator from './CardCalculator.svelte';

  let {
    player,
    currentRoundScore,
  }: {
    player: Player;
    currentRoundScore: number | null;
  } = $props();

  // Pre-populate with existing score if present
  let inputValue = $state(currentRoundScore !== null ? String(currentRoundScore) : '');
  let calculatorOpen = $state(false);

  function handleSave() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setScore(player.id, parsed);
    }
  }

  function handleBust() {
    inputValue = '0';
    setScore(player.id, 0);
  }
</script>

<div class="flex items-center gap-2 px-1">
  <input
    type="number"
    inputmode="numeric"
    min="0"
    placeholder="Score"
    bind:value={inputValue}
    onfocus={(e) => (e.target as HTMLInputElement).select()}
    class="w-24 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-center tabular-nums focus:outline-none"
  />

  <button
    onclick={() => (calculatorOpen = true)}
    class="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
    aria-label="Open card calculator"
  >
    🃏
  </button>

  <button
    onclick={handleBust}
    class="px-3 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-sm font-medium transition-colors"
  >
    Bust
  </button>

  <button
    onclick={handleSave}
    disabled={!String(inputValue).trim() || isNaN(parseInt(String(inputValue), 10))}
    class="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
  >
    ✓ Save
  </button>
</div>

{#if calculatorOpen}
  <CardCalculator
    onApply={(total) => {
      inputValue = String(total);
      calculatorOpen = false;
    }}
    onBust={() => {
      handleBust();
      calculatorOpen = false;
    }}
  />
{/if}

<style>
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
</style>
```

- [ ] **Step 2: Run type-check**

```bash
cd C:/Users/judi_/Projects/flip7scorecard/flip7scorecard
npm run check
```

Expected: No type errors. If there are errors, fix them before continuing.

- [ ] **Step 3: Run tests to confirm nothing is broken**

```bash
npm test
```

Expected: All tests pass (the new `calcCardTotal` tests plus all pre-existing ones).

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/CardCalculator.svelte src/lib/components/ScoreInput.svelte
git commit -m "feat(SE-8): add card calculator modal to score entry row"
```

---

### Task 5: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the app in a browser (typically `http://localhost:5173`).

- [ ] **Step 2: Verify the Calc button appears**

Add at least one player. Click a player row to expand it. Confirm a 🃏 button appears between the score input and the Bust button.

- [ ] **Step 3: Test Apply flow**

1. Tap 🃏 — bottom sheet appears
2. Tap a number card (e.g. `7`) — it highlights amber, total shows `7`
3. Tap a modifier (e.g. `+4`) — total updates to `11`, breakdown shows `7 + 4`
4. Tap ✕2 — total updates to `18`, breakdown shows `7 × 2 + 4`
5. Tap **Apply 18** — modal closes, score input now shows `18`
6. Tap ✓ Save — score is saved

- [ ] **Step 4: Test Bust flow**

1. Tap 🃏 — bottom sheet appears
2. Toggle a few cards
3. Tap **Bust** (top-right, outlined red) — modal closes, score input shows `0`, score is immediately committed (no Save needed)

- [ ] **Step 5: Test formula edge cases**

| Action | Expected breakdown |
|--------|-------------------|
| Nothing selected | _(no breakdown shown)_ |
| Only 0 card selected | `0` |
| Only +4 modifier selected | `+4` |
| Only ✕2 selected | _(no breakdown shown, total = 0)_ |
| ✕2 + modifiers only | `+6` (X2 omitted, no numbers) |
| Multiple numbers + ✕2 | `(3+7) × 2` |
| Single number + ✕2 | `7 × 2` (no parens) |
