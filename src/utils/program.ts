// src/utils/program.ts
import rawIdl from "../../idl/reveal255.json";
import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID!
);

// Make a copy of the IDL with the on‐chain address baked in
export const PROGRAM_IDL = {
  ...rawIdl,
  metadata: {
    ...rawIdl.metadata,
    address: PROGRAM_ID.toString(),
  },
};
