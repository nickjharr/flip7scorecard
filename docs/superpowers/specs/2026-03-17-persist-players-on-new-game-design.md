# Design: Persist Players on New Game

**Date:** 2026-03-17
**Status:** Draft

## Problem

When a game ends (a winner is declared), the winner banner offers a "New Game" button that wipes all players and scores. Players who want a rematch must re-enter every player name manually.

## Solution

Rename the winner banner button to "Play Again" and wire it to a new `playAgain()` action that resets scores and round number but keeps the player list intact. The header "New Game" button continues to wipe everything.

## Design

### Approach

Option A — add a `playAgain()` function to `game.svelte.ts` and update the winner banner in `+page.svelte`. No changes to `newGame()` or `gameLogic.ts`.

### Changes to `src/lib/game.svelte.ts`

Add a new exported function:

```ts
export function playAgain(): void {
  const freshScores: Record<string, (number | null)[]> = {};
  for (const player of game.players) {
    freshScores[player.id] = [];
  }
  game.scores = freshScores;
  game.currentRound = 0;
  flip7Banner.active = false;
  persist();
}
```

This rebuilds `game.scores` with an empty array per existing player, resets `currentRound` to 0, and clears the Flip 7 banner. `game.players` is not touched.

Note: `playAgain()` calls `persist()` rather than `localStorage.removeItem()` (as `newGame()` does). This is intentional — the goal is to save the reset state with the player list intact, not discard it.

Note: the winner banner's visibility is controlled by the `winners` local state variable in `+page.svelte`, not by anything in the store. `playAgain()` does not need to touch `winners` — that is handled in `handlePlayAgain()` in `+page.svelte`.

### Changes to `src/routes/+page.svelte`

1. **Import `playAgain`** from `$lib/game.svelte`.

2. **Add `handlePlayAgain()` handler:**

```ts
function handlePlayAgain() {
  playAgain();
  winners = null;
  showNewGameConfirm = false;
  expandedPlayerId = null;
}
```

`winners = null` dismisses the winner banner. `showNewGameConfirm = false` is included defensively for consistency with `handleNewGame()`, even though both dialogs cannot be simultaneously visible in practice.

3. **Update the winner banner button:**

Change the button label from "New Game" to "Play Again" and wire `onclick` to `handlePlayAgain()` instead of `handleNewGame()`.

### No changes to

- `src/lib/gameLogic.ts`
- The header "New Game" button (`handleNewGame()` still calls `newGame()`)
- Any other component

## Behaviour

| Scenario | Result |
|----------|--------|
| Game ends, user clicks "Play Again" | Scores and round reset to 0; players kept; winner banner dismissed |
| Header "New Game" clicked at any time | All players, scores, and round wiped (existing behaviour unchanged) |
| localStorage after Play Again | Persisted state reflects reset scores and round with players intact |
| `playAgain()` called with no players | No-op for scores loop; round resets to 0; safe — call site guarantees players exist |
