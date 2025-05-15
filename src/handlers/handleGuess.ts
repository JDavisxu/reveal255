// src/handlers/handleGuess.ts

import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";

export type HandleGuessParams = {
  guess: number;
  wagerSOL: number;
  commitmentBuf: Buffer; // ✅ Now passed in
  wallet: { publicKey: PublicKey };
  program: any;
  connection: any;
};

export async function handleGuess({
  guess,
  wagerSOL,
  commitmentBuf,
  wallet,
  program,
  connection,
}: HandleGuessParams): Promise<{ txSig: string }> {
  const { addLog } = useConsoleStore.getState();

  if (!wallet?.publicKey) {
    throw new Error("Wallet not connected");
  }
  if (!program) {
    throw new Error("Program not loaded");
  }
  if (!Number.isInteger(guess) || guess < 0 || guess > 255) {
    throw new Error("Invalid guess (must be integer 0–255)");
  }

  const playerPubkey = wallet.publicKey.toBase58();
  addLog(`🎮 Starting guess for ${playerPubkey}`);

  // 1) Derive PDAs
  const [vaultPda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault")],
    program.programId
  );
  const [vaultAccPda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault_account")],
    program.programId
  );
  const [sessionPda] = await PublicKey.findProgramAddress(
    [Buffer.from("session"), wallet.publicKey.toBuffer()],
    program.programId
  );

  // 2) Send guess transaction
  try {
    const lamports = Math.round(wagerSOL * LAMPORTS_PER_SOL);

    const txSig: string = await program.methods
      .guess(guess, new BN(lamports), [...commitmentBuf])
      .accounts({
        player: wallet.publicKey,
        vault: vaultPda,
        vaultAccount: vaultAccPda,
        session: sessionPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc({
        skipPreflight: true,
        preflightCommitment: "processed",
      });

    addLog(`✅ Guess tx: ${txSig}`);
    return { txSig };
  } catch (err: any) {
    const raw = err.message || "Guess transaction failed";
    addLog(`❌ Guess failed: ${raw}`);
    throw new Error(raw);
  }
}
