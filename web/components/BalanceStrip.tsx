"use client";

import { lamportsToUsd } from "@mercato/shared";

export interface BalanceStripProps {
  spentLamports: number;
  budgetUsd: number;
}

export function BalanceStrip({ spentLamports, budgetUsd }: BalanceStripProps) {
  // Convert ONLY with lamportsToUsd from @mercato/shared.
  const spentUsd = lamportsToUsd(spentLamports);
  const remainingUsd = Math.max(budgetUsd - spentUsd, 0);
  const pct = budgetUsd > 0 ? Math.min((spentUsd / budgetUsd) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-baseline justify-between text-lg">
        <span className="text-neutral-400">budget</span>
        <span className="tabular-nums">
          <span className="text-emerald-400">${spentUsd.toFixed(4)}</span>
          <span className="text-neutral-500"> / ${budgetUsd.toFixed(2)}</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-neutral-400 tabular-nums">
        <span>spent ${spentUsd.toFixed(4)}</span>
        <span>remaining ${remainingUsd.toFixed(4)}</span>
      </div>
    </div>
  );
}
