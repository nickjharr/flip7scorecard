# Flip 7 Scorecard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, single-page Flip 7 scorecard that tracks 1–12 players across rounds, persists to localStorage, and declares a winner at 200+ points.

**Architecture:** Pure game logic lives in `gameLogic.ts` (plain TypeScript, fully unit-testable). Reactive state wraps that logic in `game.svelte.ts` using Svelte 5 `$state` runes and handles localStorage. UI components import state directly — no prop drilling.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes mode), TypeScript, Tailwind CSS v4, Vitest

---

## File Map

| File | Role |
|------|------|
| `src/lib/gameLogic.ts` | Pure functions: `totalScore`, `getWinners`, `createEmptyGame` |
| `src/lib/gameLogic.test.ts` | Vitest unit tests for all pure logic |
| `src/lib/game.svelte.ts` | Reactive `$state` game store + all mutations + localStorage sync |
| `src/lib/components/PlayerRow.svelte` | One player row: name, score history, cumulative total, expand/collapse |
| `src/lib/components/ScoreInput.svelte` | Inline score entry: number input, Bust button, Save button |
| `src/routes/+page.svelte` | App shell: header, player list, add-player form, End Round button, winner banner |

---

## Chunk 1: Foundation — Pure Logic + Testing Setup

### Task 1: Install Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
cd C:/Users/judi_/Projects/flip7scorecard/flip7scorecard
npm install -D vitest
```

Expected: Vitest added to `devDependencies` in `package.json`.

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest works**

```bash
npx vitest run
```

Expected output: `No test files found` (no error, exits 0).

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts
git commit -m "chore: add vitest for unit testing"
```

---

### Task 2: Pure Game Logic (TDD)

**Files:**
- Create: `src/lib/gameLogic.ts`
- Create: `src/lib/gameLogic.test.ts`

- [ ] **Step 1: Create types file**

Create `src/lib/types.ts`:

```ts
export type Player = {
  id: string;
  name: string;
};

export type GameState = {
  players: Player[];
  // scores[playerId][roundIndex] = number entered, or null if not yet entered
  scores: Record<string, (number | null)[]>;
  currentRound: number;
};
```

- [ ] **Step 2: Write failing tests for `totalScore`**

Create `src/lib/gameLogic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { totalScore, getWinners, createEmptyGame } from './gameLogic';
import type { GameState } from './types';

describe('totalScore', () => {
  it('returns 0 for a player with no scores', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [] },
      currentRound: 0,
    };
    expect(totalScore(state.scores, 'p1')).toBe(0);
  });

  it('sums non-null scores', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [23, 18, 31] },
      currentRound: 3,
    };
    expect(totalScore(state.scores, 'p1')).toBe(72);
  });

  it('ignores null entries', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [23, null, 31] },
      currentRound: 2,
    };
    expect(totalScore(state.scores, 'p1')).toBe(54);
  });

  it('counts 0 (bust) as 0 points, not ignored', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [20, 0, 10] },
      currentRound: 3,
    };
    expect(totalScore(state.scores, 'p1')).toBe(30);
  });
});

describe('getWinners', () => {
  it('returns null when no player has reached 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      scores: { p1: [99], p2: [150] },
      currentRound: 1,
    };
    expect(getWinners(state)).toBeNull();
  });

  it('returns the highest-scoring player when someone reaches 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      scores: { p1: [210], p2: [180] },
      currentRound: 1,
    };
    const winners = getWinners(state);
    expect(winners).not.toBeNull();
    expect(winners!.length).toBe(1);
    expect(winners![0].name).toBe('Alice');
  });

  it('returns all tied leaders when multiple players share the highest score above 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Carol' },
      ],
      scores: { p1: [210], p2: [210], p3: [195] },
      currentRound: 1,
    };
    const winners = getWinners(state);
    expect(winners).not.toBeNull();
    expect(winners!.length).toBe(2);
    expect(winners!.map((w) => w.name).sort()).toEqual(['Alice', 'Bob']);
  });

  it('winner is highest scorer even if they did not personally cross 200', () => {
    // Edge case: p1=205, p2=220 — p2 wins because highest total
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      scores: { p1: [205], p2: [220] },
      currentRound: 1,
    };
    const winners = getWinners(state);
    expect(winners![0].name).toBe('Bob');
  });
});

describe('getWinners — edge cases', () => {
  it('returns null when there are no players', () => {
    const state: GameState = { players: [], scores: {}, currentRound: 0 };
    expect(getWinners(state)).toBeNull();
  });
});

describe('createEmptyGame', () => {
  it('creates a game with no players and round 0', () => {
    const game = createEmptyGame();
    expect(game.players).toEqual([]);
    expect(game.scores).toEqual({});
    expect(game.currentRound).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run
```

Expected: FAIL — `Cannot find module './gameLogic'`

- [ ] **Step 4: Implement `gameLogic.ts`**

Create `src/lib/gameLogic.ts`:

```ts
import type { GameState, Player } from './types';

/** Sum of all non-null scores for a player. */
export function totalScore(
  scores: Record<string, (number | null)[]>,
  playerId: string
): number {
  const playerScores = scores[playerId] ?? [];
  return playerScores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
}

/**
 * Returns the player(s) with the highest total score if any player
 * has reached 200+. Returns null if no player has reached 200 yet.
 */
export function getWinners(state: GameState): Player[] | null {
  const totals = state.players.map((p) => ({
    player: p,
    total: totalScore(state.scores, p.id),
  }));

  const max = Math.max(...totals.map((t) => t.total));

  if (max < 200) return null;

  return totals.filter((t) => t.total === max).map((t) => t.player);
}

/** Create a fresh empty game state. */
export function createEmptyGame(): GameState {
  return { players: [], scores: {}, currentRound: 0 };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/gameLogic.ts src/lib/gameLogic.test.ts
git commit -m "feat: add pure game logic with tests"
```

---

### Task 3: Reactive Game Store

**Files:**
- Create: `src/lib/game.svelte.ts`

This file uses Svelte 5 `$state` runes. The `.svelte.ts` extension tells the Svelte compiler to process runes. Components import from this file and get live reactivity automatically.

- [ ] **Step 1: Create `game.svelte.ts`**

Create `src/lib/game.svelte.ts`:

```ts
import { browser } from '$app/environment';
import { createEmptyGame, totalScore, getWinners } from './gameLogic';
import type { GameState, Player } from './types';

const STORAGE_KEY = 'flip7_game';

// Load from localStorage on startup, or start fresh.
function loadInitialState(): GameState {
  if (!browser) return createEmptyGame();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyGame();
    const parsed = JSON.parse(raw) as unknown;
    // Validate required shape
    if (
      parsed &&
      typeof parsed === 'object' &&
      'players' in parsed &&
      'scores' in parsed &&
      'currentRound' in parsed
    ) {
      return parsed as GameState;
    }
  } catch {
    // Ignore malformed data
  }
  return createEmptyGame();
}

// The reactive game state — Svelte 5 tracks mutations automatically.
export const game = $state<GameState>(loadInitialState());

// Write current state to localStorage.
function persist() {
  if (browser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }
}

export function addPlayer(name: string): void {
  const id = crypto.randomUUID();
  game.players.push({ id, name });
  game.scores[id] = [];
  persist();
}

export function removePlayer(id: string): void {
  game.players = game.players.filter((p) => p.id !== id);
  delete game.scores[id];
  persist();
}

export function renamePlayer(id: string, name: string): void {
  const player = game.players.find((p) => p.id === id);
  if (player) {
    player.name = name;
    persist();
  }
}

// Bust is a UI shortcut — callers pass 0.
export function setScore(playerId: string, score: number): void {
  const playerScores = game.scores[playerId];
  if (!playerScores) return;
  // Extend array to current round if needed
  while (playerScores.length <= game.currentRound) {
    playerScores.push(null);
  }
  playerScores[game.currentRound] = score;
  persist();
}

export function endRound(): void {
  game.currentRound += 1;
  persist();
}

export function newGame(): void {
  const empty = createEmptyGame();
  game.players = empty.players;
  game.scores = empty.scores;
  game.currentRound = empty.currentRound;
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Re-export derived helpers for convenience in components.
export { totalScore, getWinners };
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npm run check
```

Expected: No errors. (Warnings about unused exports are fine.)

> **Note for Svelte 5:** Using `$state` at module scope in a `.svelte.ts` file is valid and intentional in Svelte 5 — it is the recommended pattern for shared reactive state. If the compiler emits an error like "state_referenced_locally" or similar, it means the Svelte version predates this feature. In that case, wrap the state in a function: `function createGame() { let state = $state(loadInitialState()); return state; } export const game = createGame();`

- [ ] **Step 3: Commit**

```bash
git add src/lib/game.svelte.ts
git commit -m "feat: add reactive game store with localStorage persistence"
```

---

## Chunk 2: Core UI Components

### Task 4: App Shell (`+page.svelte`)

**Files:**
- Modify: `src/routes/+page.svelte`

Replace the default SvelteKit content with the app shell. At this stage, just get the structure in place with placeholder text where components will go.

- [ ] **Step 1: Replace `+page.svelte` with app shell**

Replace the entire contents of `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import { game, addPlayer, endRound, newGame, getWinners, totalScore } from '$lib/game.svelte';
  import PlayerRow from '$lib/components/PlayerRow.svelte';

  // Which player row is currently expanded (null = none)
  let expandedPlayerId = $state<string | null>(null);

  // New player name input
  let newPlayerName = $state('');

  // Show new game confirmation
  let showNewGameConfirm = $state(false);

  // Winner state — set after endRound detects 200+
  let winners = $state<import('$lib/types').Player[] | null>(null);

  function handleAddPlayer() {
    const name = newPlayerName.trim();
    if (!name || game.players.length >= 12) return;
    addPlayer(name);
    newPlayerName = '';
  }

  function handleEndRound() {
    endRound();
    const w = getWinners(game);
    if (w) winners = w;
  }

  function handleNewGame() {
    newGame();
    winners = null;
    showNewGameConfirm = false;
    expandedPlayerId = null;
  }

  // End Round is enabled when: ≥1 player exists AND ≥1 score entered this round
  const canEndRound = $derived(
    game.players.length > 0 &&
      game.players.some((p) => {
        const s = game.scores[p.id];
        return s && s[game.currentRound] !== undefined && s[game.currentRound] !== null;
      })
  );
</script>

<div class="min-h-screen bg-gray-950 text-white flex flex-col max-w-lg mx-auto">
  <!-- Header -->
  <header class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
    <h1 class="text-xl font-bold tracking-tight">Flip 7</h1>
    <button
      onclick={() => (showNewGameConfirm = true)}
      class="text-sm text-gray-400 hover:text-white transition-colors"
    >
      New Game
    </button>
  </header>

  <!-- Player list -->
  <main class="flex-1 overflow-y-auto px-4 py-2">
    {#if game.players.length === 0}
      <p class="text-gray-500 text-sm text-center mt-8">Add players below to start tracking scores.</p>
    {/if}

    {#each game.players as player (player.id)}
      <PlayerRow
        {player}
        scores={game.scores[player.id] ?? []}
        currentRound={game.currentRound}
        cumulative={totalScore(game.scores, player.id)}
        isExpanded={expandedPlayerId === player.id}
        onExpand={() => {
          expandedPlayerId = expandedPlayerId === player.id ? null : player.id;
        }}
      />
    {/each}
  </main>

  <!-- Footer controls -->
  <footer class="px-4 py-3 border-t border-gray-800 flex flex-col gap-2">
    {#if game.players.length < 12}
      <form
        onsubmit={(e) => { e.preventDefault(); handleAddPlayer(); }}
        class="flex gap-2"
      >
        <input
          type="text"
          placeholder="Player name"
          bind:value={newPlayerName}
          maxlength={20}
          class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!newPlayerName.trim()}
          class="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add
        </button>
      </form>
    {/if}

    <button
      onclick={handleEndRound}
      disabled={!canEndRound}
      class="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg text-sm font-semibold transition-colors"
    >
      End Round {game.currentRound + 1}
    </button>
  </footer>
</div>

<!-- New game confirmation dialog -->
{#if showNewGameConfirm}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-10 px-6">
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
      <p class="text-center text-lg font-semibold mb-1">Start a new game?</p>
      <p class="text-center text-sm text-gray-400 mb-5">All scores will be cleared.</p>
      <div class="flex gap-3">
        <button
          onclick={() => (showNewGameConfirm = false)}
          class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={handleNewGame}
          class="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm font-medium transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Winner banner -->
{#if winners}
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-20 px-6">
    <div class="bg-gray-900 rounded-2xl p-8 w-full max-w-sm text-center">
      <div class="text-5xl mb-4">🎉</div>
      <p class="text-2xl font-bold mb-1">
        {winners.map((w) => w.name).join(' & ')}
        {winners.length === 1 ? 'wins' : 'win'}!
      </p>
      <p class="text-gray-400 text-sm mb-6">
        {winners[0] ? totalScore(game.scores, winners[0].id) : 0} points
      </p>
      <button
        onclick={handleNewGame}
        class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
      >
        New Game
      </button>
    </div>
  </div>
{/if}
```

- [ ] **Step 2: Run type-check**

```bash
npm run check
```

Expected: Errors about missing `PlayerRow` component — that's fine, we'll create it next.

- [ ] **Step 3: Commit the shell (errors expected for now)**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add app shell layout and game state wiring"
```

---

### Task 5: PlayerRow Component

**Files:**
- Create: `src/lib/components/PlayerRow.svelte`
- Create: `src/lib/components/ScoreInput.svelte` (stub only — filled in Task 6)

- [ ] **Step 1: Create stub ScoreInput to unblock PlayerRow**

Create `src/lib/components/ScoreInput.svelte`:

```svelte
<script lang="ts">
  import type { Player } from '$lib/types';
  let { player, currentRoundScore }: { player: Player; currentRoundScore: number | null } = $props();
</script>

<div class="p-2 text-gray-400 text-xs">Score input coming soon…</div>
```

- [ ] **Step 2: Create PlayerRow.svelte**

Create `src/lib/components/PlayerRow.svelte`:

```svelte
<script lang="ts">
  import type { Player } from '$lib/types';
  import { removePlayer, renamePlayer } from '$lib/game.svelte';
  import ScoreInput from './ScoreInput.svelte';

  let {
    player,
    scores,
    currentRound,
    cumulative,
    isExpanded,
    onExpand,
  }: {
    player: Player;
    scores: (number | null)[];
    currentRound: number;
    cumulative: number;
    isExpanded: boolean;
    onExpand: () => void;
  } = $props();

  let showActions = $state(false);
  let isRenaming = $state(false);
  let renameValue = $state(player.name);

  // Previous rounds only (not the current round)
  const previousRounds = $derived(scores.slice(0, currentRound));

  // Score for the current round
  const currentRoundScore = $derived(scores[currentRound] ?? null);

  function handleLongPress() {
    showActions = true;
  }

  function handleRename() {
    isRenaming = true;
    renameValue = player.name;
    showActions = false;
  }

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed) renamePlayer(player.id, trimmed);
    isRenaming = false;
  }

  function handleRemove() {
    removePlayer(player.id);
    showActions = false;
  }
</script>

<!-- Row container -->
<div class="border-b border-gray-800 last:border-0">

  <!-- Main row (tap to expand) -->
  <button
    class="w-full flex items-center gap-3 px-0 py-3 text-left"
    onclick={onExpand}
    oncontextmenu={(e) => { e.preventDefault(); handleLongPress(); }}
  >
    <!-- Player name + history -->
    <div class="flex-1 min-w-0">
      {#if isRenaming}
        <!-- svelte-ignore event_directive_deprecated -->
        <input
          type="text"
          bind:value={renameValue}
          onclick={(e) => e.stopPropagation()}
          onblur={submitRename}
          onkeydown={(e) => { if (e.key === 'Enter') submitRename(); }}
          class="bg-gray-800 border border-blue-500 rounded px-2 py-0.5 text-sm w-full focus:outline-none"
          autofocus
        />
      {:else}
        <span class="text-sm font-medium">{player.name}</span>
      {/if}

      <!-- Score history: previous rounds with strikethrough -->
      {#if previousRounds.length > 0}
        <div class="flex flex-wrap gap-1.5 mt-0.5">
          {#each previousRounds as score, i (i)}
            <span class="text-xs text-gray-500 line-through">
              {score !== null ? score : '--'}
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Current round pending indicator -->
    <span class="text-xs text-gray-500 w-5 text-center">
      {currentRoundScore !== null ? '' : '--'}
    </span>

    <!-- Cumulative total -->
    <span class="text-lg font-bold text-amber-400 w-12 text-right tabular-nums">
      {cumulative}
    </span>

    <!-- Expand chevron -->
    <span class="text-gray-500 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
  </button>

  <!-- Expanded: inline score input -->
  {#if isExpanded}
    <div class="pb-3">
      <ScoreInput {player} {currentRoundScore} />
    </div>
  {/if}

</div>

<!-- Actions overlay (rename / remove) -->
{#if showActions}
  <div
    class="fixed inset-0 bg-black/60 z-10 flex items-end"
    onclick={() => (showActions = false)}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full bg-gray-900 rounded-t-2xl p-4"
      onclick={(e) => e.stopPropagation()}
    >
      <p class="text-center text-sm font-semibold text-gray-300 mb-3">{player.name}</p>
      <button
        onclick={handleRename}
        class="w-full py-3 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-xl mb-2 transition-colors"
      >
        Rename
      </button>
      <button
        onclick={handleRemove}
        class="w-full py-3 text-sm font-medium bg-red-900 hover:bg-red-800 rounded-xl transition-colors"
      >
        Remove
      </button>
    </div>
  </div>
{/if}
```

- [ ] **Step 3: Run type-check**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 4: Start dev server and verify the player list renders**

```bash
npm run dev
```

Open `http://localhost:5173`. Add a couple of players — they should appear as rows with name and "0" cumulative total. Tap to expand shows the stub "coming soon" text.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/PlayerRow.svelte src/lib/components/ScoreInput.svelte
git commit -m "feat: add PlayerRow component with score history display"
```

---

### Task 6: ScoreInput Component

**Files:**
- Modify: `src/lib/components/ScoreInput.svelte` (replace stub)

- [ ] **Step 1: Replace ScoreInput stub with full implementation**

Replace the entire contents of `src/lib/components/ScoreInput.svelte`:

```svelte
<script lang="ts">
  import type { Player } from '$lib/types';
  import { setScore } from '$lib/game.svelte';

  let {
    player,
    currentRoundScore,
  }: {
    player: Player;
    currentRoundScore: number | null;
  } = $props();

  // Pre-populate with existing score if present
  let inputValue = $state(currentRoundScore !== null ? String(currentRoundScore) : '');

  function handleSave() {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setScore(player.id, parsed);
    }
  }

  function handleBust() {
    inputValue = '0';
    setScore(player.id, 0);
  }
</script>

<div class="flex items-center gap-2 px-1">
  <input
    type="number"
    inputmode="numeric"
    min="0"
    placeholder="Score"
    bind:value={inputValue}
    class="w-24 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-center tabular-nums focus:outline-none"
  />

  <button
    onclick={handleBust}
    class="px-3 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-sm font-medium transition-colors"
  >
    Bust
  </button>

  <button
    onclick={handleSave}
    disabled={!inputValue.trim() || isNaN(parseInt(inputValue, 10))}
    class="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
  >
    ✓ Save
  </button>
</div>
```

- [ ] **Step 2: Run type-check**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

1. Add 2–3 players.
2. Tap a player row — it should expand showing the number input, Bust, and Save buttons.
3. Enter a number, tap Save — the score is recorded. The row stays open (scores remain editable until End Round). The current round score indicator next to the player's name should update.
4. Tap Bust — score shows 0, row stays open.
5. Tapping a different player collapses the current one and expands the new one.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/ScoreInput.svelte
git commit -m "feat: add inline score entry with bust shortcut"
```

---

## Chunk 3: Game Flow & Polish

### Task 7: End Round + Winner Detection

**Files:**
- Already wired in `+page.svelte` — verify the flow end-to-end

- [ ] **Step 1: Verify End Round behaviour in browser**

```bash
npm run dev
```

1. Add 2 players (Alice, Bob).
2. Enter a score for Alice. Verify "End Round 1" button is now enabled.
3. Leave Bob without a score. Tap "End Round 1".
4. Both players should advance to round 2. Alice's round 1 score appears as history (strikethrough). Bob shows `--` for round 1 in history.
5. Enter scores for both in round 2. Tap "End Round 2".

- [ ] **Step 2: Verify winner detection**

In the browser dev tools console, force a win to test the banner:

```js
// In browser console:
localStorage.setItem('flip7_game', JSON.stringify({
  players: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
  scores: { p1: [190], p2: [185] },
  currentRound: 1
}));
location.reload();
```

After reload, `currentRound` is 1, so the app is on **round 2** (index 1). The scores array entry at index 0 is the completed round 1 history. Enter a new score ≥ 10 for Alice (this goes into round 2, index 1) and tap End Round. Alice's total will be 190 + new score ≥ 200. Winner banner should appear naming Alice.

- [ ] **Step 3: Verify tie detection**

```js
localStorage.setItem('flip7_game', JSON.stringify({
  players: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
  scores: { p1: [190], p2: [190] },
  currentRound: 1
}));
location.reload();
```

Enter 15 for both, tap End Round. Banner should say "Alice & Bob win!"

- [ ] **Step 4: Verify localStorage persistence**

1. Add players, enter some scores.
2. Refresh the page (`F5`).
3. All scores and player names should be restored.

- [ ] **Step 5: Commit (no code changes, verification only)**

If Step 1–4 pass without code changes:

```bash
git commit --allow-empty -m "chore: verified end round and winner detection flows"
```

If fixes were needed, stage and commit them:

```bash
git add -p
git commit -m "fix: correct end round / winner detection behaviour"
```

---

### Task 8: Player Management Polish

**Files:**
- Already implemented in `PlayerRow.svelte` — verify and refine

- [ ] **Step 1: Verify rename flow**

1. Add a player.
2. Long-press (right-click on desktop) their row — actions sheet should slide up.
3. Tap Rename — inline input should appear.
4. Type a new name, press Enter or tap outside — name should update.

- [ ] **Step 2: Verify remove flow**

1. Add 2 players, enter scores for both.
2. Long-press a player → actions sheet appears → tap Remove.
3. Player disappears immediately. Other player's scores untouched.
4. Removing a player who has a current-round score entered: verify their score is dropped and End Round still works correctly for remaining players.

> **Note:** The spec calls for a remove confirmation dialog. The actions sheet itself acts as a two-step guard (long-press → then tap Remove), which was accepted as sufficient for MVP. If desired, a confirm prompt can be added inside `handleRemove` in `PlayerRow.svelte` using `window.confirm('Remove {player.name}?')` before calling `removePlayer`.

- [ ] **Step 3: Verify 12-player cap**

Add 12 players — the "Add Player" form should disappear. Remove one — it reappears.

- [ ] **Step 4: Verify mid-game add**

1. Complete 2 rounds with 2 players.
2. Add a third player in round 3.
3. Carol's history should show `--` for rounds 1 and 2. Her cumulative total shows 0.

- [ ] **Step 5: Commit any fixes**

```bash
git add -p
git commit -m "fix: player management edge cases"
```

---

### Task 9: Final Polish + Static Adapter

**Files:**
- Modify: `package.json` (add adapter-static)
- Modify: `svelte.config.js` (swap adapter)

The app needs `adapter-static` to deploy as a plain static site (GitHub Pages, Netlify, etc.). Currently it uses `adapter-auto`.

- [ ] **Step 1: Install adapter-static**

```bash
npm install -D @sveltejs/adapter-static
```

- [ ] **Step 2: Update svelte.config.js**

Read the current `svelte.config.js`, then update the adapter import and config:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html' // SPA mode — all routes served by index.html
    })
  }
};

export default config;
```

- [ ] **Step 3: Run build to verify static output**

```bash
npm run build
```

Expected: Build succeeds. A `build/` directory is created with `index.html` and static assets.

- [ ] **Step 4: Preview the built app**

```bash
npm run preview
```

Open `http://localhost:4173`. Verify the full game flow works from the production build.

- [ ] **Step 5: Run all tests one final time**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Final commit**

```bash
git add package.json svelte.config.js
git commit -m "chore: switch to adapter-static for SPA deployment"
```

---

## Summary

| Chunk | Delivers |
|-------|----------|
| 1 | Pure logic tested, reactive store, localStorage |
| 2 | Full UI: player list, score entry, app shell |
| 3 | End round flow, winner detection, player management, static build |
