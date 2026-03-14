import type { GameState, Player } from './types';

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
 * X2 multiplier applies only to the number card total, not modifiers.
 */
export function calcCardTotal(
  numbers: number[],   // selected number card values (0–12)
  modifiers: number[], // selected modifier card values (+2/+4/+6/+8/+10)
  x2: boolean          // whether the X2 multiplier card is held
): number {
  const numSum = numbers.reduce((a, b) => a + b, 0);
  const modSum = modifiers.reduce((a, b) => a + b, 0);
  return numSum * (x2 ? 2 : 1) + modSum;
}
