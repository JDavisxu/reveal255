// src/components/GameCard.tsx

import { FC, useState, useEffect, useCallback } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { motion } from "framer-motion";
import { FaCoins, FaDice } from "react-icons/fa";

import { useProgram } from "../hooks/useProgram";
import handleGuess from "../handlers/handleGuess";
import handleReveal from "../handlers/handleReveal";
import { handleResetGame } from "../handlers/handleResetGame";
import useUserSOLBalanceStore from "../stores/useUserSOLBalanceStore";
import { GameButton } from "./GameButton";
import { GameVisualizer } from "./GameVisualizer";
import { GameState } from "../types/GameState";
import { notify } from "../utils/notifications";
import { sleep } from "../utils/sleep";


// Helper to convert lamports → SOL
const toSOL = (lamports: number) => lamports / LAMPORTS_PER_SOL;
const BUFFER = 800; // ms

export const GameCard: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const program = useProgram();

  // Local form state
  const [wagerInput, setWagerInput] = useState("");
  const [guessInput, setGuessInput] = useState("");

  // Session state
  const [confirmedGuess, setConfirmedGuess] = useState<number | null>(null);
  const [sessionWagerLamports, setSessionWagerLamports] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [payoutSOL, setPayoutSOL] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>("ReadyToGuess");
  const [lastRevealTxSig, setLastRevealTxSig] = useState<string | null>(null);

  // Loading indicator for on-chain txs
  const [isSettling, setIsSettling] = useState(false);

  // Your SOL balance
  const balance = useUserSOLBalanceStore(s => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  // Keep balance fresh
  useEffect(() => {
    if (!wallet?.publicKey) return;
    getUserSOLBalance(wallet.publicKey, connection);
    const id = setInterval(() => getUserSOLBalance(wallet.publicKey!, connection), 10000);
    const listener = connection.onAccountChange(
      wallet.publicKey,
      () => getUserSOLBalance(wallet.publicKey!, connection),
      "confirmed"
    );
    return () => {
      clearInterval(id);
      connection.removeAccountChangeListener(listener);
    };
  }, [wallet?.publicKey, connection, getUserSOLBalance]);

  // Derive your session PDA
  const getSessionPda = useCallback((): PublicKey | null => {
    if (!wallet?.publicKey || !program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from("session"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];
  }, [wallet, program]);

  // Fetch on-chain session state
  const refreshSession = useCallback(async () => {
    const pda = getSessionPda();
    if (!pda || !program) return;

    try {
      const session: any = await (program.account as any).gameSession.fetch(pda);

      // Store lamports and guess from on-chain session
      setSessionWagerLamports(session.wager.toNumber());
      setConfirmedGuess(session.guess);
      setResult(session.result);

      // Move state machine
      if (session.state.waitingReveal) {
        setGameState("WaitingReveal");
      } else if (session.state.revealed) {
        setGameState("Revealed");
        // convert payout lamports → SOL
        setPayoutSOL(toSOL(session.payout.toNumber()));
      } else {
        setGameState("ReadyToGuess");
      }
    } catch {
      // No session or error → back to start
      setConfirmedGuess(null);
      setSessionWagerLamports(null);
      setResult(null);
      setPayoutSOL(null);
      setGameState("ReadyToGuess");
    }
  }, [getSessionPda, program]);

  // Poll every 10s (and once immediately)
  useEffect(() => {
    refreshSession();
    const poll = setInterval(refreshSession, 10000);
    return () => clearInterval(poll);
  }, [refreshSession]);

  // === Handlers ===
  const submitGuess = async () => {
    if (!wallet || !program) return;
  
    const amountSOL = Number(wagerInput);
    const guessNum = Number(guessInput);
  
    if (amountSOL <= 0) {
      return notify({ type: "error", message: "Wager must be > 0." });
    }
    if (!Number.isInteger(guessNum) || guessNum < 0 || guessNum > 255) {
      return notify({ type: "error", message: "Guess must be 0–255." });
    }
  
    // kickoff spinner and reset old values
    setConfirmedGuess(guessNum);
    setSessionWagerLamports(amountSOL * LAMPORTS_PER_SOL);
    setResult(null);
    setPayoutSOL(null);
    setLastRevealTxSig(null);
    setGameState("WaitingReveal");
    setIsSettling(true);
  
    try {
      // Fire the on-chain guess and confirm, but also await a minimum delay
      const guessPromise = handleGuess({
        guess: guessNum,
        wagerSOL: amountSOL,
        wallet,
        program,
        connection,
      }).then(({ txSig }) => {
        if (!txSig) throw new Error("No signature returned");
        return connection.confirmTransaction(txSig, "confirmed");
      });
  
      // Wait for both the transaction and at least 500 ms
      await Promise.all([guessPromise, sleep(500)]);
  
      // Refresh session once both are done
      await refreshSession();
    } catch (err: any) {
      notify({ type: "error", message: err.message || "Guess failed" });
      // revert to initial state on error
      setGameState("ReadyToGuess");
    } finally {
      setIsSettling(false);
    }
  };

  const submitReveal = async () => {
    if (!wallet || !program || gameState !== "WaitingReveal") return;
  
    setIsSettling(true);
  
    try {
      // Fire the on-chain reveal and confirm, but also await a minimum delay
      const revealPromise = handleReveal({ wallet, program, connection }).then(
        ({ txSig }) => {
          if (!txSig) throw new Error("No signature returned");
          setLastRevealTxSig(txSig);
          return connection.confirmTransaction(txSig, "confirmed");
        }
      );
  
      // Wait for both the transaction and at least 500 ms
      await Promise.all([revealPromise, sleep(500)]);
  
      // Once both are done, refresh session to transition to "Revealed"
      await refreshSession();
    } catch (err: any) {
      notify({ type: "error", message: err.message || "Reveal failed" });
    } finally {
      setIsSettling(false);
    }
  };
  

  const resetGame = async () => {
    if (!wallet || !program) return;
    setIsSettling(true);
    try {
      await handleResetGame({ wallet, program });
      await refreshSession();
    } catch (err: any) {
      notify({ type: "error", message: err.message || "Reset failed" });
    } finally {
      setIsSettling(false);
    }
  };

  // Disable inputs while settling or during the spin
  const isDisabled = isSettling || gameState === "WaitingReveal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="w-full max-w-[360px] mx-auto p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl space-y-6 relative text-[var(--card-text)]"
    >
      {/* Header */}
      <header className="flex flex-col items-center space-y-2">
        <h2 className="text-2xl font-bold text-black">Reveal255</h2>
        {wallet && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <FaCoins /><span>{balance.toFixed(3)} SOL</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaDice />
              {gameState === "Revealed" ? (
                payoutSOL! > 0 ? (
                  <span className="badge badge-success badge-sm">×{(payoutSOL! / (sessionWagerLamports! / LAMPORTS_PER_SOL)).toFixed(2)}</span>
                ) : (
                  <span className="badge badge-error badge-sm">Try Again</span>
                )
              ) : (
                <span className="badge badge-outline badge-sm">{gameState}</span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Inputs & Visualizer */}
      <div className="space-y-4">
        {/* Wager */}
        <div>
          <label className="block text-xs font-medium mb-1 uppercase">Wager (SOL)</label>
          <div className="relative">
            <FaCoins className="absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={wagerInput}
              onChange={e => setWagerInput(e.target.value)}
              disabled={isDisabled}
              placeholder="0.1"
              className="w-full pl-10 py-2 rounded-lg border"
            />
          </div>
        </div>

        {/* Guess */}
        <div>
          <label className="block text-xs font-medium mb-1 uppercase">Your Guess</label>
          <div className="relative">
            <FaDice className="absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="number"
              min={0}
              max={255}
              value={guessInput}
              onChange={e => setGuessInput(e.target.value)}
              disabled={isDisabled}
              placeholder="0–255"
              className="w-full pl-10 py-2 rounded-lg border"
            />
          </div>
        </div>

        {/* Action & Visualizer */}
        <GameButton
          gameState={gameState}
          onGuess={submitGuess}
          onReveal={submitReveal}
          isLoading={isSettling}
        />

        <GameVisualizer
          guess={confirmedGuess}
          result={result}
          wager={sessionWagerLamports != null ? toSOL(sessionWagerLamports) : null}
          payoutSOL={payoutSOL}
          gameState={gameState}
          txSig={lastRevealTxSig}
        />
      </div>

      {/* Footer */}
      <footer className="flex justify-between items-center">
        <button
          onClick={resetGame}
          disabled={isSettling}
          className="text-xs text-red-600 underline disabled:opacity-50"
        >
          Reset Game
        </button>
      </footer>

      {/* On-chain overlay */}
      {isSettling && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl">
          <span className="animate-pulse font-semibold">Waiting for blockchain…</span>
        </div>
      )}
    </motion.div>
  );
};
