import { useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor"; // ✅ ADD THIS LINE
import toast from "react-hot-toast";
import { useProgram } from "../hooks/useProgram";


const VAULT_SEED = "vault";
const VAULT_ACCOUNT_SEED = "vault_account";

export default function AdminPage() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const program = useProgram();

  const [log, setLog] = useState<string[]>([]);
  const [maxWager, setMaxWager] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paused, setPaused] = useState(false);

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED)],
    program?.programId ?? new PublicKey("11111111111111111111111111111111")
  );

  const [vaultAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_ACCOUNT_SEED)],
    program?.programId ?? new PublicKey("11111111111111111111111111111111")
  );

  const appendLog = (msg: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleInitialize = async () => {
    if (!wallet || !program) return;
    try {
      const wager = parseFloat(maxWager);
      if (isNaN(wager) || wager <= 0) {
        toast.error("Enter a valid max wager.");
        return;
      }

      await program.methods
        .initializeVault(new anchor.BN(wager * LAMPORTS_PER_SOL))
        .accounts({
          vault: vaultPda,
          vaultAccount: vaultAccountPda,
          admin: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      toast.success("Vault initialized");
      appendLog(`Initialized vault with max wager ${wager} SOL`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to initialize vault");
      appendLog("❌ Failed to initialize Vault.");
    }
  };

  const handlePauseToggle = async () => {
    if (!wallet || !program) return;
    try {
      await program.methods
        .setPauseState(paused)
        .accounts({
          vault: vaultPda,
          admin: wallet.publicKey,
        })
        .rpc();

      toast.success(`Game ${paused ? "paused" : "resumed"}`);
      appendLog(`Game pause state updated: ${paused}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update pause state");
      appendLog("❌ Failed to update pause state.");
    }
  };

  const handleSetMaxWager = async () => {
    if (!wallet || !program) return;
    try {
      const wager = parseFloat(maxWager);
      if (isNaN(wager) || wager <= 0) {
        toast.error("Enter a valid max wager.");
        return;
      }

      await program.methods
        .updateMaxWager(new anchor.BN(wager * LAMPORTS_PER_SOL))
        .accounts({
          vault: vaultPda,
          admin: wallet.publicKey,
        })
        .rpc();

      toast.success("Max wager updated");
      appendLog(`Max wager updated to ${wager} SOL`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update max wager");
      appendLog("❌ Failed to update max wager.");
    }
  };

  const handleWithdraw = async () => {
    if (!wallet || !program) return;
    try {
      const lamports = parseFloat(withdrawAmount) * LAMPORTS_PER_SOL;

      await program.methods
        .withdraw(new anchor.BN(lamports))
        .accounts({
          vault: vaultPda,
          vaultAccount: vaultAccountPda,
          admin: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      toast.success("Withdrawal successful");
      appendLog(`Withdrew ${withdrawAmount} SOL from vault`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to withdraw");
      appendLog("❌ Withdrawal failed.");
    }
  };

  const handleCloseVault = async () => {
    if (!wallet || !program) return;
    try {
      await program.methods
        .closeVault()
        .accounts({
          vault: vaultPda,
          admin: wallet.publicKey,
        })
        .rpc();

      toast.success("Vault closed");
      appendLog("Vault PDA closed successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to close vault");
      appendLog("❌ Failed to close Vault PDA.");
    }
  };

  const handleCloseVaultAccount = async () => {
    if (!wallet || !program) return;
    try {
      await program.methods
        .closeVaultAccount()
        .accounts({
          vaultAccount: vaultAccountPda,
          admin: wallet.publicKey,
          vaultAdmin: wallet.publicKey,
        })
        .rpc();

      toast.success("Vault Account closed");
      appendLog("Vault Account PDA closed successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to close vault account");
      appendLog("❌ Failed to close Vault Account PDA.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Admin Controls</h1>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            className="border p-2 rounded w-48"
            placeholder="Max wager (SOL)"
            value={maxWager}
            onChange={(e) => setMaxWager(e.target.value)}
          />
          <button
            className="bg-green-700 text-white px-4 py-2 rounded"
            onClick={handleInitialize}
          >
            Initialize Vault
          </button>
          <button
            className="bg-yellow-700 text-white px-4 py-2 rounded"
            onClick={handleSetMaxWager}
          >
            Update Max Wager
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <label>
            <input
              type="checkbox"
              checked={paused}
              onChange={(e) => setPaused(e.target.checked)}
              className="mr-2"
            />
            Pause Game
          </label>
          <button
            className="bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handlePauseToggle}
          >
            Update Pause State
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="number"
            className="border p-2 rounded w-48"
            placeholder="Withdraw amount (SOL)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button
            className="bg-purple-700 text-white px-4 py-2 rounded"
            onClick={handleWithdraw}
          >
            Withdraw
          </button>
        </div>

        <div className="space-x-4">
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded"
            onClick={handleCloseVault}
          >
            Close Vault
          </button>

          <button
            className="bg-gray-800 text-white px-4 py-2 rounded"
            onClick={handleCloseVaultAccount}
          >
            Close Vault Account
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Action Log</h2>
        <div className="bg-black text-white p-4 rounded max-h-64 overflow-y-auto text-sm space-y-1">
          {log.length === 0 ? (
            <div>No actions taken yet.</div>
          ) : (
            log.map((entry, i) => <div key={i}>{entry}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
