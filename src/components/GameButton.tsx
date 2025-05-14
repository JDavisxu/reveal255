// src/components/GameButton.tsx

import React, { FC, memo, useMemo } from "react";
import { GameState } from "../types/GameState";

export interface GameButtonProps {
  gameState: GameState;
  onGuess: () => void;
  onReveal: () => void;
  isLoading?: boolean;
}

export const GameButton: FC<GameButtonProps> = memo(
  ({ gameState, onGuess, onReveal, isLoading = false }) => {
    const { label, handler, pulsing, stateDisabled } = useMemo(() => {
      let label = "⏸ Please Wait",
        handler: (() => void) | undefined,
        pulsing = false,
        stateDisabled = true;

      switch (gameState) {
        case "ReadyToGuess":
          label = "Submit Guess";
          handler = onGuess;
          stateDisabled = false;
          break;

        case "WaitingReveal":
          label = "Reveal";
          handler = onReveal;
          pulsing = true;          // ← pulsate here
          stateDisabled = false;
          break;

        case "RevealingPendingResult":
          label = "⏳ Processing…";
          pulsing = true;
          stateDisabled = true;
          break;

        case "Calculating":
          label = "Calculating…";
          pulsing = true;
          stateDisabled = true;
          break;

        case "Revealed":
          label = "Play Again";
          handler = onGuess;
          stateDisabled = false;
          break;
      }

      return { label, handler, pulsing, stateDisabled };
    }, [gameState, onGuess, onReveal]);

    const disabled = stateDisabled || isLoading;

    const base = "w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-2xl shadow-lg transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
    const active = "bg-gradient-to-r from-[var(--primary-dark)] to-[var(--accent-dark)] text-white hover:-translate-y-1 hover:shadow-2xl drop-shadow-md";
    const inactive = "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60";
    const pulse = "animate-pulse border-2 border-[var(--accent-dark)]";

    const classes = [
      base,
      disabled ? inactive : active,
      pulsing ? pulse : "",
    ].join(" ");

    return (
      <button
        className={classes}
        disabled={disabled}
        onClick={() => {
          if (!disabled && handler) handler();
        }}
      >
        {label}
      </button>
    );
  }
);

GameButton.displayName = "GameButton";
