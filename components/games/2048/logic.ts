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


// -- row sliding/merging (left) -----------------------------------------

const arraysEqual = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

type SlideResult = { row: number[]; moved: boolean; scoreDelta: number; };

/**
 * Slide a length-4 row to the left with 2048 rules:
 * - compress zeros out
 * - merge equal adjacent once per pair (left-to-right)
 * - pad with zeros to length 4
 */
export function slideRowLeft(input: number[]): SlideResult {
  // compress
  const compact: number[] = [];
  for (let i = 0; i < input.length; i++) if (input[i] !== 0) compact.push(input[i]);

  // merge once
  const merged: number[] = [];
  let scoreDelta = 0;
  for (let i = 0; i < compact.length; i++) {
    if (i < compact.length - 1 && compact[i] === compact[i + 1]) {
      const val = compact[i] * 2;
      merged.push(val);
      scoreDelta += val;
      i++; // skip the next; it merged
    } else {
      merged.push(compact[i]);
    }
  }

  // pad to length 4
  while (merged.length < SIZE) merged.push(0);

  const moved = !arraysEqual(input, merged);
  return { row: merged, moved, scoreDelta };
}

// -- moves on the full board --------------------------------------------

type MoveResult = { board: Board; moved: boolean; scoreDelta: number; };

export function moveLeft(board: Board): MoveResult {
  let next = board.slice();
  let moved = false;
  let scoreDelta = 0;

  for (let r = 0; r < SIZE; r++) {
    const row = getRow(board, r);
    const { row: newRow, moved: rowMoved, scoreDelta: delta } = slideRowLeft(row);
    if (rowMoved) moved = true;
    scoreDelta += delta;
    next = setRow(next, r, newRow);
  }
  return { board: next, moved, scoreDelta };
}

export function moveRight(board: Board): MoveResult {
  let next = board.slice();
  let moved = false;
  let scoreDelta = 0;

  for (let r = 0; r < SIZE; r++) {
    const row = getRow(board, r);
    const reversed = row.slice().reverse();
    const slid = slideRowLeft(reversed);
    const newRow = slid.row.slice().reverse();

    if (!arraysEqual(row, newRow)) moved = true;
    scoreDelta += slid.scoreDelta;
    next = setRow(next, r, newRow);
  }
  return { board: next, moved, scoreDelta };
}

export function moveUp(board: Board): MoveResult {
  let next = board.slice();
  let moved = false;
  let scoreDelta = 0;

  for (let c = 0; c < SIZE; c++) {
    const col = getCol(board, c);
    const { row: newCol, moved: colMoved, scoreDelta: delta } = slideRowLeft(col);
    if (colMoved) moved = true;
    scoreDelta += delta;
    next = setCol(next, c, newCol);
  }
  return { board: next, moved, scoreDelta };
}

export function moveDown(board: Board): MoveResult {
  let next = board.slice();
  let moved = false;
  let scoreDelta = 0;

  for (let c = 0; c < SIZE; c++) {
    const col = getCol(board, c);
    const reversed = col.slice().reverse();
    const slid = slideRowLeft(reversed);
    const newCol = slid.row.slice().reverse();

    if (!arraysEqual(col, newCol)) moved = true;
    scoreDelta += slid.scoreDelta;
    next = setCol(next, c, newCol);
  }
  return { board: next, moved, scoreDelta };
}

// -- terminal state check -----------------------------------------------

/**
 * True if there is at least one empty cell or any adjacent equal pair,
 * meaning the player still has a valid move.
 */
export function hasMoves(board: Board): boolean {
  for (let i = 0; i < board.length; i++) {
    const v = board[i];
    if (v === 0) return true;

    const r = Math.floor(i / SIZE);
    const c = i % SIZE;

    // right neighbor
    if (c < SIZE - 1 && v === board[i + 1]) return true;
    // down neighbor
    if (r < SIZE - 1 && v === board[i + SIZE]) return true;
  }
  return false;
}

// Build a test board with two 1024 tiles ready to merge in one move.
export function createNearWinBoard(
  direction: "up" | "down" | "left" | "right" = "up"
): Board {
  const b = emptyBoard();

  // choose a safe row/col that won't run off the edge
  switch (direction) {
    case "up": {
      const c = 1; // column 1 → indices (0,1) and (1,1)
      b[toIndex(0, c)] = 1024;
      b[toIndex(1, c)] = 1024;
      break;
    }
    case "down": {
      const c = 2; // indices (2,2) and (3,2)
      b[toIndex(2, c)] = 1024;
      b[toIndex(3, c)] = 1024;
      break;
    }
    case "left": {
      const r = 2; // indices (2,0) and (2,1)
      b[toIndex(r, 0)] = 1024;
      b[toIndex(r, 1)] = 1024;
      break;
    }
    case "right": {
      const r = 1; // indices (1,2) and (1,3)
      b[toIndex(r, 2)] = 1024;
      b[toIndex(r, 3)] = 1024;
      break;
    }
  }

  // Optional small fillers so the board doesn't look completely empty
  // (they won't interfere with the merge)
  b[toIndex(0, 3)] = 2;
  b[toIndex(3, 3)] = 4;

  return b;
}
