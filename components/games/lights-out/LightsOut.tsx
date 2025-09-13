"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reducer, initialState } from "./state";
import { solveOptimal } from "./logic";

export default function LightsOut() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [winOpen, setWinOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionIndices, setSolutionIndices] = useState<number[] | null>(null);
  const [solutionMoves, setSolutionMoves] = useState<number | null>(null);

  // client-only randomness: start a game on mount
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    dispatch({ type: "NEW_GAME" });
  }, []);

  // Open a win dialog when reaching solved state
  const prevStatus = useRef(state.status);
  useEffect(() => {
    if (prevStatus.current === "playing" && state.status === "won") {
      const t = setTimeout(() => setWinOpen(true), 250);
      return () => clearTimeout(t);
    }
    if (state.status === "playing") setWinOpen(false);
    prevStatus.current = state.status;
  }, [state.status]);

  const size = state.size;
  const total = size * size;

  function handleCellClick(i: number) {
    // applying a move invalidates previous hints/solution overlays
    setHintIndex(null);
    setShowSolution(false);
    dispatch({ type: "CLICK", i });
  }

  function handleNewGame() {
    setHintIndex(null);
    setShowSolution(false);
    setSolutionIndices(null);
    setSolutionMoves(null);
    dispatch({ type: "NEW_GAME" });
  }

  function handleHint() {
    const sol = solveOptimal(state.board, size);
    if (!sol || sol.indices.length === 0) {
      setHintIndex(null);
      return;
    }
    const next = [...sol.indices].sort((a, b) => a - b)[0];
    setHintIndex(next);
    setShowSolution(false);
  }

  function handleToggleSolution() {
    if (showSolution) {
      setShowSolution(false);
      return;
    }
    const sol = solveOptimal(state.board, size);
    if (!sol) {
      setSolutionIndices(null);
      setSolutionMoves(null);
      setShowSolution(false);
      return;
    }
    setSolutionIndices(sol.indices);
    setSolutionMoves(sol.moves);
    setShowSolution(true);
    setHintIndex(null);
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lights Out</span>
          <span className="rounded-md border px-2 py-1 text-sm">Moves: <strong>{state.moves}</strong></span>
        </CardTitle>
        <CardDescription aria-live="polite">
          Turn off all the lights. Clicking toggles a plus shape.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto select-none" style={{ maxWidth: 400 }}>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: total }, (_, i) => {
              const on = state.board[i];
              const inSolution = showSolution && solutionIndices?.includes(i);
              const isHint = hintIndex === i;
              const extra =
                (inSolution ? " outline outline-2 outline-emerald-400" : "") +
                (isHint ? " outline outline-2 outline-sky-400 animate-pulse" : "");
              return (
                <button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  className={
                    `aspect-square rounded-sm border transition-colors relative ` +
                    (on
                      ? "bg-yellow-300 hover:bg-yellow-200 border-yellow-400 shadow-inner"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700") +
                    extra
                  }
                  aria-pressed={on}
                  aria-label={`Cell ${i + 1}: ${on ? "on" : "off"}`}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button onClick={handleNewGame}>New Game</Button>
          <Button variant="outline" onClick={handleHint} disabled={state.status !== "playing"}>Hint</Button>
          <Button variant="outline" onClick={handleToggleSolution} disabled={state.status === "won"}>
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {state.status === "won"
            ? "Solved!"
            : showSolution && solutionMoves != null
            ? `Optimal: ${solutionMoves} moves`
            : "Good luck"}
        </div>
      </CardFooter>

      <Dialog open={winOpen} onOpenChange={setWinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You win! 🎉</DialogTitle>
            <DialogDescription>
              Nice work — all lights are off in {state.moves} moves.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button onClick={handleNewGame}>Play Again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
