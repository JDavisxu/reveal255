// src/components/CardStock.tsx

import { FC, ReactNode } from "react";

type CardStockProps = {
  children: ReactNode;
  className?: string;
};

export const CardStock: FC<CardStockProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`card w-full max-w-[420px] min-w-[300px] h-[700px] mx-auto p-6 ${className}`}
    >
      {children}
    </div>
  );
};
