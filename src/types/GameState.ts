// src/types/GameState.ts
export type GameState =
  | "ReadyToGuess"
  | "WaitingReveal"
  | "RevealingPendingResult"
  | "Revealed"
  | "Calculating";
