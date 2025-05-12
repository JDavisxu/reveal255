import { PublicKey } from "@solana/web3.js";

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const RPC_URL = getEnvVar("NEXT_PUBLIC_RPC_URL");
export const SWITCHBOARD_PROGRAM_ID = new PublicKey(getEnvVar("NEXT_PUBLIC_SWITCHBOARD_PROGRAM_ID"));
export const SWITCHBOARD_QUEUE = new PublicKey(getEnvVar("NEXT_PUBLIC_SWITCHBOARD_QUEUE"));
