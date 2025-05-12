import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSeed, deleteServerSeed } from "../../seedStore"; // ← two levels up

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { playerPublicKey, consume = false } = req.body;
  if (typeof playerPublicKey !== "string") {
    return res.status(400).json({ error: "Missing or invalid playerPublicKey" });
  }

  const serverSeed = getServerSeed(playerPublicKey);
  if (!serverSeed || serverSeed.length !== 32) {
    return res.status(404).json({ error: "Server seed not found or invalid" });
  }

  if (consume) {
    deleteServerSeed(playerPublicKey);
  }

  return res.status(200).json({ serverSeed: Array.from(serverSeed) });
}
