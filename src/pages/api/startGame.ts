// pages/api/startGame.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { keccak_256 } from "js-sha3";

type Data = {
  commitment?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
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

  try {
    // Convert to buffer and hex string
    const seedBuf = Buffer.from(serverSeed);
    const seedHex = seedBuf.toString("hex");

    // Hash it for the commitment
    const commitmentHex = keccak_256(seedBuf);
    const commitmentB64 = Buffer.from(commitmentHex, "hex").toString("base64");

    // Save to DB
    await prisma.serverSeedSession.create({
      data: {
        userPubkey: playerPublicKey,
        serverSeed: seedHex,
        serverSeedHash: commitmentHex,
      },
    });

    return res.status(200).json({ commitment: commitmentB64 });
  } catch (err) {
    console.error("❌ startGame API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
