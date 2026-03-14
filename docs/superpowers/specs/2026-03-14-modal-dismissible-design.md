# Design: Make Score Calculator Dismissible

**Date:** 2026-03-14
**Issue:** #1 — make modals dismissible by clicking outside
**Scope:** CardCalculator bottom sheet only

---

## Problem

The score calculator (`CardCalculator.svelte`) can only be closed by pressing "Apply" or "Bust". Users expect to be able to dismiss it by tapping the backdrop or the drag handle at the top of the sheet.

## Solution

Add an `onDismiss: () => void` **required** prop to `CardCalculator` and wire it to the backdrop and drag handle. TypeScript enforces the prop at the call site — no runtime guard needed. The backdrop and content panel are sibling `div`s, so clicking the content can never bubble to the backdrop — no `stopPropagation` is needed.

## Changes

### `src/lib/components/CardCalculator.svelte`

1. **New required prop**: Add `onDismiss: () => void` to the inline TypeScript type annotation in the `$props()` destructure (lines 4–10)
2. **Backdrop**: Add `onclick={onDismiss}` to the backdrop `div` (`fixed inset-0 z-40 bg-black/50`)
3. **Drag handle**: Replace the decorative inner `div` (`w-8 h-1 rounded-full bg-gray-600`) with a `<button>` wrapper. The button should:
   - Preserve the visual appearance of the existing handle (same child div, same classes)
   - Add `onclick={onDismiss}`, `type="button"`, `aria-label="Dismiss calculator"`
   - Add `cursor-pointer` to make the tap target obvious

   The handle is purely decorative today — no drag logic exists on it. The `flex justify-center mb-4` wrapper div remains unchanged.

### `src/lib/components/ScoreInput.svelte`

4. **Pass callback**: Add `onDismiss={() => (calculatorOpen = false)}` when rendering `<CardCalculator>`. Confirmed: the controlling variable is `calculatorOpen` (line 18 of `ScoreInput.svelte`).

## Keyboard / Escape key

Escape key handling is **out of scope** for this change. The button handle gains Enter/Space keyboard dismissal automatically as a native `<button>`.

## DOM Structure Note

The backdrop (`z-40`) and content panel (`z-50`) are **sibling fixed-position divs**. Clicks on the content panel do not bubble to the backdrop. No `stopPropagation` is required.

## What Is Not Changing

- Visual appearance of the calculator
- Apply / Bust button behaviour
- State reset on mount
- New Game Confirmation and Winner Banner modals (out of scope)

## Testing

- Tap backdrop → calculator closes without applying a score
- Tap drag handle → calculator closes without applying a score
- Keyboard focus on handle + Enter/Space → calculator closes
- Tap any card button inside the calculator → calculator stays open
- Tap Apply → score applied, calculator closes (existing behaviour preserved)
- Tap Bust → bust applied, calculator closes (existing behaviour preserved)
