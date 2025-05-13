// src/handlers/handleReveal.ts
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { request } from "../utils/request";
import { notify } from "../utils/notifications";
import { useConsoleStore } from "../stores/useConsoleStore";

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

  if (!wallet?.publicKey) return { success: false, error: "Wallet not connected" };
  if (!program) return { success: false, error: "Program not ready" };

  const playerPubkey = wallet.publicKey;
  let seedArr: number[];

  try {
    const res = await request("/api/revealSeed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerPublicKey: playerPubkey.toBase58() }),
    });
    const data = await res.json();
    seedArr = data.serverSeed;
  } catch (err: any) {
    const msg = err.message || "Failed to fetch server seed";
    return { success: false, error: msg };
  }

  const [vaultPda] = await PublicKey.findProgramAddress([Buffer.from("vault")], program.programId);
  const [vaultAccountPda] = await PublicKey.findProgramAddress([Buffer.from("vault_account")], program.programId);
  const [sessionPda] = await PublicKey.findProgramAddress(
    [Buffer.from("session"), playerPubkey.toBuffer()],
    program.programId
  );

  try {
    const txSig: string = await program.methods
      .reveal(Uint8Array.from(seedArr))
      .accounts({
        vault: vaultPda,
        vaultAccount: vaultAccountPda,
        session: sessionPda,
        player: playerPubkey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { success: true, txSig };
  } catch (err: any) {
    return { success: false, error: err.message || "Reveal tx failed" };
  }
};

export default handleReveal;
