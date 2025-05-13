import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

type Data = {
  serverSeed?: number[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { playerPublicKey, consume = false } = req.body;

  if (typeof playerPublicKey !== "string") {
    return res.status(400).json({ error: "Missing or invalid playerPublicKey" });
  }

  try {
    // 1. Get latest unrevealed session for this user
    const session = await prisma.serverSeedSession.findFirst({
      where: {
        userPubkey: playerPublicKey,
        revealed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Server seed not found" });
    }

    // 2. Decode the hex string back into buffer
    const seedBuf = Buffer.from(session.serverSeed, "hex");
    if (seedBuf.length !== 32) {
      return res.status(500).json({ error: "Invalid seed in database" });
    }

    // 3. Optionally mark as revealed
    if (consume) {
      await prisma.serverSeedSession.update({
        where: { id: session.id },
        data: { revealed: true },
      });
    }

    return res.status(200).json({ serverSeed: Array.from(seedBuf) });
  } catch (err) {
    console.error("❌ revealSeed API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
