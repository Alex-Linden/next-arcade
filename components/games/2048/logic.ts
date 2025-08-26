export const SIZE = 4 as const;
export type Board = number[]; // 0 = empty; otherwise power of two

export const emptyBoard = (): Board => Array(SIZE * SIZE).fill(0);

export const toIndex = (r: number, c: number) => r * SIZE + c;
export const fromIndex = (i: number) => [Math.floor(i / SIZE), i % SIZE] as const;

export const rowIndices = (r: number) => Array.from({ length: SIZE }, (_, c) => toIndex(r, c));
export const colIndices = (c: number) => Array.from({ length: SIZE }, (_, r) => toIndex(r, c));

// (Optional) precompute if you prefer constants:
export const ROWS = Array.from({ length: SIZE }, (_, r) => rowIndices(r));
export const COLS = Array.from({ length: SIZE }, (_, c) => colIndices(c));

// Handy slice helpers
export const getRow = (board: Board, r: number) => rowIndices(r).map(i => board[i]);
export const setRow = (board: Board, r: number, row: number[]) => {
  const next = board.slice();
  rowIndices(r).forEach((i, k) => (next[i] = row[k]));
  return next;
};
export const getCol = (board: Board, c: number) => colIndices(c).map(i => board[i]);
export const setCol = (board: Board, c: number, col: number[]) => {
  const next = board.slice();
  colIndices(c).forEach((i, k) => (next[i] = col[k]));
  return next;
};

export function spawnRandom(board: Board, rng: () => number = Math.random): Board {
  const empties = board.flatMap((v, i) => (v === 0 ? [i] : []));
  if (empties.length === 0) return board;
  const idx = empties[Math.floor(rng() * empties.length)];
  const value = rng() < 0.9 ? 2 : 4; // 90% 2s, 10% 4s
  const next = board.slice();
  next[idx] = value;
  return next;
}

