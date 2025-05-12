// src/components/GameButton.tsx
import React, { FC, memo } from "react";
import { FaSearch, FaSyncAlt } from "react-icons/fa";

export type GameState =
  | "ReadyToGuess"
  | "WaitingReveal"
  | "RevealingPendingResult"
  | "Revealed"
  | "Calculating"
  | "Unknown";

export interface GameButtonProps {
  gameState: GameState;
  onGuess: () => void;
  onReveal: () => void;
  isLoading?: boolean;
}

export const GameButton: FC<GameButtonProps> = memo(
  ({ gameState, onGuess, onReveal, isLoading = false }) => {
    // base shape & animation
    const base = [
      "w-full",
      "flex items-center justify-center gap-2",
      "px-6 py-3",
      "text-sm font-semibold",
      "rounded-2xl",
      "transition-transform duration-200 transform",
      "shadow-lg",
      "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
    ].join(" ");

    // darker gradient so white text stands out
    const active = [
      "bg-gradient-to-r",
      "from-[var(--primary-dark)]",
      "to-[var(--accent-dark)]",
      "bg-opacity-95",
      "text-white",
      "hover:-translate-y-1",
      "hover:shadow-2xl",
      "drop-shadow-md",       // text drop-shadow
    ].join(" ");

    // disabled look
    const disabled = [
      "bg-gray-200",
      "text-gray-500",
      "cursor-not-allowed",
      "opacity-60",
    ].join(" ");

    // pulse for loading/calculating
    const pulse = "animate-pulse border-2 border-[var(--accent-dark)]";

    let label = "";
    let icon = null;
    let handler: (() => void) | undefined;
    let isDisabled = true;
    let isPulsing = false;

    switch (gameState) {
      case "ReadyToGuess":
        label = "Submit Guess";
        handler = onGuess;
        isDisabled = false;
        break;
      case "WaitingReveal":
        label = "Reveal";
        handler = onReveal;
        isDisabled = false;
        break;
      case "RevealingPendingResult":
        label = "⏳ Processing…";
        isPulsing = true;
        break;
      case "Calculating":
        label = "Calculating…";
        isPulsing = true;
        break;
      case "Revealed":
        label = "Play Again";
        handler = onGuess;
        isDisabled = false;
        break;
      default:
        label = "⏸Please Wait";
        
    }

    const classes = [
      base,
      isDisabled || isLoading ? disabled : active,
      isPulsing ? pulse : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button onClick={handler} disabled={isDisabled || isLoading} className={classes}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }
);

GameButton.displayName = "GameButton";
