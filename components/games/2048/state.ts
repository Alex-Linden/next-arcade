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
  wonAt: number | null;     // highest tile value at the moment a win was triggered
  movedLast: Direction | null;
  winTarget: number;        // current threshold to trigger the next win dialog
};

export type Action =
  | { type: "NEW_GAME" }
  | { type: "MOVE"; dir: Direction }
  | { type: "KEEP_PLAYING" }   // user acknowledged the win; bump the threshold
  | { type: "RESET_BEST" }
  | { type: "LOAD"; snapshot: Partial<State> & { board: Board } };

export const BASE_WIN_TARGET = 2048;

export const initialState = (): State => ({
  board: emptyBoard(),        // ← no randomness here
  score: 0,
  best: 0,
  status: "playing",
  wonAt: null,
  movedLast: null,
  winTarget: BASE_WIN_TARGET,
});

// helpers
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

// reducer
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEW_GAME": {
      let board = emptyBoard();
      board = spawnRandom(board);
      board = spawnRandom(board);
      return {
        board,
        score: 0,
        best: state.best,
        status: "playing",
        wonAt: null,
        movedLast: null,
        winTarget: BASE_WIN_TARGET, // reset the target
      };
    }

    case "MOVE": {
      if (state.status !== "playing") return state;

      const { board: movedBoard, moved, scoreDelta } = movers[action.dir](state.board);
      if (!moved) return state;

      const withSpawn = spawnRandom(movedBoard);
      const nextScore = state.score + scoreDelta;
      const nextBest = Math.max(state.best, nextScore);

      const max = maxTile(withSpawn);

      let nextStatus: GameStatus = state.status;
      let wonAt = state.wonAt;

      // ⬇️ trigger win only when crossing the current target
      if (max >= state.winTarget) {
        nextStatus = "won";
        wonAt = max;
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
      // ⬇️ bump the target so the next popup only appears at 4096, then 8192, etc.
      return { ...state, status: "playing", winTarget: state.winTarget * 2 };
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
        winTarget: s.winTarget ?? BASE_WIN_TARGET,
      };
    }

    default:
      return state;
  }
}
