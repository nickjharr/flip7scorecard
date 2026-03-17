# Design: Unscored Player Warning Dialog

**Date:** 2026-03-17
**Status:** Draft

## Problem

When a user clicks "End Round", any players without a score are silently treated as bust (score = 0). Users may not notice they've missed entering a score for a player.

## Solution

Intercept the End Round action and show a confirmation dialog when one or more players have no score for the current round. The user can proceed (accepting bust for those players) or cancel (to go back and enter scores).

## Design

### Approach

Option A — inline dialog in `src/routes/+page.svelte`, consistent with the existing "New Game" confirmation pattern. No new files or components.

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
    return s[game.currentRound] === undefined || s[game.currentRound] === null;
  })
);
```

> Note: `game.scores[p.id]` is always initialised to `[]` in `addPlayer`, so `s` is always a defined array. An entry is `null` when `setScore` back-filled a shorter array (explicit null placeholder). An entry is `undefined` when the array has never been extended to that round index. Both must be checked.

**Modified `handleEndRound`:**
- If `unscoredPlayers.length > 0`, set `showBustWarning = true` and return early
- Otherwise call `endRound()` and check for winners as today

> Note: `canEndRound` already disables the button when zero players have scored, so `handleEndRound` is only ever called when at least one player has a score. The "all players unscored" case is therefore unreachable here.

**New `confirmEndRound` handler:**
1. Set `showBustWarning = false`
2. Call `endRound()`
3. Check for winners via `getWinners(game)` and set `winners` if found

Dismissing the dialog before checking for winners ensures it is never visible beneath the winner banner.

**New inline dialog (`{#if showBustWarning}`):**
- Same visual style as the existing New Game confirm dialog (dark overlay, `z-10`, rounded card)
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
| Zero players have scored | End Round button is disabled — dialog never shown |
| All players scored | End Round proceeds immediately, no dialog |
| One or more players unscored | Warning dialog shown listing unscored player names |
| User clicks Cancel | Dialog dismissed, round not ended |
| User clicks End Round in dialog | `showBustWarning` cleared, round ends, unscored players get bust (0) |
| Round end via dialog causes a winner | Dialog dismissed first, then winner banner (z-20) appears on top |
