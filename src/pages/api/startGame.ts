// pages/api/startGame.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { saveServerSeed } from "../../seedStore";
import { keccak_256 } from "js-sha3";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { playerPublicKey, serverSeed } = req.body;
  if (
    typeof playerPublicKey !== "string" ||
    !Array.isArray(serverSeed) ||
    serverSeed.length !== 32
  ) {
    return res.status(400).json({ error: "Missing or invalid input" });
  }

  // 1️⃣ Persist the seed into seeds.json
  const seedBuf = Buffer.from(serverSeed);
  saveServerSeed(playerPublicKey, seedBuf);

  // 2️⃣ Compute the commitment
  const commitmentHex = keccak_256(seedBuf);
  const commitmentB64 = Buffer.from(commitmentHex, "hex").toString("base64");

  // 3️⃣ Return the commitment
  return res.status(200).json({ commitment: commitmentB64 });
}
