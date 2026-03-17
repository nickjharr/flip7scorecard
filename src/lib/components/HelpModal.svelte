<script lang="ts">
  let { onDismiss }: { onDismiss: () => void } = $props();

  let previousFocus: Element | null = null;
  let panelEl: HTMLElement;

  $effect(() => {
    previousFocus = document.activeElement;
    panelEl.focus();
    return () => {
      (previousFocus as HTMLElement | null)?.focus();
    };
  });
</script>

<!-- Backdrop (no keyboard handler — panel has tabindex="-1" and handles Escape) -->
<div
  class="fixed inset-0 bg-black/70 flex items-center justify-center z-10 px-6"
  role="presentation"
  onclick={onDismiss}
>
  <!-- Panel — stopPropagation prevents backdrop click from firing inside panel -->
  <div
    bind:this={panelEl}
    class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-white overflow-y-auto max-h-[80vh]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-modal-title"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === 'Escape' && onDismiss()}
  >
    <h2 id="help-modal-title" class="text-lg font-semibold mb-4">How to Play</h2>

    <ul class="text-sm text-gray-300 space-y-2 list-disc list-inside mb-5">
      <li>Add up to 12 players using the input at the bottom</li>
      <li>Tap a player row to enter their score for the round</li>
      <li>Use the card calculator 🧮 to total your hand from individual cards</li>
      <li>Tap <strong class="text-white">Bust</strong> if a player busted this round (score = 0)</li>
      <li>Hit <strong class="text-white">End Round</strong> when all players have scored</li>
      <li>First player to reach 200+ cumulative points wins</li>
    </ul>

    <div class="flex flex-col gap-2 mb-5 text-sm">
      <a
        href="https://theop.games/pages/flip-7"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-400 hover:text-blue-300 transition-colors"
      >
        Full Flip 7 rules ↗
      </a>
      <a
        href="https://github.com/nickjharr/flip7scorecard"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-400 hover:text-blue-300 transition-colors"
      >
        View source on GitHub ↗
      </a>
    </div>

    <p class="text-xs text-gray-500 mb-5">© 2026 Nick Harrington</p>

    <button
      type="button"
      onclick={onDismiss}
      class="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
    >
      Close
    </button>
  </div>
</div>
