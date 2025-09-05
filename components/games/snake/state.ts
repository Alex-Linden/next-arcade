import { type Direction, initialSnake, spawnApple, step, nextIndex } from "./logic";

export type GameStatus = "idle" | "playing" | "paused" | "dead";

export type State = {
  snake: number[];        // head-first
  apple: number | null;
  dir: Direction;         // current direction applied on tick
  nextDir: Direction;     // buffered turn to apply at next tick
  status: GameStatus;
  score: number;
  best: number;
  speedMs: number;        // tick interval
  crashAt: number | null; // where the collision occurred (for animation)
};

export type Action =
  | { type: "NEW_GAME" }
  | { type: "TURN"; dir: Direction }
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET_BEST" };

export const BASE_SPEED = 130; // ms per step

export const initialState = (): State => ({
  snake: initialSnake(),
  apple: null,            // no randomness on server
  dir: "right",
  nextDir: "right",
  status: "idle",
  score: 0,
  best: 0,
  speedMs: BASE_SPEED,
  crashAt: null,
});

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEW_GAME": {
      const snake = initialSnake();
      const apple = spawnApple(new Set(snake));
      return {
        ...state,
        snake,
        apple,
        dir: "right",
        nextDir: "right",
        status: "playing",
        score: 0,
        // Optionally reset speed; could scale with score later
        speedMs: BASE_SPEED,
        crashAt: null,
      };
    }

    case "TURN": {
      if (state.status !== "playing") return state;
      // prevent reversing into self when length > 1
      const len = state.snake.length;
      const isOpp = (a: Direction, b: Direction) =>
        (a === "up" && b === "down") || (a === "down" && b === "up") || (a === "left" && b === "right") || (a === "right" && b === "left");
      if (len > 1 && isOpp(state.dir, action.dir)) return state;
      return { ...state, nextDir: action.dir };
    }

    case "TICK": {
      if (state.status !== "playing") return state;
      const { snake, apple, grew, hit } = step(state.snake, state.nextDir, state.apple);
      if (hit) {
        const crashAt = nextIndex(state.snake[0], state.nextDir);
        return { ...state, status: "dead", crashAt: crashAt ?? state.snake[0] };
      }
      const score = grew ? state.score + 1 : state.score;
      const best = Math.max(state.best, score);
      // optionally accelerate a bit
      const speedMs = Math.max(70, BASE_SPEED - Math.floor(score / 5) * 5);
      return { ...state, snake, apple, dir: state.nextDir, score, best, speedMs, crashAt: null };
    }

    case "PAUSE":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused" };

    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "playing" };

    case "RESET_BEST":
      return { ...state, best: 0 };

    default:
      return state;
  }
}
