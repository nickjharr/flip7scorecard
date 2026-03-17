# Help Button — Design Spec

**Date:** 2026-03-17
**Issue:** #35
**Status:** Approved

---

## Overview

Add a help button to the app header that opens a modal with usage instructions, external links, and copyright information.

---

## Header Change

In `src/routes/+page.svelte`, the header is a `flex items-center justify-between` row. Wrap the `?` and "New Game" buttons in a `<div class="flex gap-3">` on the right side, preserving the `justify-between` layout. The `?` button: `text-sm text-gray-400 hover:text-white transition-colors`, `aria-label="Help"`. Clicking it sets `showHelp = true` and `expandedPlayerId = null` (collapses any open score input, preventing z-index layering with the card calculator).

---

## New Component: `HelpModal.svelte`

**Location:** `src/lib/components/HelpModal.svelte`

**Props:** `{ onDismiss: () => void }`

**Structure:** Follows the centered-dialog pattern, with accessibility attributes matching `CardCalculator.svelte`:
- Fixed full-screen backdrop: `fixed inset-0 bg-black/70 flex items-center justify-center z-10 px-6`; `role="presentation"`, `onclick={onDismiss}` (no keyboard handler — the panel handles Escape)
- Inner panel: `bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-white overflow-y-auto max-h-[80vh]`; `role="dialog"`, `aria-modal="true"`, `aria-labelledby="help-modal-title"`, `tabindex="-1"`
- The "How to Play" heading has `id="help-modal-title"`
- Focus management: when the modal opens, focus moves to the panel (`bind:this` + `el.focus()` in `$effect`); when dismissed, focus returns to the previously focused element using the document focus restore pattern — save `document.activeElement` on mount and call `.focus()` on it in the dismiss handler

**Content sections:**

1. **Title** — "How to Play"
2. **Instructions** — Expanded bullet list covering:
   - Add up to 12 players using the input at the bottom
   - Tap a player row to enter their score for the round
   - Use the card calculator (🧮) to total your hand from individual cards
   - Tap Bust if a player busted this round (score = 0)
   - Hit End Round when all players have scored
   - First player to reach 200+ cumulative points wins
3. **Rules link** — "Full Flip 7 rules" → `https://theop.games/pages/flip-7` (`target="_blank" rel="noopener noreferrer"`)
4. **Source link** — "View source on GitHub" → `https://github.com/nickjharr/flip7scorecard` (`target="_blank" rel="noopener noreferrer"`)
5. **Copyright** — `© 2026 Nick Harrington`
6. **Close button** — full-width, `bg-gray-700 hover:bg-gray-600`

---

## Wiring

In `+page.svelte`:
- Add `let showHelp = $state(false)`
- Render `<HelpModal onDismiss={() => (showHelp = false)} />` when `showHelp` is true
- `z-index`: modal uses `z-10`, same level as New Game confirm (they are mutually exclusive)

---

## What's Not Changing

- No game store mutations
- No new routes
- No localStorage changes
- Existing modal patterns unchanged
