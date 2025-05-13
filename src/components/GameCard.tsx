// src/components/GameCard.tsx
import { FC, useState, useEffect, useCallback, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useProgram } from "../hooks/useProgram";
import handleGuess from "../handlers/handleGuess";
import handleReveal from "../handlers/handleReveal";
import { GameButton, GameState } from "./GameButton";
import useUserSOLBalanceStore from "../stores/useUserSOLBalanceStore";
import { motion } from "framer-motion";
import { handleResetGame } from "../handlers/handleResetGame";
import { Console } from "../components/Console";
import { FaCoins, FaDice } from "react-icons/fa";
import { notify } from "../utils/notifications";

export const GameCard: FC = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const program = useProgram();

  const [wager, setWager] = useState("");
  const [guess, setGuess] = useState("");
  const [gameState, setGameState] = useState<GameState>("ReadyToGuess");
  const [sessionWager, setSessionWager] = useState<number | null>(null);
  const [payoutSOL, setPayoutSOL] = useState<number | null>(null);
  const [didWin, setDidWin] = useState<boolean | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const balance = useUserSOLBalanceStore((s) => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  useEffect(() => {
    if (!wallet?.publicKey) return;
    getUserSOLBalance(wallet.publicKey, connection);
    const iv = setInterval(() => getUserSOLBalance(wallet.publicKey!, connection), 10000);
    const listener = connection.onAccountChange(
      wallet.publicKey,
      () => getUserSOLBalance(wallet.publicKey!, connection),
      "confirmed"
    );
    return () => {
      clearInterval(iv);
      connection.removeAccountChangeListener(listener);
    };
  }, [wallet?.publicKey, connection, getUserSOLBalance]);

  const getSessionPda = useCallback((): PublicKey | null => {
    if (!wallet?.publicKey || !program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from("session"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];
  }, [wallet, program]);

  const refreshSession = useCallback(async () => {
    const sessionPda = getSessionPda();
    if (!sessionPda || !program) return;
    try {
      const session = await (program.account as any).gameSession.fetch(sessionPda);
      setSessionWager(session.wager.toNumber());
      if ("waitingReveal" in session.state) {
        setGameState("WaitingReveal");
        setDidWin(null);
        setPayoutSOL(null);
      } else if ("revealed" in session.state) {
        setGameState("Revealed");
        const payout = session.payout.toNumber();
        setDidWin(payout > 0);
        setPayoutSOL(payout / LAMPORTS_PER_SOL);
      } else {
        setGameState("ReadyToGuess");
      }
    } catch {
      setGameState("ReadyToGuess");
      setSessionWager(null);
      setPayoutSOL(null);
      setDidWin(null);
    }
  }, [getSessionPda, program]);

  useEffect(() => {
    refreshSession();
    const iv = setInterval(refreshSession, 10000);
    return () => clearInterval(iv);
  }, [refreshSession]);

  useEffect(() => {
    if (!program) return;
    let listener: number;
    (async () => {
      listener = await program.addEventListener("GameResultEvent", (ev: any) => {
        setGameState("Revealed");
        setDidWin(ev.payout > 0);
        setPayoutSOL(ev.payout / LAMPORTS_PER_SOL);
        setSessionWager(ev.wager);
      });
    })();
    return () => {
      if (listener !== undefined) program.removeEventListener(listener);
    };
  }, [program]);

  const multiplier = useMemo<number | null>(() => {
    if (sessionWager && payoutSOL !== null) {
      const wagerSOL = sessionWager / LAMPORTS_PER_SOL;
      return wagerSOL > 0 ? payoutSOL / wagerSOL : null;
    }
    return null;
  }, [sessionWager, payoutSOL]);

  const submitGuess = async () => {
    if (!wallet || !program) return;

    const parsedWager = parseFloat(wager);
    const parsedGuess = guess.trim();

    if (isNaN(parsedWager) || parsedWager <= 0) {
      notify({ type: "error", message: "Wager must be greater than 0." });
      return;
    }

    if (parsedGuess === "") {
      notify({ type: "error", message: "Please enter a guess between 0 and 255." });
      return;
    }

    const guessNumber = Number(parsedGuess);

    if (isNaN(guessNumber) || guessNumber < 0 || guessNumber > 255) {
      notify({ type: "error", message: "Guess must be a number between 0 and 255." });
      return;
    }

    setIsSettling(true);
    try {
      const { txSig } = await handleGuess({
        guess: guessNumber,
        wagerSOL: parsedWager,
        wallet,
        program,
        connection,
      });
      if (!txSig) throw new Error("No transaction signature");
      await connection.confirmTransaction(txSig, "confirmed");
      await refreshSession();
    } catch (err: any) {
      if (err.errorCode?.number === 6005) {
        notify({ type: "error", message: "A previous game is still open. Please reveal or reset first." });
      } else {
        notify({ type: "error", message: err.message || "Guess failed" });
      }
    } finally {
      setIsSettling(false);
    }
  };

  const submitReveal = async () => {
    if (!wallet || !program) return;
    setIsSettling(true);
    try {
      const { txSig } = await handleReveal({ wallet, program, connection });
      if (!txSig) throw new Error("No transaction signature");
      await connection.confirmTransaction(txSig, "confirmed");
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
      const res = await handleResetGame({ wallet, program });
      if (res?.success) await refreshSession();
    } catch (err: any) {
      notify({ type: "error", message: err.message || "Reset failed" });
    } finally {
      setIsSettling(false);
    }
  };

  const isDisabled =
    isSettling ||
    gameState === "WaitingReveal" ||
    gameState === "Calculating" ||
    gameState === "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="
        w-full max-w-[420px] mx-auto p-6
        bg-[var(--card-bg)] border border-[var(--card-border)]
        rounded-2xl shadow-xl space-y-6 relative text-[var(--card-text)]
      "
    >
      <header className="flex flex-col items-center space-y-2">
        <h2 className="text-2xl font-bold text-black">Reveal255</h2>

        {wallet && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
            <span className="text-black">🪙</span>

              <span className="font-medium text-black">
                {balance.toFixed(3)} SOL
              </span>
            </div>
            <div className="flex items-center space-x-1">
            <span className="text-black">🎲</span>
              {gameState === "Revealed" ? (
                didWin ? (
                  <span className="badge badge-success badge-sm">×{multiplier?.toFixed(2)}</span>
                ) : (
                  <span className="badge badge-error badge-sm">Try Again</span>
                )
              ) : (
                <span className="badge badge-outline badge-sm text-black">
                  {gameState}
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-black/70 mb-1 uppercase">
            Wager (SOL)
          </label>
          <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">🪙</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              disabled={isDisabled}
              placeholder="0.1"
              className="
                w-full pl-10 pr-4 py-2
                bg-[var(--input-bg)] border border-[var(--card-border)]
                rounded-lg text-[var(--card-text)] placeholder:text-black/50
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
              "
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-black/70 mb-1 uppercase">
            Your Guess
          </label>
          <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">🎲</span>

            <input
              type="number"
              min={0}
              max={255}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={isDisabled}
              placeholder="0–255"
              className="
                w-full pl-10 pr-4 py-2
                bg-[var(--input-bg)] border border-[var(--card-border)]
                rounded-lg text-[var(--card-text)] placeholder:text-black/50
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
              "
            />
          </div>
        </div>

        <GameButton
          gameState={gameState}
          onGuess={submitGuess}
          onReveal={submitReveal}
          isLoading={isSettling}
        />
      </div>

      <div className="bg-[var(--console-bg)] p-3 rounded-lg text-xs font-mono text-black">
        <Console />
      </div>

      <footer className="flex justify-between items-center">
        <button
          onClick={resetGame}
          disabled={isSettling}
          className="
            text-xs text-[var(--error)]
            hover:text-[var(--error-focus)]
            underline disabled:opacity-50
          "
        >
          Reset Game
        </button>
      </footer>

      {isSettling && (
        <div className="absolute inset-0 bg-[var(--overlay)] flex items-center justify-center rounded-2xl">
          <span className="text-lg font-semibold text-black animate-pulse">
            Waiting for blockchain…
          </span>
        </div>
      )}
    </motion.div>
  );
};
