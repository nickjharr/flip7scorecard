import { browser } from '$app/environment';
import { createEmptyGame, totalScore, getWinners } from './gameLogic';
import type { GameState } from './types';

const STORAGE_KEY = 'flip7_game';

// Load from localStorage on startup, or start fresh.
function loadInitialState(): GameState {
  if (!browser) return createEmptyGame();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyGame();
    const parsed = JSON.parse(raw) as unknown;
    // Validate required shape
    if (
      parsed &&
      typeof parsed === 'object' &&
      'players' in parsed &&
      'scores' in parsed &&
      'currentRound' in parsed
    ) {
      return parsed as GameState;
    }
  } catch {
    // Ignore malformed data
  }
  return createEmptyGame();
}

// The reactive game state — Svelte 5 tracks mutations automatically.
export const game = $state<GameState>(loadInitialState());

// Write current state to localStorage.
function persist() {
  if (browser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }
}

export function addPlayer(name: string): void {
  const id = crypto.randomUUID();
  game.players.push({ id, name });
  game.scores[id] = [];
  persist();
}

export function removePlayer(id: string): void {
  game.players = game.players.filter((p) => p.id !== id);
  delete game.scores[id];
  persist();
}

export function renamePlayer(id: string, name: string): void {
  const player = game.players.find((p) => p.id === id);
  if (player) {
    player.name = name;
    persist();
  }
}

// Bust is a UI shortcut — callers pass 0.
export function setScore(playerId: string, score: number): void {
  const playerScores = game.scores[playerId];
  if (!playerScores) return;
  // Extend array to current round if needed
  while (playerScores.length <= game.currentRound) {
    playerScores.push(null);
  }
  playerScores[game.currentRound] = score;
  persist();
}

// Flip 7 banner — true when a player has flipped 7 this round
export const flip7Banner = $state({ active: false });

export function setFlip7Banner(val: boolean): void {
  flip7Banner.active = val;
}

export function endRound(): void {
  // Fill any missing scores with 0 before advancing
  for (const player of game.players) {
    const playerScores = game.scores[player.id];
    if (!playerScores) continue;
    if ((playerScores[game.currentRound] ?? null) === null) {
      setScore(player.id, 0);
    }
  }
  flip7Banner.active = false;
  game.currentRound += 1;
  persist();
}

export function newGame(): void {
  const empty = createEmptyGame();
  game.players = empty.players;
  game.scores = empty.scores;
  game.currentRound = empty.currentRound;
  flip7Banner.active = false;
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Re-export derived helpers for convenience in components.
export { totalScore, getWinners };
