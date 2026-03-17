# Persist Players on New Game Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the player list when starting a new game from the winner banner, so players don't need to re-enter names for a rematch.

**Architecture:** Add a `playAgain()` function to the game store that resets scores and round but preserves players. Update the winner banner in `+page.svelte` to call it. The header "New Game" button is untouched and still wipes everything.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `src/lib/game.svelte.ts` | Add exported `playAgain()` function |
| `src/routes/+page.svelte` | Import `playAgain`, add `handlePlayAgain`, update winner banner button |

---

### Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/persist-players-on-new-game
```

Expected: `Switched to a new branch 'feat/persist-players-on-new-game'`

---

### Task 2: Add `playAgain()` to `game.svelte.ts`

**Files:**
- Modify: `src/lib/game.svelte.ts`

> Note: `game.svelte.ts` uses Svelte 5 `$state` and cannot be unit-tested with Vitest directly. Verification is via type check and manual testing.

- [ ] **Step 1: Add the `playAgain` function**

Open `src/lib/game.svelte.ts`. After the `newGame()` function (currently ends around line 103), add:

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

This rebuilds `game.scores` with an empty array per existing player, resets `currentRound` to 0, clears the Flip 7 banner, and persists the state. `game.players` is not touched. Unlike `newGame()` which calls `localStorage.removeItem()`, this calls `persist()` to save the player list.

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/lib/game.svelte.ts
git commit -m "feat: add playAgain to reset scores while keeping players"
```

---

### Task 3: Update `+page.svelte` — handler and winner banner

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Import `playAgain`**

Find the existing import on line 2:

```ts
import { game, addPlayer, endRound, newGame, getWinners, totalScore, flip7Banner } from '$lib/game.svelte';
```

Add `playAgain` to the import:

```ts
import { game, addPlayer, endRound, newGame, playAgain, getWinners, totalScore, flip7Banner } from '$lib/game.svelte';
```

- [ ] **Step 2: Add `handlePlayAgain` handler**

After the existing `handleNewGame()` function (currently around line 34–39), add:

```ts
function handlePlayAgain() {
  playAgain();
  winners = null;
  showNewGameConfirm = false;
  expandedPlayerId = null;
}
```

- [ ] **Step 3: Update the winner banner button**

Find the winner banner button (currently around line 244):

```svelte
<button
  onclick={handleNewGame}
  class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
>
  New Game
</button>
```

Change it to:

```svelte
<button
  onclick={handlePlayAgain}
  class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
>
  Play Again
</button>
```

- [ ] **Step 4: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: wire Play Again button to keep players on rematch"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify Play Again keeps players**

Add 2–3 players. Enter scores until someone hits 200+. When the winner banner appears, click "Play Again". Expected: banner dismisses, players are still listed, all scores are cleared, round resets to Round 1.

- [ ] **Step 3: Verify header New Game still wipes everything**

With players listed from the previous step, click "New Game" in the header and confirm. Expected: all players and scores are cleared.

- [ ] **Step 4: Verify localStorage**

After clicking "Play Again", open browser DevTools → Application → localStorage. Expected: the stored state has players present but empty scores arrays.

- [ ] **Step 5: Stop dev server**

`Ctrl+C`

---

### Task 5: Create PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/persist-players-on-new-game
```

- [ ] **Step 2: Create PR via MCP GitHub tool**

Use `mcp__plugin_github_github__create_pull_request` with:
- `owner`: `nickjharr`
- `repo`: `flip7scorecard`
- `title`: `feat: keep players when starting a new game from winner banner`
- `head`: `feat/persist-players-on-new-game`
- `base`: `master`
- `body`:

```
## Summary
- Adds a `playAgain()` store function that resets scores and round to 0 while preserving the player list
- Winner banner "New Game" button renamed to "Play Again" and wired to the new function
- Header "New Game" button is unchanged — still wipes everything including players

## Test plan
- [ ] Click "Play Again" on winner banner → players kept, scores cleared, round resets to 1
- [ ] Click "New Game" in header → all players and scores wiped (existing behaviour)
- [ ] localStorage after Play Again → players present, scores empty
```
