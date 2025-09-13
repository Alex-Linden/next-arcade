export type Index = number;

export const defaultSize = 5 as const; // 5x5 grid by default

export function toIndex(row: number, col: number, size: number): Index {
  return row * size + col;
}

export function fromIndex(i: Index, size: number): readonly [number, number] {
  return [Math.floor(i / size), i % size] as const;
}

export function neighborsPlus(i: Index, size: number): Index[] {
  const [r, c] = fromIndex(i, size);
  const ns: Index[] = [i]; // include self
  if (r > 0) ns.push(toIndex(r - 1, c, size));
  if (r < size - 1) ns.push(toIndex(r + 1, c, size));
  if (c > 0) ns.push(toIndex(r, c - 1, size));
  if (c < size - 1) ns.push(toIndex(r, c + 1, size));
  return ns;
}

export function toggleAt(board: boolean[], i: Index, size: number): boolean[] {
  const next = board.slice();
  for (const n of neighborsPlus(i, size)) next[n] = !next[n];
  return next;
}

export function isSolved(board: boolean[]): boolean {
  // all lights off
  for (let k = 0; k < board.length; k++) if (board[k]) return false;
  return true;
}

export function emptyBoard(size: number): boolean[] {
  return Array(size * size).fill(false);
}

// Generate a solvable board by applying random valid clicks from the solved state
export function randomSolvableBoard(size: number, rng: () => number = Math.random): boolean[] {
  let board = emptyBoard(size);
  const total = size * size;
  // perform a number of random clicks
  const clicks = Math.max(8, Math.floor(total * 1.2));
  for (let k = 0; k < clicks; k++) {
    const i = Math.floor(rng() * total);
    board = toggleAt(board, i, size);
  }
  return board;
}

export type Solution = {
  presses: boolean[]; // true means press that cell
  indices: Index[];   // convenience: indices of presses
  moves: number;      // number of presses
};

// Optimal solver for standard Lights Out (no wrap, plus-neighborhood):
// Try all first-row press patterns and greedily determine presses for lower rows
// to clear lights above. Among valid completions, choose the minimal total presses.
export function solveOptimal(board: boolean[], size: number): Solution | null {
  const total = size * size;
  const press = (b: boolean[], r: number, c: number) => toggleAt(b, toIndex(r, c, size), size);

  let best: Solution | null = null;
  const maxMask = 1 << size;

  for (let mask = 0; mask < maxMask; mask++) {
    let b = board.slice();
    const presses = Array(total).fill(false) as boolean[];

    // apply first-row presses from mask
    for (let c = 0; c < size; c++) if ((mask >> c) & 1) {
      press(b, 0, c);
      presses[toIndex(0, c, size)] = true;
    }

    // for each subsequent row, press where cell above is on
    for (let r = 1; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const aboveIdx = toIndex(r - 1, c, size);
        if (b[aboveIdx]) {
          press(b, r, c);
          presses[toIndex(r, c, size)] = true;
        }
      }
    }

    // check if bottom row is cleared
    let ok = true;
    for (let c = 0; c < size; c++) if (b[toIndex(size - 1, c, size)]) { ok = false; break; }
    if (!ok) continue;

    const moves = presses.reduce((acc, v) => acc + (v ? 1 : 0), 0);
    if (best == null || moves < best.moves) {
      const indices = presses.map((v, i) => (v ? i : -1)).filter(i => i >= 0) as Index[];
      best = { presses, indices, moves };
    }
  }

  return best;
}
