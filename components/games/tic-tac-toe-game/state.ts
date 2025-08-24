import { Board, Player, Line, getWinInfo, isBoardFull, nextPlayer } from "./logic";

export type GameStatus = "playing" | "x_won" | "o_won" | "draw";
export type Mode = "classic" | "bolt";

export type State = {
  board: Board;
  current: Player;
  status: GameStatus;
  winLine: Line | null;
  history: Board[];        // Boards only (we disable UNDO in bolt anyway)
  mode: Mode;
  xQueue: number[];        // used only in bolt; empty in classic
  oQueue: number[];
};

export type Action =
  | { type: "PLAY"; index: number }
  | { type: "NEW_GAME"; alternateStarter?: boolean }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "SET_MODE"; mode: Mode };

export const emptyBoard = (): Board => Array(9).fill(null) as Board;

export const initialState = (): State => ({
  board: emptyBoard(),
  current: "X",
  status: "playing",
  winLine: null,
  history: [],
  mode: "classic",
  xQueue: [],
  oQueue: [],
});

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PLAY": {
      const i = action.index;
      if (state.status !== "playing" || state.board[i] != null) return state;

      // always work on copies
      const board = [...state.board];
      let xQueue = state.xQueue;
      let oQueue = state.oQueue;

      if (state.mode === "bolt") {
        xQueue = [...state.xQueue];
        oQueue = [...state.oQueue];
        const queue = state.current === "X" ? xQueue : oQueue;

        // If player already has 3 marks, remove the oldest *from the board*
        if (queue.length >= 3) {
          const oldest = queue.shift()!;
          board[oldest] = null;
        }
        // Record the new placement in their FIFO
        queue.push(i);
      }

      // Place the mark
      board[i] = state.current;

      const win = getWinInfo(board);
      if (win) {
        return {
          ...state,
          board,
          status: win.winner === "X" ? "x_won" : "o_won",
          winLine: win.line,
          xQueue,
          oQueue,
        };
      }

      if (state.mode === "classic" && isBoardFull(board)) {
        return { ...state, board, status: "draw", xQueue, oQueue };
      }

      return {
        ...state,
        board,
        current: nextPlayer(state.current),
        history: [...state.history, state.board], // snapshot previous board
        xQueue,
        oQueue,
      };
    }

    case "NEW_GAME": {
      const first: Player = action.alternateStarter
        ? state.status === "x_won" ? "O"
          : state.status === "o_won" ? "X"
          : state.current              // if mid-game reset, let the other player start
        : "X";

      return {
        ...state,
        board: emptyBoard(),
        current: first,
        status: "playing",
        winLine: null,
        history: [],
        xQueue: [],
        oQueue: [],
      };
    }

    case "UNDO": {
      // disabled in bolt; no-op if no history
      if (state.mode === "bolt" || state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const current = nextPlayer(state.current); // flip back to the mover you just undid
      return { ...state, board: prev, current, status: "playing", winLine: null, history };
    }

    case "SET_MODE": {
      if (state.mode === action.mode) return state;
      // Switch rules and start fresh
      return {
        ...state,
        mode: action.mode,
        board: emptyBoard(),
        current: "X",
        status: "playing",
        winLine: null,
        history: [],
        xQueue: [],
        oQueue: [],
      };
    }

    case "RESET":
      return initialState();
  }
}
