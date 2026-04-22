<script lang="ts">
  import { calcCardTotal, FLIP_7_CARD_COUNT, FLIP_7_BONUS } from '$lib/gameLogic';
  import { vengeanceMode, setVengeanceMode } from '$lib/game.svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut, cubicIn } from 'svelte/easing';

  let {
    onApply,
    onBust,
    onDismiss,
  }: {
    onApply: (total: number, isFlip7: boolean) => void;
    onBust: () => void;
    onDismiss: () => void;
  } = $props();

  // --- Selection state (resets each time modal mounts or mode switches) ---
  let selectedNumbers = $state<number[]>([]);
  let selectedModifiers = $state<number[]>([]);
  let multiplierSelected = $state(false);

  // --- Card sets derived from mode ---
  const NUMBER_CARDS = $derived(
    vengeanceMode.active
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  );
  const MODIFIER_CARDS = $derived(
    vengeanceMode.active ? [-2, -4, -6, -8, -10] : [2, 4, 6, 8, 10]
  );

  function switchMode(val: boolean) {
    setVengeanceMode(val);
    selectedNumbers = [];
    selectedModifiers = [];
    multiplierSelected = false;
  }

  function toggleNumber(n: number) {
    if (vengeanceMode.active && n === 13) {
      const count = selectedNumbers.filter((x) => x === 13).length;
      if (count < 2) {
        selectedNumbers = [...selectedNumbers, 13];
      } else {
        selectedNumbers = selectedNumbers.filter((x) => x !== 13);
      }
      return;
    }
    selectedNumbers = selectedNumbers.includes(n)
      ? selectedNumbers.filter((x) => x !== n)
      : [...selectedNumbers, n];
  }

  function toggleModifier(m: number) {
    selectedModifiers = selectedModifiers.includes(m)
      ? selectedModifiers.filter((x) => x !== m)
      : [...selectedModifiers, m];
  }

  // --- Flip 7 detection: 7 DIFFERENT number cards ---
  const isFlip7 = $derived(new Set(selectedNumbers).size === FLIP_7_CARD_COUNT);

  // --- Multiplier for calcCardTotal ---
  const multiplier: 'x2' | 'div2' | null = $derived(
    multiplierSelected ? (vengeanceMode.active ? 'div2' : 'x2') : null
  );

  // --- Derived total ---
  const total = $derived(
    calcCardTotal(selectedNumbers, selectedModifiers, multiplier) + (isFlip7 ? FLIP_7_BONUS : 0)
  );

  // --- Formula breakdown string ---
  const breakdown = $derived.by(() => {
    const numSum = selectedNumbers.reduce((a, b) => a + b, 0);
    const modSum = selectedModifiers.reduce((a, b) => a + b, 0);

    const count13 = vengeanceMode.active
      ? selectedNumbers.filter((x) => x === 13).length
      : 0;
    const otherNumbers = vengeanceMode.active
      ? selectedNumbers.filter((x) => x !== 13)
      : selectedNumbers;

    const allDisplayNums =
      count13 === 2
        ? [...otherNumbers, 13, 13]
        : count13 === 1
          ? [...otherNumbers, 13]
          : otherNumbers;

    const numberPart =
      allDisplayNums.length === 0
        ? ''
        : multiplierSelected && allDisplayNums.length > 1
          ? `(${allDisplayNums.join('+')})`
          : `${numSum}`;

    const multiplierPart =
      multiplierSelected && allDisplayNums.length > 0
        ? vengeanceMode.active
          ? ' ÷ 2'
          : ' × 2'
        : '';

    const modifierPart =
      selectedModifiers.length === 0
        ? ''
        : numberPart || multiplierPart
          ? modSum >= 0
            ? ` + ${modSum}`
            : ` - ${Math.abs(modSum)}`
          : `${modSum}`;

    const flip7Part = isFlip7 ? ` + ${FLIP_7_BONUS} (Flip 7!)` : '';

    return `${numberPart}${multiplierPart}${modifierPart}${flip7Part}`;
  });

  // --- Lucky 13 button state helper ---
  function count13(): number {
    return selectedNumbers.filter((x) => x === 13).length;
  }
</script>

<!-- Fixed overlay backdrop — tap outside to dismiss -->
<div transition:fade={{ duration: 250 }} class="fixed inset-0 z-40 bg-black/50" role="presentation" onclick={onDismiss} onkeydown={(e) => e.key === 'Escape' && onDismiss()}></div>

<!-- Bottom sheet panel -->
<div
  in:fly={{ y: 600, duration: 320, easing: cubicOut }}
  out:fly={{ y: 600, duration: 250, easing: cubicIn }}
  class="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-gray-900 border-t border-gray-700 p-5"
  role="dialog" aria-modal="true" aria-labelledby="card-calculator-title"
>
  <!-- Drag handle — tap to dismiss -->
  <div class="flex justify-center mb-4">
    <button
      type="button"
      onclick={onDismiss}
      aria-label="Dismiss calculator"
      class="cursor-pointer p-2 -m-2"
    >
      <div class="w-8 h-1 rounded-full bg-gray-600" aria-hidden="true"></div>
    </button>
  </div>

  <!-- Header: title + mode toggle + Bust -->
  <div class="flex items-start justify-between mb-4">
    <div>
      <p id="card-calculator-title" class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Card Calculator</p>
      <p class="text-3xl font-bold {total < 0 ? 'text-red-400' : 'text-amber-400'} leading-none">{total}</p>
      {#if breakdown}
        <p class="text-xs text-gray-500 mt-0.5">{breakdown}</p>
      {/if}
    </div>
    <div class="flex flex-col items-end gap-2">
      <!-- Mode toggle pill -->
      <div class="flex rounded-lg border border-gray-600 overflow-hidden text-xs font-semibold">
        <button
          type="button"
          onclick={() => switchMode(false)}
          aria-pressed={!vengeanceMode.active}
          class="px-3 py-1.5 transition-colors {!vengeanceMode.active ? 'bg-amber-400 text-gray-900' : 'bg-transparent text-gray-400 hover:text-gray-200'}"
        >
          Base
        </button>
        <button
          type="button"
          onclick={() => switchMode(true)}
          aria-pressed={vengeanceMode.active}
          class="px-3 py-1.5 transition-colors {vengeanceMode.active ? 'bg-red-500 text-white' : 'bg-transparent text-gray-400 hover:text-gray-200'}"
        >
          Vengeance
        </button>
      </div>
      <button
        type="button"
        onclick={onBust}
        class="border border-red-600 text-red-400 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-red-950 transition-colors"
      >
        Bust
      </button>
    </div>
  </div>

  <!-- Flip 7 badge -->
  {#if isFlip7}
    <div class="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-400/10 border border-amber-400/40 rounded-xl">
      <span class="text-amber-400 font-bold text-sm">🎴 Flip 7! +15 bonus applied</span>
    </div>
  {/if}

  <!-- Number cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Number Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each NUMBER_CARDS as n (n)}
      {#if vengeanceMode.active && n === 13}
        {@const c = count13()}
        <button
          type="button"
          onclick={() => toggleNumber(13)}
          disabled={isFlip7 && c === 0}
          class="relative rounded-full px-3 py-1.5 text-sm font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed
            {c > 0
              ? 'bg-amber-400 text-gray-900 border-amber-400'
              : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
        >
          13
          {#if c === 2}
            <span class="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">×2</span>
          {/if}
        </button>
      {:else}
        <button
          type="button"
          onclick={() => toggleNumber(n)}
          disabled={isFlip7 && !selectedNumbers.includes(n)}
          class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed
            {selectedNumbers.includes(n)
              ? 'bg-amber-400 text-gray-900 border-amber-400'
              : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
        >
          {n}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Modifier cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Modifier Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each MODIFIER_CARDS as m (m)}
      <button
        type="button"
        onclick={() => toggleModifier(m)}
        class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors
          {selectedModifiers.includes(m)
            ? 'bg-amber-400 text-gray-900 border-amber-400'
            : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
      >
        {m > 0 ? `+${m}` : `${m}`}
      </button>
    {/each}
  </div>

  <!-- Multiplier -->
  <div class="flex items-center gap-3 mb-5">
    <button
      type="button"
      onclick={() => (multiplierSelected = !multiplierSelected)}
      class="rounded-full px-4 py-1.5 text-sm font-bold border transition-colors
        {multiplierSelected
          ? 'bg-purple-600 text-white border-purple-600'
          : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
    >
      {vengeanceMode.active ? '÷2' : '✕2'}
    </button>
    <span class="text-xs text-gray-500">
      {vengeanceMode.active ? 'halves your number total' : 'doubles your number total'}
    </span>
  </div>

  <!-- Apply button -->
  <button
    type="button"
    onclick={() => onApply(total, isFlip7)}
    class="w-full rounded-xl bg-amber-400 text-gray-900 font-bold py-3 text-base hover:bg-amber-300 transition-colors"
  >
    Apply {total}
  </button>
</div>
