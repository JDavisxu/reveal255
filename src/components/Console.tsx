// src/components/Console.tsx
import React, { FC, useEffect, useRef, useMemo, useState } from "react";
import { useGameLogs } from "../hooks/useGameLogs";

export const Console: FC = () => {
  const logs = useGameLogs();
  const [copied, setCopied] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Group logs by instruction
  const grouped = useMemo(() => {
    type Group = { title: string; lines: string[] };
    const groups: Group[] = [];
    let current: Group = { title: "Other", lines: [] };
    for (const line of logs) {
      const match = line.match(/Instruction:\s*(\w+)/);
      if (match) {
        if (current.lines.length) groups.push(current);
        current = { title: match[1], lines: [] };
      }
      current.lines.push(line);
    }
    if (current.lines.length) groups.push(current);
    return groups;
  }, [logs]);

  // Auto-expand newest group only on mount or when a new group appears
  useEffect(() => {
    setExpandedIndex(grouped.length - 1);
  }, [grouped.length]);

  const copyAll = () => {
    navigator.clipboard.writeText(logs.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="w-full rounded-lg bg-black/50 text-xs font-mono">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/70 border-b border-white/20">
        <span className="font-semibold text-white">Transactions</span>
        <button
          onClick={copyAll}
          disabled={copied}
          className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          {copied ? "Copied!" : "Copy All"}
        </button>
      </div>

      {/* scrollable list */}
      <div
        className="h-48 w-full overflow-y-auto px-4 py-2 space-y-2"
      >
        {grouped.map((grp, i) => {
          const isExpanded = i === expandedIndex;
          return (
            <div key={i} className="tx-group w-full border border-white/20 rounded-lg overflow-hidden">
              {/* group header */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="flex justify-between items-center px-3 py-1.5 bg-black/60 cursor-pointer select-none"
              >
                <span className="text-white/80 text-sm">
                  {grp.title} ({grp.lines.length})
                </span>
                <span className="text-white/50 text-sm">
                  {isExpanded ? "▼" : "▶"}
                </span>
              </div>

              {/* group body */}
              {isExpanded && (
                <div className="px-3 py-1 space-y-1 bg-black/30 text-green-300">
                  {grp.lines.map((line, idx) => (
                    <div key={idx} className="text-[0.65rem] pl-1">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      
      </div>
    </div>
  );
};

Console.displayName = "Console";
