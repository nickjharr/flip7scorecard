# Score History Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix score history chips in PlayerRow so each round's score visually aligns across all player rows.

**Architecture:** Pure presentational change — remove `flex-wrap` and add fixed-width chips in the history row of `PlayerRow.svelte`. No logic, state, or type changes required.

**Tech Stack:** SvelteKit 2 + Svelte 5, Tailwind CSS v4, Vitest

---

## Chunk 1: Create a feature branch and make the fix

**Spec:** `docs/superpowers/specs/2026-03-15-score-history-alignment-design.md`

### Task 1: Create feature branch

**Files:**
- No file changes — git only

- [ ] **Step 1: Create and checkout feature branch**

```bash
git checkout -b feat/SE-23-align-score-history
```

Expected: `Switched to a new branch 'feat/SE-23-align-score-history'`

---

### Task 2: Fix score history alignment in PlayerRow

**Files:**
- Modify: `src/lib/components/PlayerRow.svelte:95-103`

The current block (lines 95–103):

```svelte
{#if cumulativeHistory.length > 0}
  <div class="flex flex-wrap gap-1.5 mt-0.5">
    {#each cumulativeHistory as total, i (i)}
      <span class="text-xs text-gray-400 line-through">
        {total}
      </span>
    {/each}
  </div>
{/if}
```

- [ ] **Step 1: Update the history container and chip classes**

Replace the block above with:

```svelte
{#if cumulativeHistory.length > 0}
  <div class="flex flex-nowrap overflow-x-auto mt-0.5">
    {#each cumulativeHistory as total, i (i)}
      <span class="w-9 min-w-9 text-xs text-gray-400 line-through text-center">
        {total}
      </span>
    {/each}
  </div>
{/if}
```

Key changes:
- `flex-wrap` → `flex-nowrap` — prevents chips wrapping to a second line
- `overflow-x-auto` — allows horizontal scroll when rounds exceed row width
- `gap-1.5` removed — spacing comes from the fixed chip width
- Each chip: `w-9 min-w-9 text-center` — 36px fixed width, centred text

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
npm run test
```

Expected: all tests pass (no logic was changed)

- [ ] **Step 3: Run type check**

```bash
npm run check
```

Expected: no errors

- [ ] **Step 4: Run the dev server and manually verify alignment**

```bash
npm run dev
```

Open the app, add 2–3 players, play through 4–5 rounds, and confirm:
- Each round's score sits at the same horizontal position across all player rows
- Three-digit values (100+) are not clipped
- The history row does not push the amber total score off-screen (it scrolls within its container)

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/PlayerRow.svelte
git commit -m "fix: align score history chips by round (SE-23)"
```

- [ ] **Step 6: Push branch and open PR**

```bash
git push -u origin feat/SE-23-align-score-history
```

Then create a PR against `master` with title: `fix: align score history by round (SE-23)`
