# Design: Swipe to Remove Player

**Date:** 2026-03-17
**Status:** Draft

## Problem

Players cannot be removed from the game without restarting. A remove action exists in `PlayerRow.svelte` (via `removePlayer()`) and an action sheet with Rename/Remove buttons is implemented, but it is only triggered by `oncontextmenu` — right-click on desktop, unreliable on mobile. The feature is effectively inaccessible on the primary target platform.

## Solution

Two complementary gestures, both in `PlayerRow.svelte`:

1. **Swipe left** to reveal a red 🗑️ strip — tap it to remove the player
2. **Long-press** (fixed with proper touch events) to open the existing action sheet for rename/remove

## Design

### All changes in `src/lib/components/PlayerRow.svelte`

No changes to `game.svelte.ts`, `gameLogic.ts`, or any other file. `removePlayer()` and `renamePlayer()` are already exported from the store.

---

### Swipe-to-remove

**New state:**

```ts
let swipeOffset = $state(0);   // current translate X (0 to -72)
let swipeLocked = $state(false); // true when snapped open
let touchStartX = $state(0);
let touchStartY = $state(0);
let isSwipeGesture = $state(false);
```

**Layout change:**

Wrap the existing row content in a relative container. Place the red remove strip absolutely behind it:

```svelte
<div class="relative overflow-hidden rounded-lg">
  <!-- Red strip behind -->
  <div class="absolute inset-y-0 right-0 w-18 bg-red-600 flex items-center justify-center text-xl"
       onclick={handleRemove}>
    🗑️
  </div>
  <!-- Row content slides over it -->
  <div style="transform: translateX({swipeOffset}px); transition: {isSwipeGesture ? 'none' : 'transform 150ms ease'}">
    <!-- existing row markup -->
  </div>
</div>
```

**Touch handlers on the row content div:**

- `ontouchstart`: record `touchStartX`, `touchStartY`; set `isSwipeGesture = false`; check if target is inside the score history element — if so, bail out (let scroll happen)
- `ontouchmove`: compute `deltaX` and `deltaY`; if `Math.abs(deltaX) > Math.abs(deltaY)` and `deltaX < 0`, set `isSwipeGesture = true` and clamp `swipeOffset = Math.max(-72, Math.min(0, deltaX))`; call `e.preventDefault()` to block page scroll during swipe
- `ontouchend`: if `isSwipeGesture`:
  - if `swipeOffset < -40`: snap to locked open (`swipeOffset = -72`, `swipeLocked = true`)
  - else: snap back (`swipeOffset = 0`, `swipeLocked = false`)

**Dismiss when locked open:**

Tapping anywhere on the row content (not the 🗑️ strip) while `swipeLocked` snaps back. Add an `onclick` guard: if `swipeLocked`, call `e.stopPropagation()`, snap back, and return early.

**Conflict with score history scroll:**

The score history element gets a class `score-history`. On `touchstart`, check `(e.target as Element).closest('.score-history')` — if truthy, skip swipe tracking entirely.

---

### Long-press fix

Replace `oncontextmenu` with a proper timer-based long-press:

**New state:**

```ts
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
```

**On the main row button:**

Remove `oncontextmenu`. Add:

- `ontouchstart`: start `longPressTimer = setTimeout(() => { showActions = true; }, 500)`
- `ontouchend`: `clearTimeout(longPressTimer)`
- `ontouchmove`: `clearTimeout(longPressTimer)` (movement cancels long-press)
- Keep `oncontextmenu` as a secondary desktop trigger (right-click still works)

**Coordination:** If a swipe gesture is detected (`isSwipeGesture = true`), clear the long-press timer to avoid both triggering simultaneously.

---

### No changes to

- `src/lib/game.svelte.ts`
- `src/lib/gameLogic.ts`
- `src/routes/+page.svelte`
- `src/lib/components/ScoreInput.svelte`

## Behaviour

| Scenario | Result |
|----------|--------|
| Swipe left < 40px then release | Row snaps back, no action |
| Swipe left > 40px then release | Row locks open at 72px, 🗑️ visible |
| Tap 🗑️ | Player removed immediately |
| Tap row content while locked open | Row snaps back, no action taken |
| Touch starts in score history area | Swipe tracking skipped; score history scrolls normally |
| Long-press (500ms) on row | Action sheet opens with Rename and Remove buttons |
| Release before 500ms | Long-press cancelled |
| Move finger before 500ms | Long-press cancelled |
| Right-click on desktop | Action sheet opens (existing behaviour preserved) |
