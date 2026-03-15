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

<div class="h-dvh bg-gray-950 text-white flex flex-col max-w-lg mx-auto">
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
      <p class="text-gray-400 text-sm text-center mt-8">Add players below to start tracking scores.</p>
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
  <footer class="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-800 flex flex-col gap-2">
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
          class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500"
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
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-white">
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
    <div class="bg-gray-900 rounded-2xl p-8 w-full max-w-sm text-center text-white">
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
