import { Board, Player, Line, getWinInfo, isBoardFull, nextPlayer } from "./logic";

export type GameStatus = "playing" | "x_won" | "o_won" | "draw";

export type State = {
  board: Board;
  current: Player;
  status: GameStatus;
  winLine: Line | null;
  history: Board[];
};

export type Action =
  | { type: "PLAY"; index: number }
  | { type: "NEW_GAME"; alternateStarter?: boolean }
  | { type: "UNDO" }
  | { type: "RESET" };

export const emptyBoard = (): Board => Array(9).fill(null) as Board;

export const initialState = (): State => ({
  board: emptyBoard(),
  current: "X",
  status: "playing",
  winLine: null,
  history: [],
});

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PLAY": {
      const i = action.index;
      if (state.status !== "playing" || state.board[i]) return state;

      const board = [...state.board];
      board[i] = state.current;

      const win = getWinInfo(board);
      if (win) {
        return { ...state, board, status: win.winner === "X" ? "x_won" : "o_won", winLine: win.line };
      }
      if (isBoardFull(board)) {
        return { ...state, board, status: "draw" };
      }
      return {
        ...state,
        board,
        current: nextPlayer(state.current),
        history: [...state.history, state.board],
      };
    }

    case "NEW_GAME": {
      const first: Player = action.alternateStarter
        ? state.status === "x_won"
          ? "O"
          : state.status === "o_won"
          ? "X"
          : "X"
        : "X";
      return { board: emptyBoard(), current: first, status: "playing", winLine: null, history: [] };
    }

    case "UNDO": {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const x = prev.filter((s) => s === "X").length;
      const o = prev.filter((s) => s === "O").length;
      const current: Player = x === o ? "X" : "O";
      return { ...state, board: prev, current, status: "playing", winLine: null, history };
    }

    case "RESET":
      return initialState();
  }
}
