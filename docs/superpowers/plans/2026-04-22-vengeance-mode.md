# Vengeance Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent "Flip 7 With a Vengeance" toggle to the Card Calculator that swaps the entire card set (negative modifiers, ÷2 multiplier, number cards 0–13 with Lucky 13 selectable twice).

**Architecture:** `vengeanceMode` lives as a standalone `$state` in `game.svelte.ts` with its own localStorage key, independent of game state. `calcCardTotal` gains a `multiplier` union type replacing the `x2: boolean` param. `CardCalculator` reads `vengeanceMode` directly from the store; `ScoreInput` floors negative totals to 0 before saving.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript (strict), Vitest, Tailwind CSS v4

---

## File Map

| File | Change |
|------|--------|
| `src/lib/gameLogic.ts` | Replace `x2: boolean` with `multiplier: 'x2' \| 'div2' \| null` |
| `src/lib/gameLogic.test.ts` | Update existing tests; add `div2` and negative-modifier tests |
| `src/lib/game.svelte.ts` | Add `loadVengeanceMode`, `vengeanceMode` state, `setVengeanceMode` |
| `src/lib/components/CardCalculator.svelte` | Mode toggle, new card sets, Lucky 13, ÷2, updated Flip 7 detection |
| `src/lib/components/ScoreInput.svelte` | Floor negative total on apply in vengeance mode |

---

## Task 1: Update `calcCardTotal` signature and tests

**Files:**
- Modify: `src/lib/gameLogic.ts`
- Modify: `src/lib/gameLogic.test.ts`

- [ ] **Step 1: Update the failing tests first**

Replace the entire `describe('calcCardTotal', ...)` block in `src/lib/gameLogic.test.ts` with:

```ts
describe('calcCardTotal', () => {
  it('returns 0 when nothing is selected', () => {
    expect(calcCardTotal([], [], null)).toBe(0);
  });

  it('sums number cards correctly', () => {
    expect(calcCardTotal([3, 7, 2], [], null)).toBe(12);
  });

  it('sums modifier cards correctly', () => {
    expect(calcCardTotal([], [4, 6], null)).toBe(10);
  });

  it('applies x2 to number total only, not modifiers', () => {
    expect(calcCardTotal([5], [4], 'x2')).toBe(14); // (5 × 2) + 4
  });

  it('x2 with no number cards returns only modifier sum', () => {
    expect(calcCardTotal([], [8], 'x2')).toBe(8); // (0 × 2) + 8
  });

  it('combines numbers, x2, and modifiers correctly', () => {
    expect(calcCardTotal([3, 7], [2, 4], 'x2')).toBe(26); // (10 × 2) + 6
  });

  it('div2 halves number sum (floor) and then adds modifiers', () => {
    expect(calcCardTotal([7], [], 'div2')).toBe(3); // floor(7 / 2)
  });

  it('div2 floors odd results', () => {
    expect(calcCardTotal([5, 4], [], 'div2')).toBe(4); // floor(9 / 2)
  });

  it('div2 with no number cards returns only modifier sum', () => {
    expect(calcCardTotal([], [-4], 'div2')).toBe(-4); // floor(0 / 2) + (-4)
  });

  it('negative modifiers reduce total', () => {
    expect(calcCardTotal([8], [-2, -4], null)).toBe(2); // 8 + (-6)
  });

  it('negative modifiers can produce a total below zero', () => {
    expect(calcCardTotal([2], [-10], null)).toBe(-8); // 2 + (-10)
  });

  it('two 13s sum correctly', () => {
    expect(calcCardTotal([13, 13], [], null)).toBe(26);
  });
});
```

- [ ] **Step 2: Run tests — expect failures on the `calcCardTotal` suite**

```bash
npx vitest run src/lib/gameLogic.test.ts
```

Expected: The `calcCardTotal` tests fail because the function still takes `boolean`. All other suites pass.

- [ ] **Step 3: Update `calcCardTotal` in `src/lib/gameLogic.ts`**

Replace the function with:

```ts
/**
 * Calculates the score for a hand of Flip 7 cards.
 * x2 applies only to the number card total, not modifiers.
 * div2 halves the number card total (floor), not modifiers.
 */
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

- [ ] **Step 4: Run tests — all must pass**

```bash
npx vitest run src/lib/gameLogic.test.ts
```

Expected: All tests pass. TypeScript will now flag the `CardCalculator.svelte` call site (next task fixes that).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gameLogic.ts src/lib/gameLogic.test.ts
git commit -m "feat: update calcCardTotal to support div2 multiplier and negative modifiers"
```

---

## Task 2: Add `vengeanceMode` state to `game.svelte.ts`

**Files:**
- Modify: `src/lib/game.svelte.ts`

- [ ] **Step 1: Add `loadVengeanceMode` and the reactive state**

After the `STORAGE_KEY` constant at the top of `src/lib/game.svelte.ts`, add:

```ts
const VENGEANCE_KEY = 'flip7_vengeance';

function loadVengeanceMode(): boolean {
  if (!browser) return false;
  try {
    const raw = localStorage.getItem(VENGEANCE_KEY);
    return raw ? (JSON.parse(raw) as boolean) : false;
  } catch {
    return false;
  }
}
```

Then after the `export const game = ...` line, add:

```ts
export const vengeanceMode = $state({ active: loadVengeanceMode() });

export function setVengeanceMode(val: boolean): void {
  vengeanceMode.active = val;
  if (browser) localStorage.setItem(VENGEANCE_KEY, JSON.stringify(val));
}
```

- [ ] **Step 2: Run type-check to verify no errors**

```bash
npm run check
```

Expected: Passes (or only pre-existing errors from the `CardCalculator` call site — TypeScript will flag `calcCardTotal(..., x2Selected)` where `x2Selected` is boolean but `'x2' | 'div2' | null` is expected).

- [ ] **Step 3: Commit**

```bash
git add src/lib/game.svelte.ts
git commit -m "feat: add vengeanceMode persistent state to game store"
```

---

## Task 3: Update `CardCalculator.svelte`

**Files:**
- Modify: `src/lib/components/CardCalculator.svelte`

This task replaces the entire `<script>` block and the full component markup. Read the current file in full before making changes.

- [ ] **Step 1: Replace the `<script>` block**

Replace everything between `<script lang="ts">` and `</script>` with:

```ts
import { calcCardTotal, FLIP_7_CARD_COUNT, FLIP_7_BONUS } from '$lib/gameLogic';
import { vengeanceMode, setVengeanceMode } from '$lib/game.svelte';
import { fly, fade } from 'svelte/transition';
import { cubicOut, cubicIn } from 'svelte/easing';

let {
  onApply,
  onBust,
  onDismiss,
}: {
  onApply: (total: number, isFlip7: boolean) => void;
  onBust: () => void;
  onDismiss: () => void;
} = $props();

// --- Selection state (resets each time modal mounts or mode switches) ---
let selectedNumbers = $state<number[]>([]);
let selectedModifiers = $state<number[]>([]);
let multiplierSelected = $state(false);

// --- Card sets derived from mode ---
const NUMBER_CARDS = $derived(
  vengeanceMode.active
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
);
const MODIFIER_CARDS = $derived(
  vengeanceMode.active ? [-2, -4, -6, -8, -10] : [2, 4, 6, 8, 10]
);

function switchMode(val: boolean) {
  setVengeanceMode(val);
  selectedNumbers = [];
  selectedModifiers = [];
  multiplierSelected = false;
}

function toggleNumber(n: number) {
  if (vengeanceMode.active && n === 13) {
    const count = selectedNumbers.filter((x) => x === 13).length;
    if (count < 2) {
      selectedNumbers = [...selectedNumbers, 13];
    } else {
      selectedNumbers = selectedNumbers.filter((x) => x !== 13);
    }
    return;
  }
  selectedNumbers = selectedNumbers.includes(n)
    ? selectedNumbers.filter((x) => x !== n)
    : [...selectedNumbers, n];
}

function toggleModifier(m: number) {
  selectedModifiers = selectedModifiers.includes(m)
    ? selectedModifiers.filter((x) => x !== m)
    : [...selectedModifiers, m];
}

// --- Flip 7 detection: 7 DIFFERENT number cards ---
const isFlip7 = $derived(new Set(selectedNumbers).size === FLIP_7_CARD_COUNT);

// --- Multiplier for calcCardTotal ---
const multiplier = $derived(
  multiplierSelected ? (vengeanceMode.active ? 'div2' : 'x2') : null
) as 'x2' | 'div2' | null;

// --- Derived total ---
const total = $derived(
  calcCardTotal(selectedNumbers, selectedModifiers, multiplier) + (isFlip7 ? FLIP_7_BONUS : 0)
);

// --- Formula breakdown string ---
const breakdown = $derived.by(() => {
  const numSum = selectedNumbers.reduce((a, b) => a + b, 0);
  const modSum = selectedModifiers.reduce((a, b) => a + b, 0);

  const count13 = vengeanceMode.active
    ? selectedNumbers.filter((x) => x === 13).length
    : 0;
  const otherNumbers = vengeanceMode.active
    ? selectedNumbers.filter((x) => x !== 13)
    : selectedNumbers;

  const allDisplayNums =
    count13 === 2
      ? [...otherNumbers, 13, 13]
      : count13 === 1
        ? [...otherNumbers, 13]
        : otherNumbers;

  const numberPart =
    allDisplayNums.length === 0
      ? ''
      : multiplierSelected && allDisplayNums.length > 1
        ? `(${allDisplayNums.join('+')})`
        : `${numSum}`;

  const multiplierPart =
    multiplierSelected && allDisplayNums.length > 0
      ? vengeanceMode.active
        ? ' ÷ 2'
        : ' × 2'
      : '';

  const modifierPart =
    selectedModifiers.length === 0
      ? ''
      : numberPart || multiplierPart
        ? modSum >= 0
          ? ` + ${modSum}`
          : ` - ${Math.abs(modSum)}`
        : `${modSum}`;

  const flip7Part = isFlip7 ? ` + ${FLIP_7_BONUS} (Flip 7!)` : '';

  return `${numberPart}${multiplierPart}${modifierPart}${flip7Part}`;
});

// --- Lucky 13 button state helper ---
function count13(): number {
  return selectedNumbers.filter((x) => x === 13).length;
}
```

- [ ] **Step 2: Replace the markup**

Replace everything from `<!-- Fixed overlay backdrop -->` to the end of the file with:

```svelte
<!-- Fixed overlay backdrop — tap outside to dismiss -->
<div transition:fade={{ duration: 250 }} class="fixed inset-0 z-40 bg-black/50" role="presentation" onclick={onDismiss} onkeydown={(e) => e.key === 'Escape' && onDismiss()}></div>

<!-- Bottom sheet panel -->
<div
  in:fly={{ y: 600, duration: 320, easing: cubicOut }}
  out:fly={{ y: 600, duration: 250, easing: cubicIn }}
  class="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-gray-900 border-t border-gray-700 p-5"
  role="dialog" aria-modal="true" aria-labelledby="card-calculator-title"
>
  <!-- Drag handle — tap to dismiss -->
  <div class="flex justify-center mb-4">
    <button
      type="button"
      onclick={onDismiss}
      aria-label="Dismiss calculator"
      class="cursor-pointer p-2 -m-2"
    >
      <div class="w-8 h-1 rounded-full bg-gray-600" aria-hidden="true"></div>
    </button>
  </div>

  <!-- Header: title + mode toggle + Bust -->
  <div class="flex items-start justify-between mb-4">
    <div>
      <p id="card-calculator-title" class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Card Calculator</p>
      <p class="text-3xl font-bold {total < 0 ? 'text-red-400' : 'text-amber-400'} leading-none">{total}</p>
      {#if breakdown}
        <p class="text-xs text-gray-500 mt-0.5">{breakdown}</p>
      {/if}
    </div>
    <div class="flex flex-col items-end gap-2">
      <!-- Mode toggle pill -->
      <div class="flex rounded-lg border border-gray-600 overflow-hidden text-xs font-semibold">
        <button
          type="button"
          onclick={() => switchMode(false)}
          class="px-3 py-1.5 transition-colors {!vengeanceMode.active ? 'bg-amber-400 text-gray-900' : 'bg-transparent text-gray-400 hover:text-gray-200'}"
        >
          Base
        </button>
        <button
          type="button"
          onclick={() => switchMode(true)}
          class="px-3 py-1.5 transition-colors {vengeanceMode.active ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-gray-200'}"
        >
          Vengeance
        </button>
      </div>
      <button
        type="button"
        onclick={onBust}
        class="border border-red-600 text-red-400 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-red-950 transition-colors"
      >
        Bust
      </button>
    </div>
  </div>

  <!-- Flip 7 badge -->
  {#if isFlip7}
    <div class="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-400/10 border border-amber-400/40 rounded-xl">
      <span class="text-amber-400 font-bold text-sm">🎴 Flip 7! +15 bonus applied</span>
    </div>
  {/if}

  <!-- Number cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Number Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each NUMBER_CARDS as n (n)}
      {#if vengeanceMode.active && n === 13}
        {@const c = count13()}
        <button
          type="button"
          onclick={() => toggleNumber(13)}
          disabled={isFlip7 && c === 0}
          class="relative rounded-full px-3 py-1.5 text-sm font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed
            {c > 0
              ? 'bg-amber-400 text-gray-900 border-amber-400'
              : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
        >
          13
          {#if c === 2}
            <span class="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">×2</span>
          {/if}
        </button>
      {:else}
        <button
          type="button"
          onclick={() => toggleNumber(n)}
          disabled={isFlip7 && !selectedNumbers.includes(n)}
          class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed
            {selectedNumbers.includes(n)
              ? 'bg-amber-400 text-gray-900 border-amber-400'
              : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
        >
          {n}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Modifier cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Modifier Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each MODIFIER_CARDS as m (m)}
      <button
        type="button"
        onclick={() => toggleModifier(m)}
        class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors
          {selectedModifiers.includes(m)
            ? 'bg-amber-400 text-gray-900 border-amber-400'
            : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
      >
        {m > 0 ? `+${m}` : `${m}`}
      </button>
    {/each}
  </div>

  <!-- Multiplier -->
  <div class="flex items-center gap-3 mb-5">
    <button
      type="button"
      onclick={() => (multiplierSelected = !multiplierSelected)}
      class="rounded-full px-4 py-1.5 text-sm font-bold border transition-colors
        {multiplierSelected
          ? 'bg-purple-600 text-white border-purple-600'
          : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
    >
      {vengeanceMode.active ? '÷2' : '✕2'}
    </button>
    <span class="text-xs text-gray-500">
      {vengeanceMode.active ? 'halves your number total' : 'doubles your number total'}
    </span>
  </div>

  <!-- Apply button -->
  <button
    type="button"
    onclick={() => onApply(total, isFlip7)}
    class="w-full rounded-xl bg-amber-400 text-gray-900 font-bold py-3 text-base hover:bg-amber-300 transition-colors"
  >
    Apply {total}
  </button>
</div>
```

- [ ] **Step 3: Run type-check**

```bash
npm run check
```

Expected: Passes (the `calcCardTotal` call now uses the correct `multiplier` type).

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/CardCalculator.svelte
git commit -m "feat: add Vengeance mode to CardCalculator with mode toggle, Lucky 13, and div2 multiplier"
```

---

## Task 4: Update `ScoreInput.svelte` to floor negative totals

**Files:**
- Modify: `src/lib/components/ScoreInput.svelte`

- [ ] **Step 1: Import `vengeanceMode` and floor the applied total**

At the top of the `<script>` block in `src/lib/components/ScoreInput.svelte`, update the import from `$lib/game.svelte` to include `vengeanceMode`:

```ts
import { setScore, setFlip7Banner, vengeanceMode } from '$lib/game.svelte';
```

Then update the `onApply` handler inside the `{#if calculatorOpen}` block. Change:

```ts
onApply={(total, isFlip7) => {
  inputValue = String(total);
  calculatorOpen = false;
  if (isFlip7) {
    pendingFlip7Score = total;
    showFlip7Confirm = true;
  } else {
    commitSave(total);
  }
}}
```

To:

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

- [ ] **Step 2: Run type-check and tests**

```bash
npm run check && npx vitest run
```

Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ScoreInput.svelte
git commit -m "feat: floor negative Vengeance mode totals to 0 on save"
```

---

## Task 5: Manual smoke test and PR

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the app in a browser at the URL shown (typically `http://localhost:5173`).

- [ ] **Step 2: Smoke test — Base mode**

1. Add a player, open the calculator
2. Verify the toggle shows "Base" selected (amber)
3. Select number cards 0–6 → Flip 7 badge appears, total = 21 + 15 = 36
4. Select +4, +6 modifier → total = 36 + 10 = 46
5. Toggle ✕2, select 3 number cards → verify number total doubles, modifiers unchanged
6. Hit Bust → score 0 recorded
7. Confirm mode toggle persists after closing and reopening the calculator

- [ ] **Step 3: Smoke test — Vengeance mode**

1. Open the calculator, click "Vengeance" in the pill toggle
2. Verify card sets change: modifiers show -2 to -10, multiplier shows ÷2
3. Confirm the toggle stays "Vengeance" after closing/reopening
4. Select 13 once → amber, no badge
5. Select 13 again → ×2 badge appears, total shows 26
6. Select 13 a third time → deselects, back to gray
7. Select number cards 0, 1, 2, 3, 4, 5, 13, 13 → Flip 7! (7 unique cards), total = (0+1+2+3+4+5+26) + 15 = 56
8. Select -10 modifier → total = 46 (56 - 10); verify breakdown shows `- 10`
9. Select number cards that produce a negative total (e.g., just card 2 + modifier -10) → total shows -8 in red; click Apply → score saves as 0
10. Toggle ÷2 with number cards summing to 9 → verify floor: 4 (not 4.5)
11. Switch back to Base → card set resets, positive modifiers show, ×2 returns

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feat/vengeance-mode
gh pr create --title "feat: Flip 7 With a Vengeance mode in Card Calculator" --body "$(cat <<'EOF'
## Summary
- Adds a persistent Base / Vengeance toggle to the Card Calculator
- Vengeance mode replaces card set: number cards 0–13 (Lucky 13 selectable twice), negative modifiers -2 to -10, ÷2 multiplier
- Negative totals display in red and floor to 0 on save (per official rules)
- Mode preference persists in localStorage across games

## Test plan
- [ ] Base mode: Flip 7 detection, ×2 multiplier, positive modifiers all work as before
- [ ] Vengeance mode: Lucky 13 cycles 0→1→2→deselect with ×2 badge
- [ ] Vengeance mode: 7 unique cards (including two 13s) triggers Flip 7
- [ ] Vengeance mode: negative total displays red, saves as 0
- [ ] Vengeance mode: ÷2 halves number sum (floor on odd)
- [ ] Mode toggle persists after closing/reopening calculator and across new games
- [ ] `calcCardTotal` unit tests pass for `div2`, negative modifiers, two 13s
EOF
)"
```
