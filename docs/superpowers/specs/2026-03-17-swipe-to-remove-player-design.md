# Design: Swipe to Remove Player

**Date:** 2026-03-17
**Status:** Draft

## Problem

Players cannot be removed mid-game. `removePlayer()` is exported from the store and called from an action sheet in `PlayerRow.svelte`, but the action sheet has no working mobile trigger. The only trigger is `oncontextmenu`, which fires on right-click (desktop) but does not reliably fire on touch long-press across iOS and Android browsers. There is no working mobile path to the remove action.

## Solution

Two complementary gestures, both in `PlayerRow.svelte`:

1. **Swipe left** to reveal a red 🗑️ strip — tap it to remove the player
2. **Long-press** (fixed with proper touch events) to open the existing action sheet for rename/remove

## Design

### All changes in `src/lib/components/PlayerRow.svelte`

No changes to `game.svelte.ts`, `gameLogic.ts`, or any other file. `removePlayer()` and `renamePlayer()` are already exported from the store.

---

### DOM structure (new layout)

The row gains an outer wrapper for the swipe effect. The red strip sits behind the row content:

```
<div class="relative overflow-hidden rounded-lg mb-3 ...">  ← outer wrapper (swipe container)
  <div class="absolute inset-y-0 right-0 w-[72px] ...">    ← red strip (always present, behind)
    🗑️ button
  </div>
  <div bind:this={rowContentEl}                             ← inner content (slides)
       ontouchstart={handleTouchStart}
       ontouchend={handleTouchEnd}
       onclick={handleContentClick}
       style="transform: translateX(...)">
    <button ontouchstart={handleRowTouchStart}              ← main row button (long-press + tap)
            ontouchend={cancelLongPress}
            oncontextmenu={...}>
      ... existing row markup ...
    </button>
    {#if isExpanded} score input {/if}
  </div>
</div>
```

**Key points:**
- Swipe handlers (`handleTouchStart`, `handleTouchEnd`) are on the **inner content div**, so they wrap both the collapsed row and the expanded score panel
- `handleTouchMove` is attached via `$effect` with `{ passive: false }` on the same div (see below)
- Long-press handlers (`handleRowTouchStart`, `cancelLongPress`) are on the **`<button>`** inside the content div
- `handleContentClick` on the inner div snaps the row back when tapped while locked open
- `bind:this={rowContentEl}` is used to attach the passive:false touchmove listener

---

### Swipe-to-remove

**New state:**

```ts
let swipeOffset = $state(0);        // current translateX, range 0 to -72
let swipeLocked = $state(false);    // true when snapped open at -72
let touchStartX = 0;                // plain variables (not reactive — no UI binding needed)
let touchStartY = 0;
let isSwipeGesture = false;
let rowContentEl: HTMLDivElement;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
```

**Add `score-history` class to the history div** (required for conflict detection):

```svelte
<!-- was: <div class="flex flex-nowrap overflow-x-auto mt-0.5"> -->
<div class="score-history flex flex-nowrap overflow-x-auto mt-0.5">
```

**Passive-false touchmove listener** (required to call `e.preventDefault()` — Svelte 5 event attributes are passive by default):

```ts
$effect(() => {
  if (!rowContentEl) return;
  rowContentEl.addEventListener('touchmove', handleTouchMove, { passive: false });
  return () => rowContentEl.removeEventListener('touchmove', handleTouchMove);
});
```

**Touch handlers:**

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
    clearTimeout(longPressTimer!); // cancel long-press if swipe detected
    longPressTimer = null;
  }

  // Right swipe from locked state — drag back to close
  if (!isSwipeGesture && swipeLocked && Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
    isSwipeGesture = true;
    clearTimeout(longPressTimer!);
    longPressTimer = null;
  }

  if (isSwipeGesture) {
    e.preventDefault(); // works because listener is { passive: false }
    if (swipeLocked) {
      // Dragging right from locked: offset starts at -72, moves toward 0
      swipeOffset = Math.min(0, -72 + deltaX);
    } else {
      // Dragging left from closed: offset starts at 0, moves toward -72
      swipeOffset = Math.max(-72, Math.min(0, deltaX));
    }
  }
}

function handleTouchEnd() {
  if (!isSwipeGesture) return;
  if (swipeLocked) {
    // Was dragging right to close
    if (swipeOffset > -40) {
      swipeOffset = 0;
      swipeLocked = false;
    } else {
      swipeOffset = -72; // snap back open
    }
  } else {
    // Was dragging left to open
    if (swipeOffset < -40) {
      swipeOffset = -72;
      swipeLocked = true;
    } else {
      swipeOffset = 0;
    }
  }
  isSwipeGesture = false;
}
```

**Snap back when tapping locked row:**

On the inner content div, add an `onclick` guard:

```ts
function handleContentClick(e: MouseEvent) {
  if (swipeLocked) {
    e.stopPropagation();
    swipeOffset = 0;
    swipeLocked = false;
    return;
  }
}
```

**Reset swipe state when rename or actions open** (prevents offset persisting into inline rename):

```ts
$effect(() => {
  if (isRenaming || showActions) {
    swipeOffset = 0;
    swipeLocked = false;
  }
});
```

---

### Long-press fix

Remove `oncontextmenu` from the `<button>` as the sole mobile trigger. Replace with a 500ms timer:

```ts
function handleRowTouchStart(e: TouchEvent) {
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

On the `<button>`:

```svelte
ontouchstart={handleRowTouchStart}
ontouchend={cancelLongPress}
oncontextmenu={(e) => { e.preventDefault(); handleLongPress(); }}
```

Note: `handleTouchMove` (on the outer content div) also calls `clearTimeout(longPressTimer)` when a swipe is detected, ensuring the two gestures never fire simultaneously.

---

### CSS transition

Apply transition only when not actively dragging:

```svelte
style="transform: translateX({swipeOffset}px); transition: {isSwipeGesture ? 'none' : 'transform 150ms ease'}"
```

---

### Tailwind width note

Use `w-[72px]` (arbitrary value syntax) for the red strip width, not `w-18`, to ensure correct rendering regardless of the project's Tailwind v4 scale configuration.

---

### No changes to

- `src/lib/game.svelte.ts`
- `src/lib/gameLogic.ts`
- `src/routes/+page.svelte`
- `src/lib/components/ScoreInput.svelte`

## Behaviour

| Scenario | Result |
|----------|--------|
| Swipe left < 40px then release | Row snaps back to 0, no action |
| Swipe left > 40px then release | Row locks open at 72px, 🗑️ visible |
| Swipe right > 32px while row is locked open | Row snaps back to 0 |
| Swipe right < 32px while row is locked open | Row snaps back open (stays at 72px) |
| Tap 🗑️ | Player removed immediately |
| Tap row content while locked open | Row snaps back, expand/collapse does not trigger |
| Touch starts in score history area | Swipe tracking skipped; score history scrolls normally |
| Long-press 500ms on row | Action sheet opens with Rename and Remove |
| Release or move before 500ms | Long-press cancelled |
| Swipe detected (any distance) | Long-press timer cancelled immediately |
| `isRenaming` becomes true (from action sheet) | `swipeOffset` and `swipeLocked` reset to 0/false |
| `showActions` becomes true | `swipeOffset` and `swipeLocked` reset to 0/false |
| Right-click on desktop | Action sheet opens (existing behaviour preserved) |
| Multi-touch | Only `e.touches[0]` tracked; additional fingers ignored |
