"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Player } from "./logic";
import { reducer, initialState } from "./state";

type Scores = { X: number; O: number; draws: number; };

const SCORE_KEY = "next-arcade:tictactoe:scores";

export default function TicTacToeGame() {
    const [state, dispatch] = useReducer(reducer, undefined, initialState);
    const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 });

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

    const statusText = (() => {
        switch (state.status) {
            case "playing":
                return `Turn: ${state.current}`;
            case "x_won":
                return "X wins!";
            case "o_won":
                return "O wins!";
            case "draw":
                return "It’s a draw.";
        }
    })();

    function handleSquareClick(i: number) {
        dispatch({ type: "PLAY", index: i });
    }

    function handleNewGame() {
        // Alternate starter based on previous winner for fun; set to false to always start X
        dispatch({ type: "NEW_GAME", alternateStarter: true });
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
                <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2 sm:max-w-sm">
                    {state.board.map((mark, i) => {
                        const row = Math.floor(i / 3) + 1;
                        const col = (i % 3) + 1;
                        const winning = state.winLine ? state.winLine.includes(i as any) : false;
                        const disabled = state.status !== "playing" || !!mark;

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
                                    winning && "ring-2 ring-primary"
                                )}
                            >
                                {mark ?? ""}
                            </button>
                        );
                    })}
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    <Button onClick={handleNewGame}>New Game</Button>
                    <Button variant="outline" onClick={handleUndo} disabled={state.history.length === 0}>
                        Undo
                    </Button>
                </div>
                <Separator className="sm:hidden" />
                <Button variant="secondary" onClick={handleResetScores}>
                    Reset Scores
                </Button>
            </CardFooter>
        </Card>
    );
}
