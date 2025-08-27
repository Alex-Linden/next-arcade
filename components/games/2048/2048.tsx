"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { reducer, initialState, type Direction } from "./state";

export default function Game2048() {
    const [state, dispatch] = useReducer(reducer, undefined, initialState);
    const [winOpen, setWinOpen] = useState(false);
    const [loseOpen, setLoseOpen] = useState(false);

    // Open win/lose dialogs shortly after the status changes so the board renders first
    const prevStatus = useRef(state.status);
    useEffect(() => {
        if (prevStatus.current === "playing" && state.status === "won") {
            const t = setTimeout(() => setWinOpen(true), 450);
            return () => clearTimeout(t);
        }
        if (prevStatus.current === "playing" && state.status === "lost") {
            const t = setTimeout(() => setLoseOpen(true), 350);
            return () => clearTimeout(t);
        }
        if (state.status === "playing") {
            setWinOpen(false);
            setLoseOpen(false);
        }
        prevStatus.current = state.status;
    }, [state.status]);

    // Keyboard controls (arrows + WASD)
    useEffect(() => {
        const keyToDir: Record<string, Direction | undefined> = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down",
            a: "left",
            d: "right",
            w: "up",
            s: "down",
        };
        const onKey = (e: KeyboardEvent) => {
            const dir = keyToDir[e.key];
            if (!dir) return;
            e.preventDefault();
            dispatch({ type: "MOVE", dir });
        };
        window.addEventListener("keydown", onKey, { passive: false });
        return () => window.removeEventListener("keydown", onKey as any);
    }, []);

    // Touch / pointer swipe controls
    const startRef = useRef<{ x: number; y: number; } | null>(null);
    const SWIPE = 24; // px threshold
    const onPointerDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        startRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: React.PointerEvent) => {
        const s = startRef.current;
        startRef.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
        const dir: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        dispatch({ type: "MOVE", dir });
    };

    function handleNewGame() {
        dispatch({ type: "NEW_GAME" });
        setWinOpen(false);
        setLoseOpen(false);
    }
    function handleKeepPlaying() {
        setWinOpen(false);
        dispatch({ type: "KEEP_PLAYING" });
    }
    function handleResetBest() {
        dispatch({ type: "RESET_BEST" });
    }

    const statusLine =
        state.status === "playing"
            ? "Use arrows or swipe"
            : state.status === "won"
                ? `You reached ${state.wonAt}!`
                : "No more moves";

    return (
        <Card className="mx-auto max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>2048</span>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="rounded-md border px-2 py-1">
                            Score: <strong>{state.score}</strong>
                        </span>
                        <span className="rounded-md border px-2 py-1">
                            Best: <strong>{state.best}</strong>
                        </span>
                    </div>
                </CardTitle>
                <CardDescription aria-live="polite">{statusLine}</CardDescription>
            </CardHeader>

            <CardContent>
                <div
                    className="mx-auto w-full max-w-sm select-none"
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                >
                    {/* Board */}
                    <div className="grid grid-cols-4 gap-2 rounded-2xl bg-muted/40 p-2">
                        {state.board.map((val, i) => (
                            <Tile key={i} value={val} />
                        ))}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    <Button onClick={handleNewGame}>New Game</Button>
                    <Button variant="outline" onClick={handleResetBest}>
                        Reset Best
                    </Button>
                </div>
                <Separator className="sm:hidden" />
                <div className="text-xs text-muted-foreground">Arrows / WASD · Swipe on mobile</div>
            </CardFooter>

            {/* Win dialog */}
            <Dialog open={winOpen} onOpenChange={setWinOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">You made {state.wonAt} 🎉</DialogTitle>
                        <DialogDescription>Keep going to chase a new high score, or start fresh.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button onClick={handleKeepPlaying}>Keep playing</Button>
                        <Button variant="secondary" onClick={handleNewGame}>
                            New game
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lose dialog */}
            <Dialog open={loseOpen} onOpenChange={setLoseOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">No more moves</DialogTitle>
                        <DialogDescription>Try again and beat your best score.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button onClick={handleNewGame}>Try again</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

/* ------------------------- Tiles (styling only) ------------------------- */

function Tile({ value }: { value: number; }) {
    const isEmpty = value === 0;
    const className = cn(
        "aspect-square rounded-xl flex items-center justify-center font-extrabold",
        "transition-transform",
        isEmpty ? "bg-background/40 text-transparent" : tileClasses(value),
        !isEmpty && "animate-in zoom-in-50 fade-in-50 duration-200 ease-out"
    );

    // Shrink font as numbers grow
    const size =
        value >= 1024 ? "text-2xl" : value >= 128 ? "text-3xl" : value >= 16 ? "text-4xl" : "text-5xl";

    return <div className={className}><span className={size}>{value || "·"}</span></div>;
}

function tileClasses(v: number): string {
    // Tailwind class strings are static; values just choose which to apply.
    switch (v) {
        case 2:
            return "bg-violet-50 text-violet-700";
        case 4:
            return "bg-violet-100 text-violet-700";
        case 8:
            return "bg-violet-200 text-violet-800";
        case 16:
            return "bg-purple-300 text-zinc-900";
        case 32:
            return "bg-purple-400 text-white";
        case 64:
            return "bg-purple-500 text-white";
        case 128:
            return "bg-fuchsia-500 text-white";
        case 256:
            return "bg-fuchsia-600 text-white";
        case 512:
            return "bg-pink-600 text-white";
        case 1024:
            return "bg-rose-600 text-white";
        case 2048:
            return "bg-yellow-400 text-zinc-900";
        default:
            // For tiles > 2048
            return "bg-yellow-500 text-zinc-900";
    }
}
