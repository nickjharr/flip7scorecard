# Score History Alignment — Design Spec

**Issue:** #23
**Date:** 2026-03-15
**Status:** Approved

## Problem

In `PlayerRow.svelte`, score history chips render inside a `flex flex-wrap` container. Because items wrap freely and have no fixed width, round 1 for Alice does not visually align with round 1 for Bob. The user cannot easily compare scores across players for the same round.

## Approach: Fixed-width slots, no wrap (Option A)

Replace the wrapping flex row with a no-wrap, overflow-scrollable row of fixed-width chips. Each chip occupies exactly the same horizontal slot, so scores from the same round align across all player rows.

### Changes

**`src/lib/components/PlayerRow.svelte`** — score history block (lines 95–103):

- Remove `flex-wrap` → add `flex-nowrap overflow-x-auto`
- Add `w-9 min-w-9 text-center` to each `<span>` so every chip is exactly 36px wide (accommodates three-digit scores)
- Remove `gap-1.5`; spacing is handled by the fixed width

### Data / logic

No changes to `gameLogic.ts`, `game.svelte.ts`, or any types. This is a pure presentational fix.

### Why this works

All player rows share the same horizontal layout structure (same left padding, same name column, same flex-1 history area). When every chip has an identical fixed width and wrapping is disabled, column N for every player lands at the same x-offset.

### Edge cases

- **Many rounds (10+):** History area scrolls horizontally; the total score and chevron remain visible on the right.
- **Three-digit scores (100–200):** `w-8` (32px) is tight for `"100"` at 11px font. Use `w-9` (36px) to be safe.
- **Single round of history:** One chip, no wrapping issue — behaves identically to before.

## Testing

- Manually verify alignment with 2–4 players across 5+ rounds.
- Verify three-digit scores (e.g. 100, 150) are not clipped.
- Existing unit tests in `gameLogic.test.ts` are unaffected (no logic changes).
