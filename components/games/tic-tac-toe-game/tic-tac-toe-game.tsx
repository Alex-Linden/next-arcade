"use client";

import { useState } from "react";

type Square = "X" | "O" | null;

type Board = Square[];

const EMPTY_BOARD: Board = Array(9).fill(null);

