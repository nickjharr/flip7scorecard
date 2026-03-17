<script lang="ts">
  import type { Player } from '$lib/types';
  import { removePlayer, renamePlayer } from '$lib/game.svelte';
  import ScoreInput from './ScoreInput.svelte';
  import { untrack } from 'svelte';

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
  let renameValue = $state(untrack(() => player.name));

  // Swipe-to-remove state
  let swipeOffset = $state(0);        // current translateX px, range 0 to -72
  let swipeLocked = $state(false);    // true when row is snapped open at -72px
  let touchStartX = 0;                // plain vars — no reactive binding needed
  let touchStartY = 0;
  let isSwipeGesture = $state(false);
  let rowContentEl: HTMLDivElement;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

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

  function handleTouchStart(e: TouchEvent) {
    // Always reset gesture state, even if we bail early
    isSwipeGesture = false;

    // If touch starts inside score history, skip swipe tracking — let it scroll
    if ((e.target as Element).closest('.score-history')) {
      touchStartX = 0;
      touchStartY = 0;
      return;
    }

    // Cancel any pending long-press — a swipe gesture is starting
    cancelLongPress();

    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function handleTouchMove(e: TouchEvent) {
    const t = e.touches[0];
    const deltaX = t.clientX - touchStartX;
    const deltaY = t.clientY - touchStartY;

    // Left swipe from unlocked state
    if (!isSwipeGesture && !swipeLocked && Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
      isSwipeGesture = true;
      cancelLongPress();
    }

    // Right swipe from locked state — drag back to close
    if (!isSwipeGesture && swipeLocked && Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
      isSwipeGesture = true;
      cancelLongPress();
    }

    if (isSwipeGesture) {
      e.preventDefault(); // works because listener is registered with { passive: false }
      if (swipeLocked) {
        swipeOffset = Math.min(0, -72 + deltaX);
      } else {
        swipeOffset = Math.max(-72, Math.min(0, deltaX));
      }
    }
  }

  function handleTouchEnd() {
    if (!isSwipeGesture) return;
    if (swipeLocked) {
      if (swipeOffset > -40) {
        swipeOffset = 0;
        swipeLocked = false;
      } else {
        swipeOffset = -72;
      }
    } else {
      if (swipeOffset < -40) {
        swipeOffset = -72;
        swipeLocked = true;
      } else {
        swipeOffset = 0;
      }
    }
    isSwipeGesture = false;
  }

  function handleContentClick(e: MouseEvent) {
    if (swipeLocked) {
      e.stopPropagation();
      swipeOffset = 0;
      swipeLocked = false;
    }
  }

  function handleRowTouchStart() {
    longPressTimer = setTimeout(() => {
      showActions = true;
      longPressTimer = null;
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  // Must be registered with { passive: false } to allow e.preventDefault() during swipe
  $effect(() => {
    if (!rowContentEl) return;
    rowContentEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => rowContentEl.removeEventListener('touchmove', handleTouchMove);
  });

  // Reset swipe state when rename input or action sheet opens
  $effect(() => {
    if (isRenaming || showActions) {
      swipeOffset = 0;
      swipeLocked = false;
    }
  });
</script>

<!-- Row container — relative+overflow-hidden required for swipe reveal -->
<div class="relative overflow-hidden border-b border-gray-800 last:border-0 rounded-lg transition-all duration-300 mb-3" style={rowGlowStyle}>

  <!-- Red remove strip — sits behind the sliding content -->
  <div class="absolute inset-y-0 right-0 w-[72px] bg-red-600 flex items-center justify-center text-xl"
       role="button"
       tabindex="-1"
       aria-label="Remove {player.name}"
       onclick={handleRemove}
       onkeydown={(e) => e.key === 'Enter' && handleRemove()}>
    🗑️
  </div>

  <!-- Inner sliding content — role=presentation: structural wrapper, not interactive -->
  <div
    role="presentation"
    bind:this={rowContentEl}
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    onclick={handleContentClick}
    style="transform: translateX({swipeOffset}px); transition: {isSwipeGesture ? 'none' : 'transform 150ms ease'}"
  >

  <!-- Main row (tap to expand) -->
  <button
    class="w-full flex items-center gap-3 px-3 py-3 text-left"
    onclick={onExpand}
    ontouchstart={handleRowTouchStart}
    ontouchend={cancelLongPress}
    oncontextmenu={(e) => { e.preventDefault(); handleLongPress(); }}
  >
    <!-- Player name + history -->
    <div class="flex-1 min-w-0">
      {#if isRenaming}
        <!-- svelte-ignore a11y_autofocus -->
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
        <div class="score-history flex flex-nowrap overflow-x-auto mt-0.5">
          {#each cumulativeHistory.slice(-9) as total, i (i)}
            <span class="w-9 shrink-0 text-xs text-gray-400 line-through text-center tabular-nums">
              {total}
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Current round score (red for bust, blue when saved, -- when pending) -->
    <span class="text-sm tabular-nums w-10 text-center {currentRoundScore === null ? 'text-gray-400' : currentRoundScore === 0 ? 'text-red-400 font-semibold' : 'text-blue-400 font-semibold'}">
      {currentRoundScore !== null ? currentRoundScore : '--'}
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

  </div> <!-- end inner sliding content -->
</div>   <!-- end outer row container -->

<!-- Actions overlay (rename / remove) -->
{#if showActions}
  <div
    class="fixed inset-0 bg-black/60 z-10 flex items-end"
    onclick={() => (showActions = false)}
    onkeydown={(e) => e.key === 'Escape' && (showActions = false)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="w-full bg-gray-900 rounded-t-2xl p-4"
      role="none"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
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
