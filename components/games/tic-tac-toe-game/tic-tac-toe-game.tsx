"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";

// import type { Player } from "./logic";
import { reducer, initialState } from "./state";
import type { Mode } from "./state";


type Scores = { X: number; O: number; draws: number; };

const SCORE_KEY = "next-arcade:tictactoe:scores";

export default function TicTacToeGame() {
    const [state, dispatch] = useReducer(reducer, undefined, initialState);
    const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 });
    const [winOpen, setWinOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingMode, setPendingMode] = useState<Mode | null>(null);

    const scoreKey = `next-arcade:tictactoe:scores:${state.mode}`;
    // Increment scores once per game end
    const prevStatus = useRef(state.status);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(scoreKey);
            setScores(raw ? JSON.parse(raw) : { X: 0, O: 0, draws: 0 });
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.mode]); // reload when mode changes

    useEffect(() => {
        try { localStorage.setItem(scoreKey, JSON.stringify(scores)); } catch { }
    }, [scores, scoreKey]);

    useEffect(() => {
        if (prevStatus.current === "playing" && state.status !== "playing") {
            const tid = setTimeout(() => setWinOpen(true), 500);
            return () => clearTimeout(tid);
        }
        if (state.status === "playing") setWinOpen(false);
    }, [state.status]);


    useEffect(() => {
        if (prevStatus.current === "playing" && state.status !== "playing") {
            setScores((s) => {
                if (state.status === "x_won") return { ...s, X: s.X + 1 };
                if (state.status === "o_won") return { ...s, O: s.O + 1 };
                return { ...s, draws: s.draws + 1 }; // draw
            });
        }
        prevStatus.current = state.status;
    }, [state.status]);

    const statusText =
        state.status === "playing"
            ? <>Turn: <Mark m={state.current} /></>
            : state.status === "x_won"
                ? <> <Mark m="X" /> wins! </>
                : state.status === "o_won"
                    ? <> <Mark m="O" /> wins! </>
                    : "It’s a draw.";


    const winner = state.status === "x_won" ? "X" : state.status === "o_won" ? "O" : null;
    const dialogTitle = winner ? `${winner} wins!` : "It's a draw";
    const dialogDesc = winner
        ? "Nice one. Want to run it back?"
        : "Nobody cracked it this round. Rematch?";
    const titleClass =
        state.status === "x_won" ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent"
            : state.status === "o_won" ? "bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent"
                : "";


    function handleSquareClick(i: number) {
        dispatch({ type: "PLAY", index: i });
    }

    function handleNewGame() {
        dispatch({ type: "NEW_GAME", alternateStarter: true });
        setWinOpen(false);
    }

    function isInProgress() {
        return state.status === "playing" && state.board.some(Boolean);
    }

    function handleModeChange(mode: Mode) {
        if (isInProgress()) {
            setPendingMode(mode);
            setConfirmOpen(true);
        } else {
            dispatch({ type: "SET_MODE", mode });
        }
    }

    function handleUndo() {
        dispatch({ type: "UNDO" });
    }

    function handleResetScores() {
        const zeroed = { X: 0, O: 0, draws: 0 };
        setScores(zeroed);
        try {
            localStorage.setItem(scoreKey, JSON.stringify(zeroed)); // <-- use scoreKey
        } catch { }
    }


    function markClasses(mark: "X" | "O" | null) {
        if (mark === "X") {
            return "bg-gradient-to-br from-rose-500 to-fuchsia-500 text-transparent bg-clip-text drop-shadow";
        }
        if (mark === "O") {
            return "bg-gradient-to-br from-sky-500 to-cyan-400 text-transparent bg-clip-text drop-shadow";
        }
        return "";
    }

    function Mark({ m }: { m: "X" | "O"; }) {
        return (
            <span className={cn("font-extrabold", markClasses(m))}>
                {m}
            </span>
        );
    }


    const oldestIdx =
        state.mode === "bolt" && (state.oQueue.length === 3 && state.xQueue.length === 3)
            ? (state.current === "X" ? state.xQueue[0] : state.oQueue[0])
            : undefined;
    return (
        <Card className="mx-auto max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Tic-Tac-Toe</span>
                    <ToggleGroup
                        type="single"
                        value={state.mode}
                        onValueChange={(value) => {
                            if (!value || value === state.mode) return;
                            handleModeChange(value as Mode);
                        }}
                    >
                        <ToggleGroupItem value="classic">Classic</ToggleGroupItem>
                        <ToggleGroupItem value="bolt">Bolt</ToggleGroupItem>
                    </ToggleGroup>

                    <span className="text-sm font-normal text-muted-foreground">
                        X: <strong>{scores.X}</strong> · O: <strong>{scores.O}</strong>
                        {state.mode === "classic" && <> · Draws: <strong>{scores.draws}</strong></>}
                    </span>
                </CardTitle>
                {state.mode === "bolt" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        Bolt mode: each player may have at most 3 marks; the oldest is removed on the 4th.
                    </p>
                )}
                <CardDescription aria-live="polite">{statusText}</CardDescription>
            </CardHeader>

            <CardContent>

                <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3 sm:max-w-md">
                    {state.board.map((mark, i) => {
                        const row = Math.floor(i / 3) + 1;
                        const col = (i % 3) + 1;
                        const winning = state.winLine ? state.winLine.includes(i as any) : false;
                        const disabled = state.status !== "playing" || !!mark;
                        const winRing =
                            state.status === "x_won" ? "ring-rose-500"
                                : state.status === "o_won" ? "ring-sky-500"
                                    : "ring-primary";

                        // NEW: oldest indicator for current player in Bolt
                        const isOldest =
                            state.mode === "bolt" &&
                            state.status === "playing" &&
                            mark === state.current &&
                            i === oldestIdx;

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSquareClick(i)}
                                disabled={disabled}
                                aria-label={`Row ${row}, Column ${col}, ${mark ?? "empty"}${isOldest ? " (oldest)" : ""}`}
                                className={cn(
                                    // add "relative" so we can position the dot
                                    "relative aspect-square w-full rounded-xl border text-3xl font-semibold leading-none outline-none transition",
                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    disabled ? "cursor-not-allowed opacity-80" : "hover:bg-accent hover:text-accent-foreground",
                                    winning && cn("ring-2", winRing, "shadow-[0_0_0_3px_hsl(var(--arcade-primary)/0.25)]"),
                                    // optional: make the oldest one pop a hair
                                    isOldest && "shadow-inner"
                                )}
                            >
                                {/* tiny corner dot to mark "oldest" */}
                                {isOldest && (
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "pointer-events-none absolute top-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-background shadow",
                                            state.current === "X" ? "bg-rose-500" : "bg-sky-500"
                                        )}
                                    />
                                )}

                                {mark ? (
                                    <span
                                        className={cn(
                                            "text-4xl sm:text-5xl font-black tracking-tight select-none",
                                            "animate-in zoom-in-50 fade-in-50 duration-500 ease-out",
                                            markClasses(mark),
                                            isOldest && "opacity-95" // subtle emphasis (optional)
                                        )}
                                    >
                                        {mark}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}

                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    <Button onClick={handleNewGame}>New Game</Button>
                    {state.mode === "classic" && (
                        <Button variant="outline" onClick={handleUndo} disabled={state.history.length === 0}>
                            Undo
                        </Button>
                    )}

                </div>
                <Separator className="sm:hidden" />
                <Button variant="secondary" onClick={handleResetScores}>
                    Reset Scores
                </Button>
            </CardFooter>
            <Dialog open={winOpen} onOpenChange={setWinOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={cn("text-3xl font-black", titleClass)}>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDesc}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button onClick={handleNewGame}>Play again</Button>
                        <Button variant="secondary" onClick={() => setWinOpen(false)}>
                            Keep board
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={cn("text-3xl font-black", titleClass)}>Are you sure?</DialogTitle>
                        <DialogDescription>Changing modes will reset the game.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            onClick={() => {
                                if (pendingMode) {
                                    dispatch({ type: "SET_MODE", mode: pendingMode });
                                    setPendingMode(null);
                                }
                                setConfirmOpen(false);
                            }}
                        >
                            Yes
                        </Button>
                        <Button variant="secondary" onClick={() => { setPendingMode(null); setConfirmOpen(false); }}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </Card>
    );
}
