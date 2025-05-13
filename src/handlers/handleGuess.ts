// src/handlers/handleGuess.ts
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { request } from "../utils/request";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";
import { Buffer } from "buffer";

type HandleGuessResult = {
  success: boolean;
  txSig?: string;
  error?: string;
};

const handleGuess = async ({
  guess,
  wagerSOL,
  wallet,
  program,
  connection,
}: {
  guess: number;
  wagerSOL: number;
  wallet: any;
  program: any;
  connection: any;
}): Promise<HandleGuessResult> => {
  const { addLog } = useConsoleStore.getState();

  if (!wallet?.publicKey) return { success: false, error: "Wallet not connected" };
  if (!program) return { success: false, error: "Program not loaded" };
  if (guess < 0 || guess > 255) return { success: false, error: "Invalid guess" };

  const playerPubkey = wallet.publicKey.toBase58();
  addLog(`🎮 Starting guess for ${playerPubkey}`);

  const seed = crypto.getRandomValues(new Uint8Array(32));
  let commitmentBuf: Buffer;

  try {
    const resp = await request("/api/startGame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerPublicKey: playerPubkey,
        serverSeed: Array.from(seed),
      }),
    });

    const { commitment: b64 } = await resp.json();
    commitmentBuf = Buffer.from(b64, "base64");
  } catch (err: any) {
    const msg = err.message || "Failed to store seed";
    notify({ type: "error", message: "Seed commit failed", description: msg });
    addLog(`❌ Seed commit failed: ${msg}`);
    return { success: false, error: msg };
  }

  const [vaultPda] = await PublicKey.findProgramAddress([Buffer.from("vault")], program.programId);
  const [vaultAccPda] = await PublicKey.findProgramAddress([Buffer.from("vault_account")], program.programId);
  const [sessionPda] = await PublicKey.findProgramAddress(
    [Buffer.from("session"), wallet.publicKey.toBuffer()],
    program.programId
  );

  try {
    const lamports = Math.round(wagerSOL * LAMPORTS_PER_SOL);
    const txSig = await program.methods
      .guess(guess, new BN(lamports), [...commitmentBuf])
      .accounts({
        vault: vaultPda,
        vaultAccount: vaultAccPda,
        session: sessionPda,
        player: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    addLog(`✅ Guess tx: ${txSig}`);
    return { success: true, txSig };
  } catch (err: any) {
    const raw = err.message || "Transaction failed";
    addLog(`❌ Guess failed: ${raw}`);
    return { success: false, error: raw };
  }
};

export default handleGuess;
