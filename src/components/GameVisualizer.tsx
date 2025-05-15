// src/components/GameVisualizer.tsx

import { FC } from "react";
import { GameState } from "../types/GameState";

interface Props {
  guess: number | null;
  result: number | null;
  wager: number | null;
  gameState: GameState;
  payoutSOL: number | null;
  txSig: string | null;
  solPrice?: number | null;
}

export const GameVisualizer: FC<Props> = ({
  guess,
  result,
  wager,
  gameState,
  payoutSOL,
  txSig,
  solPrice,
}) => {
  if (gameState === "WaitingReveal") {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm font-medium animate-pulse text-[var(--text-muted)]">
          Revealing result…
        </span>
      </div>
    );
  }

  if (gameState === "Revealed" && result !== null && guess !== null) {
    const forward = (256 + guess - result) % 256;
    const backward = (256 + result - guess) % 256;
    const distance = Math.min(forward, backward);

    let multiplier = 0;
    if (distance === 0) multiplier = 15;
    else if (distance >= 1 && distance <= 10) multiplier = 4.5;
    else if (distance >= 11 && distance <= 20) multiplier = 3;
    else if (distance >= 21 && distance <= 40) multiplier = 1.25;
    else if (distance >= 41 && distance <= 50) multiplier = 0.5;
    else multiplier = 0;

    const payoutUSD = solPrice && payoutSOL != null ? payoutSOL * solPrice : null;

    return (
      <div className="flex flex-col items-center bg-[var(--card-bg)] text-[var(--text-main)] p-4 rounded-2xl shadow-md space-y-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Winning Number</p>
        <div className="text-5xl font-bold text-[var(--primary-dark)]">{result}</div>
        <div className="w-full text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Your Guess</span>
            <span className="font-semibold text-[var(--text-main)]">{guess}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Distance</span>
            <span className="font-semibold text-[var(--text-main)]">{distance}</span>
          </div>
          {multiplier > 0 ? (
            <>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Multiplier</span>
                <span className="font-semibold text-green-600">x{multiplier.toFixed(2)}</span>
              </div>
              {payoutUSD != null && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Payout (USD)</span>
                  <span className="font-semibold">${payoutUSD.toFixed(2)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-red-600 font-semibold mt-2">No payout</div>
          )}
        </div>
        {txSig && (
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--accent)] hover:underline pt-2"
          >
            View on Explorer
          </a>
        )}
      </div>
    );
  }

  return null;
};
