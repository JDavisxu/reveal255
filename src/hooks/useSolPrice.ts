// src/hooks/useSolPrice.ts

import { useEffect, useState } from "react";

export const useSolPrice = () => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const data = await res.json();
        setPrice(data.solana.usd);
      } catch (err) {
        console.error("Failed to fetch SOL price:", err);
        setPrice(null);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return price;
};
