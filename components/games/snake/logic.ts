export const SIZE = 20 as const; // 20x20 grid
export type Index = number; // 0..(SIZE*SIZE-1)
export type Direction = "up" | "down" | "left" | "right";

export const toIndex = (r: number, c: number): Index => r * SIZE + c;
export const fromIndex = (i: Index) => [Math.floor(i / SIZE), i % SIZE] as const;

export function initialSnake(): Index[] {
  const r = Math.floor(SIZE / 2);
  // three-long snake horizontal facing right, head at the end
  return [toIndex(r, 10), toIndex(r, 9), toIndex(r, 8)];
}

export function nextIndex(i: Index, dir: Direction): Index | null {
  const [r, c] = fromIndex(i);
  switch (dir) {
    case "up":
      return r === 0 ? null : toIndex(r - 1, c);
    case "down":
      return r === SIZE - 1 ? null : toIndex(r + 1, c);
    case "left":
      return c === 0 ? null : toIndex(r, c - 1);
    case "right":
      return c === SIZE - 1 ? null : toIndex(r, c + 1);
  }
}

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

export function spawnApple(
  occupied: Set<Index>,
  rng: () => number = Math.random
): Index | null {
  const empties: Index[] = [];
  const total = SIZE * SIZE;
  for (let i = 0; i < total; i++) if (!occupied.has(i)) empties.push(i);
  if (empties.length === 0) return null;
  const idx = Math.floor(rng() * empties.length);
  return empties[idx];
}

export type StepResult = {
  snake: Index[];
  apple: Index | null;
  grew: boolean;
  hit: boolean; // wall or self
};

export function step(
  snake: Index[],
  dir: Direction,
  apple: Index | null,
  rng: () => number = Math.random
): StepResult {
  const head = snake[0];
  const next = nextIndex(head, dir);
  if (next == null) return { snake, apple, grew: false, hit: true };

  // self collision: note that moving into the current tail is allowed if not growing
  const willGrow = apple != null && next === apple;
  const bodyToCheck = willGrow ? snake : snake.slice(0, -1);
  for (let k = 0; k < bodyToCheck.length; k++) if (bodyToCheck[k] === next) {
    return { snake, apple, grew: false, hit: true };
  }

  if (willGrow) {
    const newSnake = [next, ...snake];
    const occupied = new Set(newSnake);
    const newApple = spawnApple(occupied, rng);
    return { snake: newSnake, apple: newApple, grew: true, hit: false };
  }

  // normal move
  const newSnake = [next, ...snake.slice(0, -1)];
  return { snake: newSnake, apple, grew: false, hit: false };
}
