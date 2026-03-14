# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # Svelte type check
npm run lint         # ESLint
npm run test         # Run tests once
npm run test:watch   # Tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/lib/gameLogic.test.ts
```

## Architecture

**Flip 7 Scorecard** is a mobile-first SPA for tracking scores in the card game Flip 7. No backend — static site with localStorage persistence.

**Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript (strict), Tailwind CSS v4, Vitest, deployed via `adapter-static`.

### Key files

| File | Role |
|------|------|
| `src/lib/types.ts` | `Player` and `GameState` interfaces |
| `src/lib/gameLogic.ts` | Pure functions: `totalScore`, `getWinners`, `calcCardTotal` |
| `src/lib/gameLogic.test.ts` | Unit tests for all game logic |
| `src/lib/game.svelte.ts` | Svelte 5 `$state` store + mutations + localStorage persistence |
| `src/routes/+page.svelte` | App shell — player list, header, footer |
| `src/lib/components/PlayerRow.svelte` | Single player row with collapsible score input |
| `src/lib/components/ScoreInput.svelte` | Inline score entry (number input, Bust/Save, calculator trigger) |
| `src/lib/components/CardCalculator.svelte` | Modal: card buttons → calculates round score |

### State model

```typescript
type GameState = {
  players: Player[]
  scores: Record<string, (number | null)[]>  // scores[playerId][roundIndex]
  currentRound: number  // 0-indexed
}
```

All state lives in a single `$state` object exported from `game.svelte.ts`. Components import it directly — no prop drilling. Every mutation calls `persist()` which serialises to localStorage.

### Scoring rules

Round score = (sum of number cards 0–12) × (×2 modifier if held, else ×1) + flat bonuses (+2/+4/+6/+8/+10). Bust = 0. First player to 200+ cumulative wins.

### Game logic vs. UI state

Keep pure scoring/rule logic in `gameLogic.ts` (testable, no Svelte dependency). Mutations that touch game state live in `game.svelte.ts`.

## Docs

- `docs/PRD.md` — product requirements and user stories
- `docs/SDD.md` — software design document with state machine and persistence strategy
