// src/handlers/handleReveal.ts

import { PublicKey, SystemProgram } from "@solana/web3.js";
import { request } from "../utils/request";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";
import { Buffer } from "buffer";

export type HandleRevealParams = {
  wallet: { publicKey: PublicKey };
  program: any;
  connection: any;
};

export async function handleReveal({
  wallet,
  program,
  connection,
}: HandleRevealParams): Promise<{ txSig: string }> {
  const { addLog } = useConsoleStore.getState();

  if (!wallet?.publicKey) {
    throw new Error("Wallet not connected");
  }
  if (!program) {
    throw new Error("Program not ready");
  }

  const playerPubkey = wallet.publicKey.toBase58();
  addLog(`🔍 Fetching seed for ${playerPubkey}`);

  // 1) Fetch the committed server seed
  let seedArr: number[];
  try {
    const { serverSeed } = await request<{ serverSeed: number[] }>(
      "/api/revealSeed",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerPublicKey: playerPubkey }),
      }
    );
    seedArr = serverSeed;
  } catch (err: any) {
    const msg = err.message || "Failed to fetch server seed";
    notify({ type: "error", message: "Seed fetch failed", description: msg });
    addLog(`❌ Seed fetch failed: ${msg}`);
    throw new Error(msg);
  }

  // 2) Derive PDAs
  const [vaultPda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault")],
    program.programId
  );
  const [vaultAccountPda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault_account")],
    program.programId
  );
  const [sessionPda] = await PublicKey.findProgramAddress(
    [Buffer.from("session"), wallet.publicKey.toBuffer()],
    program.programId
  );

  // 3) Fire the reveal instruction
  try {
    addLog(`🎲 Revealing with seed [${seedArr.join(", ")}]`);
const txSig: string = await program.methods
.reveal(Uint8Array.from(seedArr))
.accounts({ /* … */ })
.rpc({
  skipPreflight: true,
  preflightCommitment: "processed",
});


    addLog(`✅ Reveal tx: ${txSig}`);
    return { txSig };
  } catch (err: any) {
    const raw = err.message || "Reveal transaction failed";
    notify({ type: "error", message: "Reveal failed", description: raw });
    addLog(`❌ Reveal failed: ${raw}`);
    throw new Error(raw);
  }
}
