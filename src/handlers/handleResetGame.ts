// src/handlers/handleResetGame.ts

import { PublicKey, SystemProgram } from "@solana/web3.js";
import { notify } from "../utils/notifications";
import { request } from "../utils/request"; // your fetch wrapper

export async function handleResetGame({
  wallet,
  program,
}: {
  wallet: any;
  program: any;
}) {
  if (!wallet?.publicKey) {
    notify({
      type: "error",
      message: "Wallet not connected",
      description: "Connect your wallet to reset the game.",
    });
    return { success: false, error: "Wallet not connected" };
  }

  try {
    const sessionPda = PublicKey.findProgramAddressSync(
      [Buffer.from("session"), wallet.publicKey.toBuffer()],
      program.programId
    )[0];

    const txSig = await program.methods
      .resetSession()
      .accounts({
        session: sessionPda,
        player: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Game session reset:", txSig);

    // Now tell the server to delete the seed
    const res = await request("/api/revealSeed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerPublicKey: wallet.publicKey.toBase58(),
        consume: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("⚠️ Failed to clear server seed:", err.error || res.status);
    } else {
      console.log("🗑️ Server seed cleared");
    }

    notify({
      type: "success",
      message: "Game reset successful",
      description: "Your previous seed was cleared. You can start a new game.",
      txid: txSig,
    });

    return { success: true, txSig };
  } catch (err: any) {
    console.error("❌ Failed to reset session:", err);

    notify({
      type: "error",
      message: "Reset failed",
      description: err.message || "Could not reset the session.",
    });

    return { success: false, error: err.message };
  }
}
