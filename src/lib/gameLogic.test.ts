import { describe, it, expect } from 'vitest';
import { totalScore, getWinners, createEmptyGame, calcCardTotal, FLIP_7_CARD_COUNT, FLIP_7_BONUS } from './gameLogic';
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

describe('Flip 7 constants', () => {
  it('FLIP_7_CARD_COUNT is 7', () => {
    expect(FLIP_7_CARD_COUNT).toBe(7);
  });
  it('FLIP_7_BONUS is 15', () => {
    expect(FLIP_7_BONUS).toBe(15);
  });
});

describe('calcCardTotal', () => {
  it('returns 0 when nothing is selected', () => {
    expect(calcCardTotal([], [], null)).toBe(0);
  });

  it('sums number cards correctly', () => {
    expect(calcCardTotal([3, 7, 2], [], null)).toBe(12);
  });

  it('sums modifier cards correctly', () => {
    expect(calcCardTotal([], [4, 6], null)).toBe(10);
  });

  it('applies x2 to number total only, not modifiers', () => {
    expect(calcCardTotal([5], [4], 'x2')).toBe(14); // (5 × 2) + 4
  });

  it('x2 with no number cards returns only modifier sum', () => {
    expect(calcCardTotal([], [8], 'x2')).toBe(8); // (0 × 2) + 8
  });

  it('combines numbers, x2, and modifiers correctly', () => {
    expect(calcCardTotal([3, 7], [2, 4], 'x2')).toBe(26); // (10 × 2) + 6
  });

  it('div2 halves number sum (floor) and then adds modifiers', () => {
    expect(calcCardTotal([7], [], 'div2')).toBe(3); // floor(7 / 2)
  });

  it('div2 floors odd results', () => {
    expect(calcCardTotal([5, 4], [], 'div2')).toBe(4); // floor(9 / 2)
  });

  it('div2 with no number cards returns only modifier sum', () => {
    expect(calcCardTotal([], [-4], 'div2')).toBe(-4); // floor(0 / 2) + (-4)
  });

  it('negative modifiers reduce total', () => {
    expect(calcCardTotal([8], [-2, -4], null)).toBe(2); // 8 + (-6)
  });

  it('negative modifiers can produce a total below zero', () => {
    expect(calcCardTotal([2], [-10], null)).toBe(-8); // 2 + (-10)
  });

  it('two 13s sum correctly', () => {
    expect(calcCardTotal([13, 13], [], null)).toBe(26);
  });
});
