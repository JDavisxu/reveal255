// src/components/CurrencySwitcher.tsx

import { FC } from "react";

type Currency = "SOL" | "USD";

interface Props {
  value: Currency;
  onToggle: () => void;
}

export const CurrencySwitcher: FC<Props> = ({ value, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className="flex items-center justify-between w-24 px-2 py-1 rounded-full border border-[var(--card-border)] bg-[var(--input-bg)] cursor-pointer transition"
    >
      <div
        className={`w-1/2 text-center text-xs font-medium py-0.5 rounded-full transition-all duration-200 ${
          value === "SOL"
            ? "bg-purple-500 text-white"
            : "text-[var(--text-muted)]"
        }`}
      >
        SOL
      </div>
      <div
        className={`w-1/2 text-center text-xs font-medium py-0.5 rounded-full transition-all duration-200 ${
          value === "USD"
            ? "bg-purple-500 text-white"
            : "text-[var(--text-muted)]"
        }`}
      >
        USD
      </div>
    </div>
  );
};
