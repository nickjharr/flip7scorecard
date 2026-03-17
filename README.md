# Flip 7 Scorecard

A mobile-first web app for tracking scores in the card game [Flip 7](https://www.amazon.com/dp/B0D7L1BKZK). Open it on your phone, add players, and start keeping score — no pen, no paper, no accounts.

**Live app:** https://flipping7.com

---

## Features

- Add and remove players at any time during a game
- Enter round scores in any order; edit them before ending the round
- One-tap **Bust** button (scores 0 for the round)
- **Card Calculator** — tap your cards to compute the round total automatically; slides up from the bottom
- **Flip 7 detection** — selecting all 7 number cards adds the +15 bonus, locks further number card selection, and shows a round-end reminder banner to other players
- Cumulative scores always visible; round history per player aligned by round and capped at the last 9
- Winner banner when a player reaches 200+
- Scores survive page refreshes via `localStorage`

## Scoring rules

| Element | Rule |
|---------|------|
| Number cards | Sum of all number cards (0–12) |
| ×2 modifier | Doubles the number card total if held |
| Flat bonuses | +2 / +4 / +6 / +8 / +10 added after multiplier |
| Flip 7 | Select all 7 number cards → +15 bonus, your turn ends |
| Bust | Round score = 0 |
| Win | First player to **200+ cumulative points** |

---

## Development

### Stack

- **SvelteKit 2** + **Svelte 5 runes**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Vitest**
- Deployed as a static site via `adapter-static` and GitHub Pages

### Getting started

```sh
npm install
npm run dev
```

### Commands

```sh
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run check        # Svelte type check
npm run lint         # ESLint
npm run test         # Run tests once
npm run test:watch   # Tests in watch mode
```

Run a single test file:

```sh
npx vitest run src/lib/gameLogic.test.ts
```

### Project structure

| File | Role |
|------|------|
| `src/lib/types.ts` | `Player` and `GameState` interfaces |
| `src/lib/gameLogic.ts` | Pure scoring functions (`totalScore`, `getWinners`, `calcCardTotal`) |
| `src/lib/gameLogic.test.ts` | Unit tests for all game logic |
| `src/lib/game.svelte.ts` | Svelte 5 `$state` store, mutations, and localStorage persistence |
| `src/routes/+page.svelte` | App shell — player list, header, footer |
| `src/lib/components/PlayerRow.svelte` | Single player row with collapsible score input |
| `src/lib/components/ScoreInput.svelte` | Inline score entry (number input, Bust/Save, calculator trigger) |
| `src/lib/components/CardCalculator.svelte` | Modal: tap cards to build a hand and calculate the round score |

---

## Deployment

Pushes to `master` automatically build and deploy to GitHub Pages via the workflow in `.github/workflows/`.
