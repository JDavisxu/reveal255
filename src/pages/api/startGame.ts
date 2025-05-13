// src/pages/api/startGame.ts
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
  // Log environment to verify DATABASE_URL
  console.log(
    '🛢 startGame ENV:',
    'NODE_ENV=' + process.env.NODE_ENV,
    'DATABASE_URL=' + (process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0,30)}…` : 'undefined')
  );

  // CORS preflight handling
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

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
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
    const seedBuf = Buffer.from(serverSeed);
    const seedHex = seedBuf.toString("hex");
    const commitmentHex = keccak_256(seedBuf);
    const commitmentB64 = Buffer.from(commitmentHex, "hex").toString("base64");

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