// src/lib/seedStore.ts
import fs from "fs";
import path from "path";

const FILE = path.resolve(process.cwd(), "seeds.json");

// Read the entire store from disk (with a retry on transient errors)
function readStore(): Record<string, number[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = fs.readFileSync(FILE, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      if (attempt === 3) {
        console.error("🛑 Failed to read seed store after 3 attempts:", err);
        return {};
      }
      // wait 100 ms before retrying
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  return {};
}

// Write the entire store back to disk atomically
function writeStore(store: Record<string, number[]>): void {
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf-8");
  fs.renameSync(tmp, FILE);
}

// Save a seed for a given playerPublicKey
export function saveServerSeed(playerPublicKey: string, seedBuf: Buffer): void {
  const store = readStore();
  store[playerPublicKey] = Array.from(seedBuf);
  writeStore(store);
}

// Retrieve a seed; returns a Buffer or undefined
export function getServerSeed(playerPublicKey: string): Buffer | undefined {
  const store = readStore();
  const arr = store[playerPublicKey];
  return arr ? Buffer.from(arr) : undefined;
}

// Delete a seed after reveal (cleanup)
export function deleteServerSeed(playerPublicKey: string): void {
  const store = readStore();
  delete store[playerPublicKey];
  writeStore(store);
}

// Check existence
export function hasServerSeed(playerPublicKey: string): boolean {
  const store = readStore();
  return playerPublicKey in store;
}
