export type Player = "X" | "O";
export type Square = Player | null;
export type Line = readonly [number, number, number];
export type Board = ReadonlyArray<Square>;

export const WIN_LINES: readonly Line[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export function getWinInfo(board: Board): { winner: Player; line: Line; } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export function isBoardFull(board: Board): boolean {
  return board.every((s) => s !== null);
}

export function nextPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}