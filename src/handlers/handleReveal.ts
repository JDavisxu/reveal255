// src/handlers/handleReveal.ts
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { request } from "../utils/request";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";
import { Buffer } from "buffer";

type HandleRevealResult = {
  success: boolean;
  txSig?: string;
  error?: string;
};

const handleReveal = async ({
  wallet,
  program,
  connection,
}: {
  wallet: any;
  program: any;
  connection: any;
}): Promise<HandleRevealResult> => {
  const { addLog } = useConsoleStore.getState();

  if (!wallet?.publicKey) {
    return { success: false, error: "Wallet not connected" };
  }
  if (!program) {
    return { success: false, error: "Program not ready" };
  }

  const playerPubkey = wallet.publicKey.toBase58();
  addLog(`🔍 Fetching seed for ${playerPubkey}`);

  let seedArr: number[];
  try {
    // `request` returns the parsed JSON body directly
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
    return { success: false, error: msg };
  }

  // Derive PDAs
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

  try {
    addLog(`🎲 Revealing with seed [${seedArr.join(", ")}]`);
    const txSig = await program.methods
      .reveal(Uint8Array.from(seedArr))
      .accounts({
        vault: vaultPda,
        vaultAccount: vaultAccountPda,
        session: sessionPda,
        player: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    addLog(`✅ Reveal tx: ${txSig}`);
    return { success: true, txSig };
  } catch (err: any) {
    const raw = err.message || "Reveal tx failed";
    notify({ type: "error", message: "Reveal failed", description: raw });
    addLog(`❌ Reveal failed: ${raw}`);
    return { success: false, error: raw };
  }
};

export default handleReveal;
