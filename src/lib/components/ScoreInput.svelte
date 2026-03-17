<script lang="ts">
  import type { Player } from '$lib/types';
  import { setScore, setFlip7Banner } from '$lib/game.svelte';
  import CardCalculator from './CardCalculator.svelte';
  import { untrack } from 'svelte';

  let {
    player,
    currentRoundScore,
    onSave = () => {},
  }: {
    player: Player;
    currentRoundScore: number | null;
    onSave?: () => void;
  } = $props();

  // Pre-populate with existing score if present
  let inputValue = $state(untrack(() => currentRoundScore !== null ? String(currentRoundScore) : ''));
  let calculatorOpen = $state(false);
  let pendingFlip7Score = $state<number | null>(null);
  let showFlip7Confirm = $state(false);

  function handleSave() {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 0) return;
    if (pendingFlip7Score !== null) {
      showFlip7Confirm = true;
      return;
    }
    commitSave(parsed);
  }

  function commitSave(score: number) {
    setScore(player.id, score);
    onSave();
  }

  function confirmFlip7Save() {
    if (pendingFlip7Score === null) return;
    setScore(player.id, pendingFlip7Score);
    setFlip7Banner(true);
    pendingFlip7Score = null;
    showFlip7Confirm = false;
    onSave();
  }

  function handleBust() {
    inputValue = '0';
    setScore(player.id, 0);
    onSave();
  }
</script>

<div class="flex items-center gap-2 px-1">
  <input
    type="number"
    inputmode="numeric"
    min="0"
    aria-label="Score"
    placeholder="Score"
    bind:value={inputValue}
    onfocus={(e) => (e.target as HTMLInputElement).select()}
    class="w-24 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg px-3 py-2 text-base text-center tabular-nums focus:outline-none"
  />

  <button
    type="button"
    onclick={() => (calculatorOpen = true)}
    class="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
  >
    🧮 Calc
  </button>

  <button
    onclick={handleBust}
    class="px-3 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-sm font-medium transition-colors"
  >
    Bust
  </button>

  <button
    onclick={handleSave}
    disabled={!String(inputValue).trim() || isNaN(parseInt(String(inputValue), 10))}
    class="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
  >
    ✓ Save
  </button>
</div>

{#if calculatorOpen}
  <CardCalculator
    onApply={(total, isFlip7) => {
      inputValue = String(total);
      calculatorOpen = false;
      if (isFlip7) {
        pendingFlip7Score = total;
        showFlip7Confirm = true;
      } else {
        commitSave(total);
      }
    }}
    onBust={() => {
      handleBust();
      calculatorOpen = false;
    }}
    onDismiss={() => (calculatorOpen = false)}
  />
{/if}

{#if showFlip7Confirm}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-30 px-6">
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-white">
      <p class="text-center text-lg font-semibold mb-1">🎴 Flip 7!</p>
      <p class="text-center text-sm text-gray-400 mb-5">
        Saving this score ends your turn for this round. Other players still need to enter their scores.
      </p>
      <div class="flex gap-3">
        <button
          onclick={() => { showFlip7Confirm = false; }}
          class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={confirmFlip7Save}
          class="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-semibold transition-colors"
        >
          Save Score
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type='number'] {
    appearance: textfield;
    -moz-appearance: textfield;
  }
</style>
