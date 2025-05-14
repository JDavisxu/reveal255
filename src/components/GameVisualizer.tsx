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
}

export const GameVisualizer: FC<Props> = ({
  guess,
  result,
  wager,
  gameState,
  payoutSOL,
  txSig,
}) => {
  // While we’re waiting for the reveal, just show Loading…
  if (gameState === "WaitingReveal") {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-lg font-medium">waiting.....</span>
      </div>
    );
  }

  // Once revealed, show the real result
  if (gameState === "Revealed" && result !== null && guess !== null) {
    const forward = (256 + guess - result) % 256;
    const backward = (256 + result - guess) % 256;
    const distance = Math.min(forward, backward);
    const multiplier = wager && payoutSOL != null ? payoutSOL / wager : null;

    return (
      <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-md space-y-4">
        <p className="text-lg font-semibold uppercase">Winning Number</p>
        <div className="text-6xl font-extrabold">{result}</div>
        <div className="w-full text-center text-sm space-y-1">
          <p>🎯 Your Guess: <strong>{guess}</strong></p>
          <p>📏 Distance: <strong>{distance}</strong></p>
          <p>
            {multiplier && multiplier > 0
              ? <>💰 Payout: <strong>x{multiplier.toFixed(2)}</strong></>
              : <>💀 No payout</>}
          </p>
        </div>
        {txSig && (
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View on Explorer
          </a>
        )}
      </div>
    );
  }

  // Before you’ve guessed, or after a reset, show nothing (or a placeholder)
  return null;
};
