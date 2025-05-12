// hooks/useGameLogs.ts
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

// Replace with your deployed program ID
const PROGRAM_ID = new PublicKey("3xgCjquRUiJzV8oAiK1aGSgeuTyTBy2xkGJ3PB69EVcb");

export const useGameLogs = () => {
  const { connection } = useConnection();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let listenerId: number;

    const listen = async () => {
      listenerId = connection.onLogs(
        PROGRAM_ID,
        (logInfo) => {
          const rawLogs = logInfo.logs || [];
          setLogs((prev) => [...prev, ...rawLogs].slice(-100)); // keep last 100 logs
        },
        "confirmed"
      );
    };

    listen();

    return () => {
      if (listenerId !== undefined) {
        connection.removeOnLogsListener(listenerId).catch(console.error);
      }
    };
  }, [connection]);

  return logs;
};
