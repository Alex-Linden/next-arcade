"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";

// import type { Player } from "./logic";
import { reducer, initialState } from "./state";

type Scores = { X: number; O: number; draws: number; };

const SCORE_KEY = "next-arcade:tictactoe:scores";

export default function TicTacToeGame() {
    const [state, dispatch] = useReducer(reducer, undefined, initialState);
    const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 });
    const [winOpen, setWinOpen] = useState(false);

    // Load scores once
    useEffect(() => {
        try {
            const raw = localStorage.getItem(SCORE_KEY);
            if (raw) setScores(JSON.parse(raw));
        } catch { }
    }, []);

    // Persist scores when they change
    useEffect(() => {
        try {
            localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
        } catch { }
    }, [scores]);

    useEffect(() => {
        if (prevStatus.current === "playing" && state.status !== "playing") {
            const tid = setTimeout(() => setWinOpen(true), 500);
            return () => clearTimeout(tid);
        }
        if (state.status === "playing") setWinOpen(false);
    }, [state.status]);

    // Increment scores once per game end
    const prevStatus = useRef(state.status);
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


    function handleUndo() {
        dispatch({ type: "UNDO" });
    }

    function handleResetScores() {
        const zeroed = { X: 0, O: 0, draws: 0 };
        setScores(zeroed);
        try {
            localStorage.setItem(SCORE_KEY, JSON.stringify(zeroed));
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


    return (
        <Card className="mx-auto max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Tic-Tac-Toe</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        X: <strong>{scores.X}</strong> · O: <strong>{scores.O}</strong> · Draws:{" "}
                        <strong>{scores.draws}</strong>
                    </span>
                </CardTitle>
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

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSquareClick(i)}
                                disabled={disabled}
                                aria-label={`Row ${row}, Column ${col}, ${mark ?? "empty"}`}
                                className={cn(
                                    "aspect-square w-full rounded-xl border text-3xl font-semibold leading-none outline-none transition",
                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    disabled ? "cursor-not-allowed opacity-80" : "hover:bg-accent hover:text-accent-foreground",
                                    winning && cn("ring-2", winRing, "shadow-[0_0_0_3px_hsl(var(--arcade-primary)/0.25)]")
                                )}
                            >
                                {mark ? (
                                    <span
                                        className={cn(
                                            "text-4xl sm:text-5xl font-black tracking-tight select-none",
                                            "animate-in zoom-in-50 fade-in-50 duration-500 ease-out",
                                            markClasses(mark)
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
                    <Button variant="outline" onClick={handleUndo}
                        disabled={state.mode === "bolt" || state.history.length === 0}>
                        Undo
                    </Button>
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

        </Card>
    );
}
