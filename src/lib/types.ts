export type Player = {
  id: string;
  name: string;
};

export type GameState = {
  players: Player[];
  // scores[playerId][roundIndex] = number entered, or null if not yet entered
  scores: Record<string, (number | null)[]>;
  currentRound: number;
};
