export type Tile = number | null;
export type Board = readonly Tile[];

export const emptyBoard = (): Board => Array(16).fill(0) as Board;

export function getEmptyIndices(board: Board): number[] {
  return Array.from({ length: 16 }, (_, i) => i).filter(i => board[i] === 0);
}

export function spawnRandom(board: Board, rng = Math.random): Board {
  const emptyIndices = getEmptyIndices(board);
  if (emptyIndices.length === 0) return board;
  const i = emptyIndices[Math.floor(rng() * emptyIndices.length)];
  const newNum = rng() < 0.9 ? 2 : 4;
  return [...board.slice(0, i), newNum, ...board.slice(i + 1)];
}

