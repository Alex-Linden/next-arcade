// components/games/2048/state.ts
import {
  type Board,
  emptyBoard,
  spawnRandom,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
  hasMoves,
} from "./logic";

export type Direction = "left" | "right" | "up" | "down";
export type GameStatus = "playing" | "won" | "lost";

export type State = {
  board: Board;
  score: number;
  best: number;
  status: GameStatus;
  wonAt: number | null;     // the first tile value that hit/beat WIN_TARGET
  movedLast: Direction | null;
};

export type Action =
  | { type: "NEW_GAME" }
  | { type: "MOVE"; dir: Direction }
  | { type: "KEEP_PLAYING" }  // allow moves after win
  | { type: "RESET_BEST" }
  | { type: "LOAD"; snapshot: Partial<State> & { board: Board } };

export const WIN_TARGET = 2048;

// ---- initial state
export const initialState = (): State => {
  let board = emptyBoard();
  board = spawnRandom(board);
  board = spawnRandom(board);
  return {
    board,
    score: 0,
    best: 0,
    status: "playing",
    wonAt: null,
    movedLast: null,
  };
};

// ---- helpers
const movers: Record<Direction, (b: Board) => { board: Board; moved: boolean; scoreDelta: number }> = {
  left: moveLeft,
  right: moveRight,
  up: moveUp,
  down: moveDown,
};

function maxTile(board: Board): number {
  let m = 0;
  for (let i = 0; i < board.length; i++) if (board[i] > m) m = board[i];
  return m;
}

// ---- reducer
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEW_GAME": {
      let board = emptyBoard();
      board = spawnRandom(board);
      board = spawnRandom(board);
      return {
        board,
        score: 0,
        best: state.best,     // keep best across games
        status: "playing",
        wonAt: null,
        movedLast: null,
      };
    }

    case "MOVE": {
      // Block input if not actively playing (won → requires KEEP_PLAYING, lost → game over)
      if (state.status !== "playing") return state;

      const move = movers[action.dir];
      const { board: movedBoard, moved, scoreDelta } = move(state.board);
      if (!moved) return state; // ignore no-op moves (no spawn, no score change)

      // Valid move → apply score, spawn one random tile
      const withSpawn = spawnRandom(movedBoard);
      const nextScore = state.score + scoreDelta;
      const nextBest = Math.max(state.best, nextScore);

      // Determine next status
      let nextStatus: GameStatus = state.status;
      let wonAt = state.wonAt;

      const max = maxTile(withSpawn);
      if (max >= WIN_TARGET) {
        nextStatus = "won";
        if (!wonAt || max > wonAt) wonAt = max;
      } else if (!hasMoves(withSpawn)) {
        nextStatus = "lost";
      }

      return {
        ...state,
        board: withSpawn,
        score: nextScore,
        best: nextBest,
        status: nextStatus,
        wonAt,
        movedLast: action.dir,
      };
    }

    case "KEEP_PLAYING": {
      if (state.status !== "won") return state;
      // Let the user continue; they can still lose later.
      return { ...state, status: "playing" };
    }

    case "RESET_BEST":
      return { ...state, best: 0 };

    case "LOAD": {
      const s = action.snapshot;
      return {
        board: s.board,
        score: s.score ?? 0,
        best: s.best ?? state.best,
        status: s.status ?? "playing",
        wonAt: s.wonAt ?? null,
        movedLast: s.movedLast ?? null,
      };
    }

    default:
      return state;
  }
}
