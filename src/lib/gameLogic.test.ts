import { describe, it, expect } from 'vitest';
import { totalScore, getWinners, createEmptyGame, calcCardTotal } from './gameLogic';
import type { GameState } from './types';

describe('totalScore', () => {
  it('returns 0 for a player with no scores', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [] },
      currentRound: 0,
    };
    expect(totalScore(state.scores, 'p1')).toBe(0);
  });

  it('sums non-null scores', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [23, 18, 31] },
      currentRound: 3,
    };
    expect(totalScore(state.scores, 'p1')).toBe(72);
  });

  it('ignores null entries', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [23, null, 31] },
      currentRound: 2,
    };
    expect(totalScore(state.scores, 'p1')).toBe(54);
  });

  it('counts 0 (bust) as 0 points, not ignored', () => {
    const state: GameState = {
      players: [{ id: 'p1', name: 'Alice' }],
      scores: { p1: [20, 0, 10] },
      currentRound: 3,
    };
    expect(totalScore(state.scores, 'p1')).toBe(30);
  });
});

describe('getWinners', () => {
  it('returns null when no player has reached 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      scores: { p1: [99], p2: [150] },
      currentRound: 1,
    };
    expect(getWinners(state)).toBeNull();
  });

  it('returns the highest-scoring player when someone reaches 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      scores: { p1: [210], p2: [180] },
      currentRound: 1,
    };
    const winners = getWinners(state);
    expect(winners).not.toBeNull();
    expect(winners!.length).toBe(1);
    expect(winners![0].name).toBe('Alice');
  });

  it('returns all tied leaders when multiple players share the highest score above 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Carol' },
      ],
      scores: { p1: [210], p2: [210], p3: [195] },
      currentRound: 1,
    };
    const winners = getWinners(state);
    expect(winners).not.toBeNull();
    expect(winners!.length).toBe(2);
    expect(winners!.map((w) => w.name).sort()).toEqual(['Alice', 'Bob']);
  });

  it('winner is highest scorer even if they did not personally cross 200', () => {
    const state: GameState = {
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      scores: { p1: [205], p2: [220] },
      currentRound: 1,
    };
    const winners = getWinners(state);
    expect(winners![0].name).toBe('Bob');
  });
});

describe('getWinners — edge cases', () => {
  it('returns null when there are no players', () => {
    const state: GameState = { players: [], scores: {}, currentRound: 0 };
    expect(getWinners(state)).toBeNull();
  });
});

describe('createEmptyGame', () => {
  it('creates a game with no players and round 0', () => {
    const game = createEmptyGame();
    expect(game.players).toEqual([]);
    expect(game.scores).toEqual({});
    expect(game.currentRound).toBe(0);
  });
});

describe('calcCardTotal', () => {
  it('returns 0 when nothing is selected', () => {
    expect(calcCardTotal([], [], false)).toBe(0);
  });

  it('sums number cards correctly', () => {
    expect(calcCardTotal([3, 7, 2], [], false)).toBe(12);
  });

  it('sums modifier cards correctly', () => {
    expect(calcCardTotal([], [4, 6], false)).toBe(10);
  });

  it('applies X2 to number total only, not modifiers', () => {
    expect(calcCardTotal([5], [4], true)).toBe(14); // (5 × 2) + 4
  });

  it('X2 with no number cards returns only modifier sum', () => {
    expect(calcCardTotal([], [8], true)).toBe(8); // (0 × 2) + 8 = 8
  });

  it('combines numbers, X2, and modifiers correctly', () => {
    expect(calcCardTotal([3, 7], [2, 4], true)).toBe(26); // (10 × 2) + 6
  });
});
