# Design: Unscored Player Warning Dialog

**Date:** 2026-03-17
**Status:** Approved

## Problem

When a user clicks "End Round", any players without a score are silently treated as bust (score = 0). Users may not notice they've missed entering a score for a player.

## Solution

Intercept the End Round action and show a confirmation dialog when one or more players have no score for the current round. The user can proceed (accepting bust for those players) or cancel (to go back and enter scores).

## Design

### Approach

Option A — inline dialog in `+page.svelte`, consistent with the existing "New Game" confirmation pattern. No new files or components.

### Changes (all in `src/routes/+page.svelte`)

**New state:**
```ts
let showBustWarning = $state(false);
```

**New derived:**
```ts
const unscoredPlayers = $derived(
  game.players.filter((p) => {
    const s = game.scores[p.id];
    return !s || s[game.currentRound] === undefined || s[game.currentRound] === null;
  })
);
```

**Modified `handleEndRound`:**
- If `unscoredPlayers.length > 0`, set `showBustWarning = true` and return early
- Otherwise call `endRound()` and check for winners as today

**New `confirmEndRound` handler:**
- Calls `endRound()`
- Checks for winners
- Sets `showBustWarning = false`

**New inline dialog (`{#if showBustWarning}`):**
- Same visual style as the existing New Game confirm dialog (dark overlay, rounded card)
- Title: "Some players haven't scored"
- Body: lists unscored player names; states they will be marked as bust
- "Cancel" button: sets `showBustWarning = false`
- "End Round" button: calls `confirmEndRound`

### No changes to

- `src/lib/game.svelte.ts`
- `src/lib/gameLogic.ts`
- Any other component

## Behaviour

| Scenario | Result |
|----------|--------|
| All players scored | End Round proceeds immediately, no dialog |
| One or more players unscored | Warning dialog shown with player names |
| User clicks Cancel | Dialog dismissed, round not ended |
| User clicks End Round in dialog | Round ends, unscored players get bust (0) |
