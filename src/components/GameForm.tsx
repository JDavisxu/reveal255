// src/components/GameForm.tsx

import { FC } from "react";
import { GameState } from "../types/GameState";

type Props = {
  currency: "SOL" | "USD";
  wager: string;
  guess: string;
  onWagerChange: (value: string) => void;
  onGuessChange: (value: string) => void;
  solPrice: number | null;
  gameState?: GameState;
};

export const GameForm: FC<Props> = ({
  currency,
  wager,
  guess,
  onWagerChange,
  onGuessChange,
  solPrice,
  gameState = "ReadyToGuess",
}) => {
  const numericWager = parseFloat(wager);
  const converted =
    solPrice && !isNaN(numericWager)
      ? currency === "USD"
        ? `≈ ${(numericWager / solPrice).toFixed(3)} SOL`
        : `≈ $${(numericWager * solPrice).toFixed(2)}`
      : "≈ $0.00";

  const isDisabled = gameState !== "ReadyToGuess";
  const containerBorderClass = isDisabled ? "border-2 border-red-400" : "";

  return (
    <div className={`bg-[var(--input-bg)] rounded-xl p-4 space-y-4 mt-2 shadow-sm ${containerBorderClass}`}>
      {/* Wager input */}
      <div>
        <label className="block text-xs font-medium mb-1 uppercase text-[var(--text-muted)]">
          Wager ({currency})
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            value={wager}
            onChange={(e) => onWagerChange(e.target.value)}
            placeholder={currency === "USD" ? "e.g. 5.00" : "e.g. 0.1"}
            className="input pr-20"
            disabled={isDisabled}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">
            {converted}
          </span>
        </div>
      </div>

      {/* Guess input */}
      <div>
        <label className="block text-xs font-medium mb-1 uppercase text-[var(--text-muted)]">
          Your Guess (0–255)
        </label>
        <input
          type="number"
          min={0}
          max={255}
          value={guess}
          onChange={(e) => onGuessChange(e.target.value)}
          placeholder="e.g. 128"
          className="input"
          disabled={isDisabled}
        />
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
        Due to Solana's program architecture, you will be asked to confirm two transactions.
      </p>
    </div>
  );
};
