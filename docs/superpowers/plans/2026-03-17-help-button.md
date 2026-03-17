# Help Button Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `?` help button to the app header that opens a modal with usage instructions, external links, and copyright information.

**Architecture:** New `HelpModal.svelte` component follows the existing centered-dialog pattern. State (`showHelp`) lives in `+page.svelte`. No game store changes.

**Tech Stack:** SvelteKit 2, Svelte 5 runes (`$state`, `$props`, `$effect`), TypeScript, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-03-17-help-button-design.md`

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Create | `src/lib/components/HelpModal.svelte` | New modal component |
| Modify | `src/routes/+page.svelte` | Add `showHelp` state, `?` button in header, render `<HelpModal>` |

---

## Task 1: Create `HelpModal.svelte`

**Files:**
- Create: `src/lib/components/HelpModal.svelte`

- [ ] **Step 1: Create the component file**

Create `src/lib/components/HelpModal.svelte` with the following content:

```svelte
<script lang="ts">
  let { onDismiss }: { onDismiss: () => void } = $props();

  // Capture before any focus shifts (component initialisation time, not effect time)
  const previousFocus = document.activeElement;
  let panelEl: HTMLElement;

  $effect(() => {
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
```

- [ ] **Step 2: Run type check to verify no errors**

```bash
npm run check
```

Expected: no errors relating to `HelpModal.svelte`.

---

## Task 2: Wire `HelpModal` into `+page.svelte`

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add the import and `showHelp` state**

In `+page.svelte`, after the existing imports, add:

```svelte
import HelpModal from '$lib/components/HelpModal.svelte';
```

Add alongside the existing `$state` declarations (note: `expandedPlayerId` already exists on line 6 — do not re-declare it):

```svelte
let showHelp = $state(false);
```

- [ ] **Step 2: Update the header markup**

Replace the existing header `<button>` (New Game only) with a grouped right-side div:

Current:
```svelte
<header class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
  <h1 class="text-xl font-bold tracking-tight">Flip 7 Scorecard</h1>
  <button
    onclick={() => (showNewGameConfirm = true)}
    class="text-sm text-gray-400 hover:text-white transition-colors"
  >
    New Game
  </button>
</header>
```

Replace with:
```svelte
<header class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
  <h1 class="text-xl font-bold tracking-tight">Flip 7 Scorecard</h1>
  <div class="flex gap-3">
    <button
      onclick={() => { showHelp = true; expandedPlayerId = null; }}
      aria-label="Help"
      class="text-sm text-gray-400 hover:text-white transition-colors"
    >
      ?
    </button>
    <button
      onclick={() => (showNewGameConfirm = true)}
      class="text-sm text-gray-400 hover:text-white transition-colors"
    >
      New Game
    </button>
  </div>
</header>
```

- [ ] **Step 3: Add `<HelpModal>` conditional render**

Add the following block after line 151 (the `{/if}` that closes the `showNewGameConfirm` block), and before the winner banner block (`{#if winners}` which uses `z-20`):

```svelte
{#if showHelp}
  <HelpModal onDismiss={() => (showHelp = false)} />
{/if}
```

- [ ] **Step 4: Run type check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: no warnings or errors.

---

## Task 3: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the following behaviours**

- `?` button appears in the header to the left of "New Game"
- Tapping `?` opens the help modal
- Modal contains all 6 instruction bullets, both links, copyright line, and a Close button
- Tapping Close dismisses the modal
- Tapping outside the panel (backdrop) dismisses the modal
- Pressing Escape dismisses the modal
- If a player row is expanded with the score input open, tapping `?` collapses it before opening the modal
- Both external links open in a new tab

- [ ] **Step 3: Stop dev server, run tests to confirm nothing broken**

```bash
npm run test
```

Expected: all existing tests pass.

---

## Task 4: Commit and push

- [ ] **Step 1: Stage files**

```bash
git add src/lib/components/HelpModal.svelte src/routes/+page.svelte docs/superpowers/specs/2026-03-17-help-button-design.md docs/superpowers/plans/2026-03-17-help-button.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add help button and modal (closes #35)"
```

- [ ] **Step 3: Push**

```bash
git push
```

---

## Task 5: Raise PR

- [ ] **Step 1: Create PR via gh**

```bash
gh pr create \
  --title "feat: add help button (#35)" \
  --body "$(cat <<'EOF'
## Summary

- Adds a `?` button to the app header (left of New Game)
- Opens a centered modal with usage instructions, links to the Flip 7 rules and GitHub repo, and copyright info
- Follows existing modal patterns; full ARIA accessibility with focus management

Closes #35
EOF
)"
```
