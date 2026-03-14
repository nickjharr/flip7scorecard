<script lang="ts">
  import { calcCardTotal } from '$lib/gameLogic';

  let {
    onApply,
    onBust,
  }: {
    onApply: (total: number) => void;
    onBust: () => void;
  } = $props();

  // --- Selection state (resets each time modal mounts) ---
  let selectedNumbers = $state<number[]>([]);
  let selectedModifiers = $state<number[]>([]);
  let x2Selected = $state(false);

  const NUMBER_CARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MODIFIER_CARDS = [2, 4, 6, 8, 10];

  function toggleNumber(n: number) {
    selectedNumbers = selectedNumbers.includes(n)
      ? selectedNumbers.filter((x) => x !== n)
      : [...selectedNumbers, n];
  }

  function toggleModifier(m: number) {
    selectedModifiers = selectedModifiers.includes(m)
      ? selectedModifiers.filter((x) => x !== m)
      : [...selectedModifiers, m];
  }

  // --- Derived total ---
  let total = $derived(calcCardTotal(selectedNumbers, selectedModifiers, x2Selected));

  // --- Formula breakdown string ---
  let breakdown = $derived((() => {
    const numSum = selectedNumbers.reduce((a, b) => a + b, 0);
    const modSum = selectedModifiers.reduce((a, b) => a + b, 0);

    const numberPart =
      selectedNumbers.length === 0
        ? ''
        : x2Selected && selectedNumbers.length > 1
          ? `(${selectedNumbers.join('+')})`
          : `${numSum}`;

    const multiplierPart = x2Selected && selectedNumbers.length > 0 ? ' × 2' : '';

    const modifierPart =
      selectedModifiers.length === 0
        ? ''
        : numberPart || multiplierPart
          ? ` + ${modSum}`
          : `+${modSum}`;

    return `${numberPart}${multiplierPart}${modifierPart}`;
  })());
</script>

<!-- Fixed overlay backdrop (no close-on-click — Apply/Bust are the only exits) -->
<div class="fixed inset-0 z-40 bg-black/50"></div>

<!-- Bottom sheet panel -->
<div class="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-gray-900 border-t border-gray-700 p-5">
  <!-- Drag handle (decorative) -->
  <div class="flex justify-center mb-4">
    <div class="w-8 h-1 rounded-full bg-gray-600"></div>
  </div>

  <!-- Header: title + Bust -->
  <div class="flex items-start justify-between mb-4">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Card Calculator</p>
      <p class="text-3xl font-bold text-amber-400 leading-none">{total}</p>
      {#if breakdown}
        <p class="text-xs text-gray-500 mt-0.5">{breakdown}</p>
      {/if}
    </div>
    <button
      onclick={onBust}
      class="border border-red-600 text-red-400 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-red-950 transition-colors"
    >
      Bust
    </button>
  </div>

  <!-- Number cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Number Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each NUMBER_CARDS as n}
      <button
        onclick={() => toggleNumber(n)}
        class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors
          {selectedNumbers.includes(n)
            ? 'bg-amber-400 text-gray-900 border-amber-400'
            : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
      >
        {n}
      </button>
    {/each}
  </div>

  <!-- Modifier cards -->
  <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Modifier Cards</p>
  <div class="flex flex-wrap gap-2 mb-4">
    {#each MODIFIER_CARDS as m}
      <button
        onclick={() => toggleModifier(m)}
        class="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors
          {selectedModifiers.includes(m)
            ? 'bg-amber-400 text-gray-900 border-amber-400'
            : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
      >
        +{m}
      </button>
    {/each}
  </div>

  <!-- X2 multiplier -->
  <div class="flex items-center gap-3 mb-5">
    <button
      onclick={() => (x2Selected = !x2Selected)}
      class="rounded-full px-4 py-1.5 text-sm font-bold border transition-colors
        {x2Selected
          ? 'bg-purple-600 text-white border-purple-600'
          : 'bg-transparent text-gray-400 border-gray-600 hover:border-gray-400'}"
    >
      ✕2
    </button>
    <span class="text-xs text-gray-500">doubles your number total</span>
  </div>

  <!-- Apply button -->
  <button
    onclick={() => onApply(total)}
    class="w-full rounded-xl bg-amber-400 text-gray-900 font-bold py-3 text-base hover:bg-amber-300 transition-colors"
  >
    Apply {total}
  </button>
</div>
