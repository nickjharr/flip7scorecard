# Swipe to Remove Player Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add swipe-left-to-remove on player rows and fix the broken long-press gesture to make the rename/remove action sheet reachable on mobile.

**Architecture:** All changes are confined to `src/lib/components/PlayerRow.svelte`. The existing `removePlayer()`/`renamePlayer()` store functions and the action sheet markup are untouched — only the gesture detection and DOM layout change. A red 🗑️ strip sits behind each row; swiping left reveals it. Long-press is fixed by replacing `oncontextmenu` with a proper 500ms touch timer.

**Tech Stack:** SvelteKit 2, Svelte 5 runes (`$state`, `$effect`), TypeScript, Tailwind CSS v4

---

## File Map

| File | Change |
|------|--------|
| `src/lib/components/PlayerRow.svelte` | New state, restructured DOM layout, swipe + long-press touch handlers |

---

### Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/swipe-to-remove-player
```

Expected: `Switched to a new branch 'feat/swipe-to-remove-player'`

---

### Task 2: Add new state variables

**Files:**
- Modify: `src/lib/components/PlayerRow.svelte` (script block)

The current script block declares `showActions`, `isRenaming`, `renameValue`, and derived values. Add the new variables below the existing `let showActions = $state(false)` line.

- [ ] **Step 1: Add swipe and long-press state**

```ts
// Swipe-to-remove state
let swipeOffset = $state(0);        // current translateX px, range 0 to -72
let swipeLocked = $state(false);    // true when row is snapped open at -72px
let touchStartX = 0;                // plain vars — no reactive binding needed
let touchStartY = 0;
let isSwipeGesture = false;
let rowContentEl: HTMLDivElement;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

---

### Task 3: Restructure the row DOM layout

**Files:**
- Modify: `src/lib/components/PlayerRow.svelte` (template)

The current outer div wraps the button and expanded panel directly. We need to:
1. Add `relative overflow-hidden` to the outer div (it already has `rounded-lg`)
2. Insert the red strip as an absolutely-positioned child
3. Wrap the button + expanded panel in a new `bind:this` inner div

- [ ] **Step 1: Add `score-history` class to the history div**

Find this line in the template (currently around line 95):

```svelte
<div class="flex flex-nowrap overflow-x-auto mt-0.5">
```

Change it to:

```svelte
<div class="score-history flex flex-nowrap overflow-x-auto mt-0.5">
```

This class is required for touch conflict detection (skip swipe tracking when touch starts in score history).

- [ ] **Step 2: Restructure the outer div and add the inner sliding wrapper**

Replace the entire row container block:

```svelte
<!-- Row container -->
<div class="border-b border-gray-800 last:border-0 rounded-lg transition-all duration-300 mb-3" style={rowGlowStyle}>

  <!-- Main row (tap to expand) -->
  <button
    class="w-full flex items-center gap-3 px-3 py-3 text-left"
    onclick={onExpand}
    oncontextmenu={(e) => { e.preventDefault(); handleLongPress(); }}
  >
```

With:

```svelte
<!-- Row container — relative+overflow-hidden required for swipe reveal -->
<div class="relative overflow-hidden border-b border-gray-800 last:border-0 rounded-lg transition-all duration-300 mb-3" style={rowGlowStyle}>

  <!-- Red remove strip — sits behind the sliding content -->
  <div class="absolute inset-y-0 right-0 w-[72px] bg-red-600 flex items-center justify-center text-xl"
       role="button"
       tabindex="-1"
       aria-label="Remove {player.name}"
       onclick={handleRemove}
       onkeydown={(e) => e.key === 'Enter' && handleRemove()}>
    🗑️
  </div>

  <!-- Inner sliding content -->
  <div
    bind:this={rowContentEl}
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    onclick={handleContentClick}
    style="transform: translateX({swipeOffset}px); transition: {isSwipeGesture ? 'none' : 'transform 150ms ease'}"
  >

  <!-- Main row (tap to expand) -->
  <button
    class="w-full flex items-center gap-3 px-3 py-3 text-left"
    onclick={onExpand}
    ontouchstart={handleRowTouchStart}
    ontouchend={cancelLongPress}
    oncontextmenu={(e) => { e.preventDefault(); handleLongPress(); }}
  >
```

- [ ] **Step 3: Close the new inner div before closing the outer div**

Find the closing tags at the bottom of the template (currently around line 124–126):

```svelte
  <!-- Expanded: inline score input -->
  {#if isExpanded}
    <div class="px-3 pb-3">
      <ScoreInput {player} {currentRoundScore} onSave={onExpand} />
    </div>
  {/if}

</div>
```

Change to:

```svelte
  <!-- Expanded: inline score input -->
  {#if isExpanded}
    <div class="px-3 pb-3">
      <ScoreInput {player} {currentRoundScore} onSave={onExpand} />
    </div>
  {/if}

  </div> <!-- end inner sliding content -->
</div>   <!-- end outer row container -->
```

- [ ] **Step 4: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

---

### Task 4: Add swipe touch handlers

**Files:**
- Modify: `src/lib/components/PlayerRow.svelte` (script block)

Add these functions in the script block, after the existing `handleRemove()` function.

- [ ] **Step 1: Add `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, `handleContentClick`**

```ts
function handleTouchStart(e: TouchEvent) {
  // Always reset gesture state, even if we bail early
  isSwipeGesture = false;

  // If touch starts inside score history, skip swipe tracking — let it scroll
  if ((e.target as Element).closest('.score-history')) return;

  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}

function handleTouchMove(e: TouchEvent) {
  const t = e.touches[0];
  const deltaX = t.clientX - touchStartX;
  const deltaY = t.clientY - touchStartY;

  // Left swipe from unlocked state
  if (!isSwipeGesture && !swipeLocked && Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
    isSwipeGesture = true;
    clearTimeout(longPressTimer!);
    longPressTimer = null;
  }

  // Right swipe from locked state — drag back to close
  if (!isSwipeGesture && swipeLocked && Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
    isSwipeGesture = true;
    clearTimeout(longPressTimer!);
    longPressTimer = null;
  }

  if (isSwipeGesture) {
    e.preventDefault(); // works because listener is registered with { passive: false }
    if (swipeLocked) {
      swipeOffset = Math.min(0, -72 + deltaX);
    } else {
      swipeOffset = Math.max(-72, Math.min(0, deltaX));
    }
  }
}

function handleTouchEnd() {
  if (!isSwipeGesture) return;
  if (swipeLocked) {
    // Was dragging right to close — commit if past threshold
    if (swipeOffset > -40) {
      swipeOffset = 0;
      swipeLocked = false;
    } else {
      swipeOffset = -72; // snap back open
    }
  } else {
    // Was dragging left to open — commit if past threshold
    if (swipeOffset < -40) {
      swipeOffset = -72;
      swipeLocked = true;
    } else {
      swipeOffset = 0;
    }
  }
  isSwipeGesture = false;
}

function handleContentClick(e: MouseEvent) {
  // When locked open, any tap on the content snaps back (does not expand/collapse)
  if (swipeLocked) {
    e.stopPropagation();
    swipeOffset = 0;
    swipeLocked = false;
  }
}
```

- [ ] **Step 2: Add the passive-false `$effect` for `handleTouchMove`**

After the existing `$derived` blocks (around line 43), add:

```ts
// Must be registered with { passive: false } to allow e.preventDefault() during swipe
$effect(() => {
  if (!rowContentEl) return;
  rowContentEl.addEventListener('touchmove', handleTouchMove, { passive: false });
  return () => rowContentEl.removeEventListener('touchmove', handleTouchMove);
});
```

- [ ] **Step 3: Add the swipe-state reset `$effect`**

```ts
// Reset swipe state when rename input or action sheet opens
$effect(() => {
  if (isRenaming || showActions) {
    swipeOffset = 0;
    swipeLocked = false;
  }
});
```

- [ ] **Step 4: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

---

### Task 5: Add long-press touch handlers

**Files:**
- Modify: `src/lib/components/PlayerRow.svelte` (script block)

The existing `handleLongPress()` function (sets `showActions = true`) stays — we just need to add the timer-based touch handlers that call it.

- [ ] **Step 1: Add `handleRowTouchStart` and `cancelLongPress`**

```ts
function handleRowTouchStart() {
  longPressTimer = setTimeout(() => {
    showActions = true;
    longPressTimer = null;
  }, 500);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}
```

These are already wired to the `<button>` via `ontouchstart={handleRowTouchStart}` and `ontouchend={cancelLongPress}` from Task 3. The existing `oncontextmenu` handler is also already in place from Task 3.

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/PlayerRow.svelte
git commit -m "feat: swipe-to-remove player rows and fix long-press gesture"
```

---

### Task 6: Manual verification

> Note: This is a gesture-based feature requiring a real device or browser DevTools touch simulation. Use Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M) to simulate touch events.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify swipe-to-remove**

Add 2 players. In DevTools touch mode, swipe a row left past halfway. Expected: row snaps open at 72px revealing 🗑️. Tap 🗑️. Expected: player removed from list.

- [ ] **Step 3: Verify snap-back on short swipe**

Swipe a row left less than halfway, release. Expected: row snaps back to 0, no remove action.

- [ ] **Step 4: Verify tap-to-close when locked open**

Swipe a row open (locked). Tap on the row content area. Expected: row snaps back, expand/collapse does not trigger.

- [ ] **Step 5: Verify right-swipe to close**

Swipe a row open (locked). Swipe right past 32px. Expected: row snaps back to 0.

- [ ] **Step 6: Verify score history scroll is unaffected**

Play several rounds so the score history has entries. Touch and scroll the score history area horizontally. Expected: scrolls normally without triggering swipe.

- [ ] **Step 7: Verify long-press opens action sheet**

Long-press (hold) a row for 500ms. Expected: action sheet appears with "Rename" and "Remove".

- [ ] **Step 8: Verify right-click still works on desktop**

In non-touch mode, right-click a player row. Expected: action sheet appears.

- [ ] **Step 9: Stop dev server**

`Ctrl+C`

---

### Task 7: Create PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/swipe-to-remove-player
```

- [ ] **Step 2: Create PR via MCP GitHub tool**

Use `mcp__plugin_github_github__create_pull_request` with:
- `owner`: `nickjharr`
- `repo`: `flip7scorecard`
- `title`: `feat: swipe-to-remove player rows and fix long-press gesture`
- `head`: `feat/swipe-to-remove-player`
- `base`: `master`
- `body`:

```
## Summary
- Swipe a player row left to reveal a red 🗑️ strip; tap it to remove the player
- Swipe < halfway snaps back; swipe > halfway locks open; swipe right to close
- Score history horizontal scroll is unaffected (conflict detection via `.score-history` class)
- Fixes the broken long-press gesture — replaced `oncontextmenu`-only trigger with a proper 500ms touch timer
- Right-click on desktop still opens the action sheet (existing behaviour preserved)

## Test plan
- [ ] Swipe left > 40px → row locks open at 72px, 🗑️ visible
- [ ] Swipe left < 40px → row snaps back, no action
- [ ] Tap 🗑️ → player removed
- [ ] Tap row content while locked → snaps back, no expand
- [ ] Swipe right > 32px while locked → snaps back to closed
- [ ] Score history touch → scrolls normally, no swipe triggered
- [ ] Long-press 500ms → action sheet opens (Rename / Remove)
- [ ] Right-click desktop → action sheet opens
```
