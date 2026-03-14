# Design: Make Score Calculator Dismissible

**Date:** 2026-03-14
**Issue:** #1 — make modals dismissible by clicking outside
**Scope:** CardCalculator bottom sheet only

---

## Problem

The score calculator (`CardCalculator.svelte`) can only be closed by pressing "Apply" or "Bust". Users expect to be able to dismiss it by tapping the backdrop or the drag handle at the top of the sheet.

## Solution

Add an `onDismiss` callback prop to `CardCalculator` and wire it to the backdrop and drag handle. This mirrors the existing pattern already used in `PlayerRow.svelte`.

## Changes

### `src/lib/components/CardCalculator.svelte`

1. **New prop**: `onDismiss: () => void`
2. **Backdrop**: Add `onclick={onDismiss}` to the backdrop `div` (`fixed inset-0 z-40 bg-black/50`)
3. **Content panel**: Add `onclick={(e) => e.stopPropagation()}` to prevent backdrop click from bubbling through the content
4. **Drag handle**: Add `onclick={onDismiss}` and `cursor-pointer` class to the handle `div` so tapping it dismisses the sheet

### `src/lib/components/ScoreInput.svelte`

5. **Pass callback**: Add `onDismiss={() => (calculatorOpen = false)}` when rendering `<CardCalculator>`

## Existing Pattern Reference

`PlayerRow.svelte` (lines 127–154) already uses this identical approach:
- Backdrop `onclick` → closes
- Content `onclick={(e) => e.stopPropagation()}` → prevents closure when interacting with content

## What Is Not Changing

- Visual appearance of the calculator (no style changes except `cursor-pointer` on handle)
- Apply / Bust button behaviour
- State reset on mount
- New Game Confirmation and Winner Banner modals (out of scope)

## Testing

- Tap backdrop → calculator closes without applying a score
- Tap drag handle → calculator closes without applying a score
- Tap any card button inside the calculator → calculator stays open
- Tap Apply → score applied, calculator closes (existing behaviour preserved)
- Tap Bust → bust applied, calculator closes (existing behaviour preserved)
