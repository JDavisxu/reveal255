// src/components/GameCard.tsx

import { FC, useEffect, useState } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CardStock } from "./CardStock";
import useUserSOLBalanceStore from "../stores/useUserSOLBalanceStore";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { useSolPrice } from "../hooks/useSolPrice";
import { GameForm } from "./GameForm";
import { GameButton } from "./GameButton";
import { GameVisualizer } from "./GameVisualizer";
import { GameState } from "../types/GameState";
import { handleGuess } from "../handlers/handleGuess";
import { handleReveal } from "../handlers/handleReveal";
import { request } from "../utils/request";
import { useProgram } from "../hooks/useProgram";

export const GameCard: FC = () => {
  const [currency, setCurrency] = useState<"SOL" | "USD">("SOL");
  const [wager, setWager] = useState("");
  const [guess, setGuess] = useState("");
  const [gameState, setGameState] = useState<GameState>("ReadyToGuess");
  const [confirmedGuess, setConfirmedGuess] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [payoutSOL, setPayoutSOL] = useState<number | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const balance = useUserSOLBalanceStore(s => s.balance);
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const solPrice = useSolPrice();
  const program = useProgram();

  useEffect(() => {
    if (!wallet?.publicKey) return;
    getUserSOLBalance(wallet.publicKey, connection);
    const interval = setInterval(() => {
      getUserSOLBalance(wallet.publicKey!, connection);
    }, 10000);
    return () => clearInterval(interval);
  }, [wallet?.publicKey, connection, getUserSOLBalance]);

  const toggleCurrency = () =>
    setCurrency(prev => (prev === "SOL" ? "USD" : "SOL"));

  const displayBalance =
    currency === "USD" && solPrice
      ? `$${(balance * solPrice).toFixed(2)} USD`
      : `${balance.toFixed(3)} SOL`;

  const handleSubmitGuess = async () => {
    if (!wallet || !wallet.publicKey || !guess || !wager || !program) return;

    const parsedGuess = parseInt(guess);
    const parsedWager = parseFloat(wager);
    const solWager = currency === "USD" && solPrice ? parsedWager / solPrice : parsedWager;

    const serverSeed = crypto.getRandomValues(new Uint8Array(32));
    const { commitment } = await request<{ commitment: string }>('/api/startGame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerPublicKey: wallet.publicKey.toBase58(),
        serverSeed: Array.from(serverSeed),
      }),
    });

    const commitmentBuf = Buffer.from(commitment, 'base64');

    setGameState("WaitingReveal");
    setConfirmedGuess(parsedGuess);
    setResult(null);
    setPayoutSOL(null);
    setTxSig(null);

    const { txSig } = await handleGuess({
      guess: parsedGuess,
      wagerSOL: solWager,
      commitmentBuf,
      wallet,
      program,
      connection,
    });

    setTxSig(txSig);

    setTimeout(async () => {
      const { txSig: revealTx } = await handleReveal({ wallet, program, connection });
      setTxSig(revealTx);

      setTimeout(async () => {
        const sessionPda = PublicKey.findProgramAddressSync(
          [Buffer.from("session"), wallet.publicKey.toBuffer()],
          program.programId
        )[0];
        const session: any = await program.account["gameSession"].fetch(sessionPda);

        setConfirmedGuess(session.guess);
        setResult(session.result);
        const payout = session.payout.toNumber() / LAMPORTS_PER_SOL;
        setPayoutSOL(payout);
        setGameState("Revealed");
      }, 1000);
    }, 2000);
  };

  const handleReset = () => {
    setGuess("");
    setWager("");
    setResult(null);
    setConfirmedGuess(null);
    setPayoutSOL(null);
    setTxSig(null);
    setGameState("ReadyToGuess");
  };

  return (
    <CardStock className="space-y-4 text-sm">
      <div className="w-full text-center">
        <h2 className="text-sm font-medium text-[var(--text-muted)] tracking-wide">
          Reveal255
        </h2>
      </div>

      <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
        <CurrencySwitcher value={currency} onToggle={toggleCurrency} />
        <span className="font-medium text-[var(--text-main)]">{displayBalance}</span>
      </div>

      <GameForm
        currency={currency}
        wager={wager}
        guess={guess}
        onWagerChange={setWager}
        onGuessChange={setGuess}
        solPrice={solPrice}
      />

      <div>
        <GameButton
          gameState={gameState}
          onGuess={handleSubmitGuess}
          onReveal={() => {}}
          onReset={handleReset}
          isLoading={gameState === "WaitingReveal"}
        />
      </div>

      <div className="w-full overflow-visible">
        <GameVisualizer
          guess={confirmedGuess}
          result={result}
          wager={parseFloat(wager) || null}
          payoutSOL={payoutSOL}
          solPrice={solPrice}
          gameState={gameState}
          txSig={txSig}
        />
      </div>
    </CardStock>
  );
};
