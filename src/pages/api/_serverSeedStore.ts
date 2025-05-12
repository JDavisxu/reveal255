// src/pages/api/_serverSeedStore.ts

const seedMap: Map<string, Buffer> = new Map();

/**
 * Save a 32-byte server seed for a player's public key.
 */
export function saveServerSeed(playerPublicKey: string, seed: Buffer) {
  seedMap.set(playerPublicKey, seed);
}

/**
 * Get the server seed (if it exists) for the player.
 */
export function getServerSeed(playerPublicKey: string): Buffer | undefined {
  return seedMap.get(playerPublicKey);
}

/**
 * Delete the server seed (after reveal is confirmed).
 */
export function deleteServerSeed(playerPublicKey: string) {
  seedMap.delete(playerPublicKey);
}

/**
 * Check whether a server seed exists for this wallet.
 */
export function hasServerSeed(playerPublicKey: string): boolean {
  return seedMap.has(playerPublicKey);
}
