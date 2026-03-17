# Unscored Player Warning Dialog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a confirmation dialog when the user clicks "End Round" if any players have no score entered, listing those players by name.

**Architecture:** All changes are confined to `src/routes/+page.svelte`. Add a `showBustWarning` state boolean, an `unscoredPlayers` derived, intercept the End Round click to show the dialog when needed, and add an inline dialog block matching the existing "New Game" confirm pattern.

**Tech Stack:** SvelteKit 2, Svelte 5 runes (`$state`, `$derived`), TypeScript, Tailwind CSS v4

---

## File Map

| File | Change |
|------|--------|
| `src/routes/+page.svelte` | Add state, derived, handlers, and dialog markup |

---

### Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/unscored-player-warning
```

Expected: `Switched to a new branch 'feat/unscored-player-warning'`

---

### Task 2: Add state and derived to `+page.svelte`

**Files:**
- Modify: `src/routes/+page.svelte` (script block, lines 1–49)

- [ ] **Step 1: Add `showBustWarning` state**

In the `<script>` block, after the existing `let showHelp = $state(false);` line (currently line 16), add:

```ts
// Show bust warning dialog when some players have no score
let showBustWarning = $state(false);
```

- [ ] **Step 2: Add `unscoredPlayers` derived**

After the existing `canEndRound` derived (currently ends around line 48), add:

```ts
// Players with no score entered for the current round
const unscoredPlayers = $derived(
  game.players.filter((p) => {
    const s = game.scores[p.id];
    return s[game.currentRound] === undefined || s[game.currentRound] === null;
  })
);
```

> `s` is always a defined array (initialised to `[]` in `addPlayer`). Entries are `null` when back-filled by `setScore`; `undefined` when the array has never been extended to this round index. Both indicate "no score entered".

- [ ] **Step 3: Run type check to verify no errors**

```bash
npm run check
```

Expected: No errors.

---

### Task 3: Update `handleEndRound` and add `confirmEndRound`

**Files:**
- Modify: `src/routes/+page.svelte` (script block, `handleEndRound` function)

- [ ] **Step 1: Update `handleEndRound` to show warning when needed**

Replace the existing `handleEndRound` function:

```ts
function handleEndRound() {
  endRound();
  const w = getWinners(game);
  if (w) winners = w;
}
```

With:

```ts
function handleEndRound() {
  if (unscoredPlayers.length > 0) {
    showBustWarning = true;
    return;
  }
  endRound();
  const w = getWinners(game);
  if (w) winners = w;
}
```

- [ ] **Step 2: Add `confirmEndRound` handler below `handleEndRound`**

```ts
function confirmEndRound() {
  showBustWarning = false;
  endRound();
  const w = getWinners(game);
  if (w) winners = w;
}
```

> Dialog is dismissed before checking for winners so the bust warning is never visible beneath the winner banner.

- [ ] **Step 3: Run type check**

```bash
npm run check
```

Expected: No errors.

---

### Task 4: Add the warning dialog markup

**Files:**
- Modify: `src/routes/+page.svelte` (template, after the New Game confirm dialog block)

- [ ] **Step 1: Add dialog block after the New Game confirmation dialog**

The New Game dialog ends around line 175 with `{/if}`. Immediately after it, add:

```svelte
<!-- Bust warning dialog -->
{#if showBustWarning}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-10 px-6">
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-white">
      <p class="text-center text-lg font-semibold mb-1">Some players haven't scored</p>
      <p class="text-center text-sm text-gray-400 mb-3">These players will be marked as bust (0):</p>
      <ul class="text-center text-sm text-white mb-5 space-y-1">
        {#each unscoredPlayers as player (player.id)}
          <li>{player.name}</li>
        {/each}
      </ul>
      <div class="flex gap-3">
        <button
          onclick={() => (showBustWarning = false)}
          class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={confirmEndRound}
          class="flex-1 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium transition-colors"
        >
          End Round
        </button>
      </div>
    </div>
  </div>
{/if}
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.

---

### Task 5: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify — all players scored, no dialog**

Add 2 players. Enter a score for both. Click "End Round". Expected: round advances immediately with no dialog.

- [ ] **Step 3: Verify — one player unscored, dialog appears**

Add 2 players. Enter a score for player 1 only. Click "End Round". Expected: warning dialog appears listing player 2's name.

- [ ] **Step 4: Verify — Cancel dismisses without ending round**

With the dialog open, click Cancel. Expected: dialog closes, still on the same round, no scores changed.

- [ ] **Step 5: Verify — End Round in dialog proceeds**

With the dialog open, click End Round. Expected: dialog closes, round advances, unscored player shows 0 (bust in red) for that round.

- [ ] **Step 6: Verify — all players unscored, button is disabled**

Add 2 players. Do not enter any scores. Expected: "End Round" button is disabled (greyed out) — dialog is never reachable.

- [ ] **Step 7: Stop the dev server**

`Ctrl+C`

---

### Task 6: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: warn when ending round with unscored players"
```

---

### Task 7: Create PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/unscored-player-warning
```

- [ ] **Step 2: Create PR via MCP GitHub tool**

Use `mcp__plugin_github_github__create_pull_request` with:
- `owner`: (repo owner)
- `repo`: `flip7scorecard`
- `title`: `feat: warn when ending round with unscored players`
- `head`: `feat/unscored-player-warning`
- `base`: `master`
- `body`:

```
## Summary
- Shows a confirmation dialog when "End Round" is clicked and some players have no score for the current round
- Dialog lists the unscored player names and states they will be marked as bust
- Cancel dismisses without ending the round; End Round proceeds as normal

## Test plan
- [ ] All players scored → End Round proceeds immediately, no dialog
- [ ] One or more players unscored → warning dialog appears with their names
- [ ] Cancel in dialog → dialog dismisses, round not ended
- [ ] End Round in dialog → round advances, unscored players get 0 (bust)
- [ ] Zero players scored → End Round button is disabled, dialog unreachable
```
