<script lang="ts">
  import type { Player } from '$lib/types';
  import { setScore } from '$lib/game.svelte';
  import CardCalculator from './CardCalculator.svelte';

  let {
    player,
    currentRoundScore,
  }: {
    player: Player;
    currentRoundScore: number | null;
  } = $props();

  // Pre-populate with existing score if present
  let inputValue = $state(currentRoundScore !== null ? String(currentRoundScore) : '');
  let calculatorOpen = $state(false);

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
    onfocus={(e) => (e.target as HTMLInputElement).select()}
    class="w-24 bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-center tabular-nums focus:outline-none"
  />

  <button
    onclick={() => (calculatorOpen = true)}
    class="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
  >
    🃏 Calc
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
    onApply={(total) => {
      inputValue = String(total);
      calculatorOpen = false;
    }}
    onBust={() => {
      handleBust();
      calculatorOpen = false;
    }}
  />
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
