// src/hooks/useProgram.ts
import { useMemo } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_IDL } from "../utils/program"; 

export function useProgram(): Program<Idl> | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    // 2-arg constructor: IDL (with metadata.address) + provider
    return new Program(PROGRAM_IDL as Idl, provider);
  }, [provider]);

  return program;
}
