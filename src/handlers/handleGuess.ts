import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { request } from "../utils/request";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";
import { Buffer } from "buffer"; // polyfill in browser

export async function handleGuess({
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
}): Promise<{ success: boolean; txSig?: string; error?: string }> {
  const { addLog } = useConsoleStore.getState();

  // 1️⃣ Guards
  if (!wallet?.publicKey) {
    notify({ type: "error", message: "Wallet not connected" });
    return { success: false, error: "Wallet not connected" };
  }
  if (!program) {
    notify({ type: "error", message: "Program not ready" });
    return { success: false, error: "Program not loaded" };
  }
  if (guess < 0 || guess > 255) {
    notify({ type: "error", message: "Guess must be 0–255" });
    return { success: false, error: "Invalid guess" };
  }

  const playerPubkey = wallet.publicKey.toBase58();
  addLog(`🎮 Starting guess for ${playerPubkey}`);

  // 2️⃣ Commit phase: send seed to your backend
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
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Status ${resp.status}`);
    }
    const { commitment: b64 } = await resp.json();
    commitmentBuf = Buffer.from(b64, "base64");
    addLog("🛡️ Seed stored & commitment received");
  } catch (err: any) {
    const msg = err.message || "Failed to store seed";
    console.error("❌ Seed commit failed:", msg);
    notify({ type: "error", message: "Seed commit failed", description: msg });
    addLog(`❌ Seed commit failed: ${msg}`);
    return { success: false, error: msg };
  }

  // 3️⃣ Derive PDAs
  const vaultPda = (await PublicKey.findProgramAddress([Buffer.from("vault")], program.programId))[0];
  const vaultAccPda = (await PublicKey.findProgramAddress([Buffer.from("vault_account")], program.programId))[0];
  const sessionPda = (
    await PublicKey.findProgramAddress(
      [Buffer.from("session"), wallet.publicKey.toBuffer()],
      program.programId
    )
  )[0];
  const lamports = Math.round(wagerSOL * LAMPORTS_PER_SOL);

  addLog(`🧠 PDAs → vault: ${vaultPda.toBase58()}, vaultAcc: ${vaultAccPda.toBase58()}, session: ${sessionPda.toBase58()}`);
  addLog(`💰 Wager: ${lamports} lamports`);

  // 4️⃣ On‑chain guess
  try {
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
    console.error("❌ Guess tx failed:", raw);
    let desc = "Unknown error";
    if (raw.includes("GamePaused")) desc = "Game is paused";
    else if (raw.includes("WagerTooHigh")) desc = "Wager too high";
    else if (raw.includes("UnresolvedGameExists")) desc = "You have an ongoing game";
    notify({ type: "error", message: "Guess failed", description: desc });
    addLog(`❌ Guess failed: ${desc}`);
    return { success: false, error: raw };
  }
}
