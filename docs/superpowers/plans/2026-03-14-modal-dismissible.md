# Modal Dismissible Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CardCalculator bottom sheet dismissible by tapping the backdrop or the drag handle.

**Architecture:** Add a required `onDismiss` callback prop to `CardCalculator`. Wire it to two touch targets: the existing backdrop div and the drag handle (converted from a decorative div to an accessible button). The caller (`ScoreInput`) passes the callback to close the sheet.

**Tech Stack:** SvelteKit 5, Svelte 5 runes (`$props()`), Tailwind CSS v4, TypeScript

---

## Chunk 1: Implement dismissal

**Spec:** `docs/superpowers/specs/2026-03-14-modal-dismissible-design.md`

### File map

| File | Change |
|------|--------|
| `src/lib/components/CardCalculator.svelte` | Add prop, wire backdrop + handle |
| `src/lib/components/ScoreInput.svelte` | Pass `onDismiss` callback |

---

### Task 1: Add `onDismiss` prop and wire the backdrop

**Files:**
- Modify: `src/lib/components/CardCalculator.svelte:4-10` (prop type) and `:62` (backdrop)

- [ ] **Step 1: Add `onDismiss` to the `$props()` type annotation**

  Current (lines 4–10):
  ```svelte
  let {
    onApply,
    onBust,
  }: {
    onApply: (total: number) => void;
    onBust: () => void;
  } = $props();
  ```

  Replace with:
  ```svelte
  let {
    onApply,
    onBust,
    onDismiss,
  }: {
    onApply: (total: number) => void;
    onBust: () => void;
    onDismiss: () => void;
  } = $props();
  ```

- [ ] **Step 2: Add `onclick` to the backdrop div**

  Current (line 62):
  ```svelte
  <!-- Fixed overlay backdrop (no close-on-click — Apply/Bust are the only exits) -->
  <div class="fixed inset-0 z-40 bg-black/50"></div>
  ```

  Replace with:
  ```svelte
  <!-- Fixed overlay backdrop — tap outside to dismiss -->
  <div class="fixed inset-0 z-40 bg-black/50" onclick={onDismiss}></div>
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  npm run check
  ```

  Expected: errors about missing `onDismiss` prop in `ScoreInput.svelte` (we haven't passed it yet) — that's fine and expected at this point.

---

### Task 2: Convert drag handle to dismissible button

**Files:**
- Modify: `src/lib/components/CardCalculator.svelte:67-69` (handle)

- [ ] **Step 4: Replace decorative handle div with an accessible button**

  Current (lines 67–69):
  ```svelte
  <!-- Drag handle (decorative) -->
  <div class="flex justify-center mb-4">
    <div class="w-8 h-1 rounded-full bg-gray-600"></div>
  </div>
  ```

  Replace with:
  ```svelte
  <!-- Drag handle — tap to dismiss -->
  <div class="flex justify-center mb-4">
    <button
      type="button"
      onclick={onDismiss}
      aria-label="Dismiss calculator"
      class="cursor-pointer p-2 -m-2"
    >
      <div class="w-8 h-1 rounded-full bg-gray-600"></div>
    </button>
  </div>
  ```

  > The `-m-2 p-2` trick enlarges the tap target without changing the visual. The handle pill itself is unchanged.

- [ ] **Step 5: Run TypeScript check**

  ```bash
  npm run check
  ```

  Expected: same error as before (missing prop in caller). No new errors.

---

### Task 3: Pass `onDismiss` from ScoreInput

**Files:**
- Modify: `src/lib/components/ScoreInput.svelte:70-81`

- [ ] **Step 6: Add `onDismiss` to the `<CardCalculator>` usage**

  Current (lines 70–81):
  ```svelte
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
  ```

  Replace with:
  ```svelte
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
      onDismiss={() => {
        calculatorOpen = false;
      }}
    />
  {/if}
  ```

- [ ] **Step 7: Run TypeScript check — expect clean**

  ```bash
  npm run check
  ```

  Expected: **0 errors**

- [ ] **Step 8: Run unit tests — expect pass**

  ```bash
  npm test
  ```

  Expected: all existing tests pass (the existing tests cover `gameLogic.ts` only — no component tests to break)

- [ ] **Step 9: Manual verification**

  Start the dev server:
  ```bash
  npm run dev
  ```

  Verify:
  - Open the score calculator for any player
  - Tap outside the sheet (on the dark backdrop) → sheet closes, no score applied
  - Open again → tap the drag handle pill → sheet closes, no score applied
  - Open again → tap a card button → sheet stays open
  - Open again → tap Apply → score is applied and sheet closes
  - Open again → tap Bust → bust is applied and sheet closes

- [ ] **Step 10: Commit**

  ```bash
  git add src/lib/components/CardCalculator.svelte src/lib/components/ScoreInput.svelte
  git commit -m "feat: make score calculator dismissible by tapping backdrop or handle (closes #1)"
  ```
