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

  // Cumulative totals at the end of each previous round
  const cumulativeHistory = $derived(
    scores.slice(0, Math.max(0, currentRound - 1)).map((_, i) =>
      scores.slice(0, i + 1).reduce<number>((sum, s) => sum + (s ?? 0), 0)
    )
  );

  // Score for the current round
  const currentRoundScore = $derived(scores[currentRound] ?? null);

  const rowGlowStyle = $derived(
    currentRoundScore === null
      ? ''
      : currentRoundScore > 0
        ? 'box-shadow: 0 0 0 2px #16a34a, 0 0 12px rgba(22,163,74,0.4); background: #1a2e22'
        : 'box-shadow: 0 0 0 2px #dc2626, 0 0 12px rgba(220,38,38,0.4); background: #2a1a1a'
  );

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
<div class="border-b border-gray-800 last:border-0 rounded-lg transition-all duration-300 mb-3" style={rowGlowStyle}>

  <!-- Main row (tap to expand) -->
  <button
    class="w-full flex items-center gap-3 px-3 py-3 text-left"
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
          class="bg-gray-800 border border-blue-500 rounded px-2 py-0.5 text-base w-full focus:outline-none"
          autofocus
        />
      {:else}
        <span class="text-sm font-medium">{player.name}</span>
      {/if}

      <!-- Score history: cumulative total at end of each previous round -->
      {#if cumulativeHistory.length > 0}
        <div class="flex flex-wrap gap-1.5 mt-0.5">
          {#each cumulativeHistory as total, i (i)}
            <span class="text-xs text-gray-400 line-through">
              {total}
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Current round pending indicator -->
    <span class="text-xs text-gray-400 w-5 text-center">
      {currentRoundScore !== null ? '' : '--'}
    </span>

    <!-- Cumulative total -->
    <span class="text-lg font-bold text-amber-400 w-12 text-right tabular-nums">
      {cumulative}
    </span>

    <!-- Expand chevron -->
    <span class="text-gray-400 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
  </button>

  <!-- Expanded: inline score input -->
  {#if isExpanded}
    <div class="px-3 pb-3">
      <ScoreInput {player} {currentRoundScore} onSave={onExpand} />
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
