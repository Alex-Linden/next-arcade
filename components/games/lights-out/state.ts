import { emptyBoard, isSolved, randomSolvableBoard, type Index, defaultSize, toggleAt } from "./logic";

export type Status = "idle" | "playing" | "won";

export type State = {
  size: number;
  board: boolean[]; // true = light on
  moves: number;
  status: Status;
};

export type Action =
  | { type: "NEW_GAME" }
  | { type: "CLICK"; i: Index }
  | { type: "RESET" };

export function initialState(): State {
  return {
    size: defaultSize,
    board: emptyBoard(defaultSize),
    moves: 0,
    status: "idle",
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEW_GAME": {
      const board = randomSolvableBoard(state.size);
      return { ...state, board, moves: 0, status: "playing" };
    }

    case "CLICK": {
      if (state.status !== "playing") return state;
      const board = toggleAt(state.board, action.i, state.size);
      const moves = state.moves + 1;
      const status = isSolved(board) ? "won" : "playing";
      return { ...state, board, moves, status };
    }

    case "RESET": {
      // Reset to a fresh random board
      const board = randomSolvableBoard(state.size);
      return { ...state, board, moves: 0, status: "playing" };
    }

    default:
      return state;
  }
}

