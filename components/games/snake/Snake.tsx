"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SIZE, type Direction } from "./logic";
import { reducer, initialState } from "./state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GameSnake() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [overOpen, setOverOpen] = useState(false);

  // client-only randomness: start a game on mount
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    dispatch({ type: "NEW_GAME" });
  }, []);

  // keyboard controls
  useEffect(() => {
    const keyToDir: Record<string, any> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = keyToDir[e.key];
      if (!dir) return;
      e.preventDefault();
      dispatch({ type: "TURN", dir });
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey as any);
  }, []);

  // game loop
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== "playing") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => dispatch({ type: "TICK" }), state.speedMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.status, state.speedMs]);

  // open the Game Over dialog shortly after crashing so the board renders first
  const prevStatus = useRef(state.status);
  useEffect(() => {
    if (prevStatus.current === "playing" && state.status === "dead") {
      const t = setTimeout(() => setOverOpen(true), 350);
      return () => clearTimeout(t);
    }
    if (state.status === "playing") setOverOpen(false);
    prevStatus.current = state.status;
  }, [state.status]);

  const statusLine = useMemo(() => {
    switch (state.status) {
      case "idle": return "Press New Game to start";
      case "playing": return "Use arrows or WASD";
      case "paused": return "Paused";
      case "dead": return "You crashed. Try again.";
    }
  }, [state.status]);

  function handleNewGame() {
    dispatch({ type: "NEW_GAME" });
  }
  function handlePauseResume() {
    if (state.status === "playing") dispatch({ type: "PAUSE" });
    else if (state.status === "paused") dispatch({ type: "RESUME" });
  }

  // build a quick index set for rendering
  const snakeSet = useMemo(() => new Set(state.snake), [state.snake]);
  const head = state.snake[0];

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Snake</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-md border px-2 py-1">Score: <strong>{state.score}</strong></span>
            <span className="rounded-md border px-2 py-1">Best: <strong>{state.best}</strong></span>
          </div>
        </CardTitle>
        <CardDescription aria-live="polite">{statusLine}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mx-auto w-full select-none" style={{ maxWidth: 400 }}>
          <Board
            snakeSet={snakeSet}
            head={head}
            apple={state.apple}
            dir={state.dir}
            status={state.status}
            crashAt={state.crashAt}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button onClick={handleNewGame}>New Game</Button>
          <Button variant="outline" onClick={handlePauseResume} disabled={state.status === "dead" || state.status === "idle"}>
            {state.status === "paused" ? "Resume" : "Pause"}
          </Button>
        </div>
        <Separator className="sm:hidden" />
        <div className="text-xs text-muted-foreground">Arrows / WASD</div>
      </CardFooter>

      {/* Game Over dialog */}
      <Dialog open={overOpen} onOpenChange={setOverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Game Over</DialogTitle>
            <DialogDescription>
              Score: <strong>{state.score}</strong> · Best: <strong>{state.best}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button onClick={() => { setOverOpen(false); dispatch({ type: "NEW_GAME" }); }}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => setOverOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Local styles for crash animation */}
      <style jsx>{`
        @keyframes head-crash-keyframes {
          0% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-1px, 0) rotate(-2deg) scale(1.02); }
          40% { transform: translate(1px, 0) rotate(2deg) scale(1.02); }
          60% { transform: translate(-1px, 0) rotate(-1deg) scale(1.01); }
          80% { transform: translate(1px, 0) rotate(1deg) scale(1.01); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .head-crash { animation: head-crash-keyframes 420ms ease-out; box-shadow: inset 0 0 0 3px hsl(var(--arcade-primary)/0.25); }
      `}</style>
    </Card>
  );
}

function Board({ snakeSet, head, apple, dir, status, crashAt }: {
  snakeSet: Set<number>;
  head?: number;
  apple: number | null;
  dir: Direction;
  status: "idle" | "playing" | "paused" | "dead";
  crashAt: number | null;
}) {
  const cells = SIZE * SIZE;
  return (
    <div
      className="grid gap-0.5 rounded-2xl bg-muted/40 p-2"
      style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }, (_, i) => {
        const isSnake = snakeSet.has(i);
        const isHead = head === i;
        const isApple = apple === i;
        const isCrash = crashAt === i;
        const showEyes = isHead;
        return (
          <div
            key={i}
            className={cn(
              "relative aspect-square rounded-sm",
              isApple && "bg-rose-500",
              isSnake && !isHead && cn("bg-emerald-500", status === "dead" && "opacity-70"),
              isHead && cn("bg-emerald-600", status === "dead" && "head-crash"),
              isCrash && "ring-2 ring-rose-500",
              !isSnake && !isApple && "bg-background/60"
            )}
          >
            {showEyes && <HeadEyes dir={dir} dead={status === "dead"} />}
          </div>
        );
      })}
    </div>
  );
}

function HeadEyes({ dir, dead }: { dir: Direction; dead: boolean; }) {
  const [l, r] = eyePositions(dir);
  const eyeClass = cn(
    "absolute h-1.5 w-1.5 rounded-full bg-white shadow",
    dead && "opacity-80"
  );
  const pupilClass = "absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900";
  return (
    <>
      <span className={eyeClass} style={l as CSSProperties}><span className={pupilClass} /></span>
      <span className={eyeClass} style={r as CSSProperties}><span className={pupilClass} /></span>
    </>
  );
}

function eyePositions(dir: Direction): [CSSProperties, CSSProperties] {
  switch (dir) {
    case "up":
      return [ { top: "28%", left: "36%" }, { top: "28%", left: "60%" } ];
    case "down":
      return [ { top: "64%", left: "36%" }, { top: "64%", left: "60%" } ];
    case "left":
      return [ { top: "44%", left: "24%" }, { top: "44%", left: "46%" } ];
    case "right":
      return [ { top: "44%", left: "54%" }, { top: "44%", left: "76%" } ];
  }
}
