import type { GameState, Player } from './types';

export const FLIP_7_CARD_COUNT = 7;
export const FLIP_7_BONUS = 15;

/** Sum of all non-null scores for a player. */
export function totalScore(
  scores: Record<string, (number | null)[]>,
  playerId: string
): number {
  const playerScores = scores[playerId] ?? [];
  return playerScores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
}

/**
 * Returns the player(s) with the highest total score if any player
 * has reached 200+. Returns null if no player has reached 200 yet.
 */
export function getWinners(state: GameState): Player[] | null {
  const totals = state.players.map((p) => ({
    player: p,
    total: totalScore(state.scores, p.id),
  }));

  const max = Math.max(...totals.map((t) => t.total));

  if (max < 200) return null;

  return totals.filter((t) => t.total === max).map((t) => t.player);
}

/** Create a fresh empty game state. */
export function createEmptyGame(): GameState {
  return { players: [], scores: {}, currentRound: 0 };
}

/**
 * Calculates the score for a hand of Flip 7 cards.
 * x2 applies only to the number card total, not modifiers.
 * div2 halves the number card total (floor), not modifiers.
 */
export function calcCardTotal(
  numbers: number[],
  modifiers: number[],
  multiplier: 'x2' | 'div2' | null
): number {
  const numSum = numbers.reduce((a, b) => a + b, 0);
  const modSum = modifiers.reduce((a, b) => a + b, 0);
  let result = numSum;
  if (multiplier === 'x2') result *= 2;
  else if (multiplier === 'div2') result = Math.floor(result / 2);
  return result + modSum;
}
