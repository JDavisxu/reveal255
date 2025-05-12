// src/handlers/handleReveal.ts
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { request } from "../utils/request";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";

export async function handleReveal({
  wallet,
  program,
  connection,  // still passed in from GameCard
}: {
  wallet: any;
  program: any;
  connection: any;
}): Promise<{ success: boolean; txSig?: string; error?: string }> {
  const { addLog } = useConsoleStore.getState();

  // 1️⃣ Basic guards
  if (!wallet?.publicKey) {
    notify({ type: "error", message: "Wallet not connected" });
    return { success: false, error: "Wallet not connected" };
  }
  if (!program) {
    notify({ type: "error", message: "Program not ready" });
    return { success: false, error: "Program not loaded" };
  }

  const playerPubkey = wallet.publicKey;
  addLog(`🔍 Revealing for ${playerPubkey.toBase58()}`);

  // 2️⃣ Fetch the original seed from your backend
  let seedArr: number[];
  try {
    const res = await request("/api/revealSeed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerPublicKey: playerPubkey.toBase58() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    seedArr = data.serverSeed;
    if (!Array.isArray(seedArr) || seedArr.length !== 32) {
      throw new Error("Invalid server seed received");
    }
    addLog("🔑 Server seed retrieved");
  } catch (err: any) {
    const msg = err.message || "Failed to fetch server seed";
    console.error("❌ Reveal API error:", msg);
    notify({ type: "error", message: "Reveal failed", description: msg });
    addLog(`❌ Reveal API error: ${msg}`);
    return { success: false, error: msg };
  }

  // 3️⃣ Derive your PDAs (must match your on‑chain seeds)
  const [vaultPda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault")],
    program.programId
  );
  const [vaultAccountPda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault_account")],
    program.programId
  );
  const [sessionPda] = await PublicKey.findProgramAddress(
    [Buffer.from("session"), playerPubkey.toBuffer()],
    program.programId
  );

  // 4️⃣ Convert to Uint8Array
  const seedBuf = Uint8Array.from(seedArr);

  // 5️⃣ Send the on‑chain reveal
  try {
    const txSig: string = await program.methods
      .reveal(seedBuf)
      .accounts({
        vault: vaultPda,
        vaultAccount: vaultAccountPda,
        session: sessionPda,
        player: playerPubkey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    addLog(`✅ Reveal submitted: ${txSig}`);
    return { success: true, txSig };
  } catch (err: any) {
    const raw = err.message || "Reveal transaction failed";
    console.error("❌ Reveal tx failed:", raw);
    notify({ type: "error", message: "Reveal failed", description: raw });
    addLog(`❌ Reveal failed: ${raw}`);
    return { success: false, error: raw };
  }
}
