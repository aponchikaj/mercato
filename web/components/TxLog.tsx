"use client";

import { type AgentEvent, lamportsToUsd } from "@mercato/shared";
import { isPurchasePayload } from "../lib/eventPayloads";

export interface TxLogProps {
  events: AgentEvent[];
}

function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function TxLog({ events }: TxLogProps) {
  const purchases = events
    .map((e) => e.payload)
    .filter(isPurchasePayload);

  return (
    <div className="panel flex h-full flex-col p-5">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-dim)]">
        On-chain receipts
      </h2>
      <div className="scroll-thin flex-1 overflow-y-auto">
        {purchases.length === 0 ? (
          <p className="text-neutral-600">no transactions yet</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {purchases.map((p) => (
                <tr
                  key={p.txSignature}
                  className="border-b border-neutral-800/60 last:border-0"
                >
                  <td className="py-1 pr-2 text-neutral-300">{p.seller}</td>
                  <td className="py-1 pr-2 text-neutral-500">{p.capability}</td>
                  <td className="py-1 pr-2 text-right text-emerald-400 tabular-nums">
                    ${lamportsToUsd(p.amountLamports).toFixed(4)}
                  </td>
                  <td className="py-1 text-right">
                    <a
                      href={explorerUrl(p.txSignature)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 underline decoration-dotted hover:text-sky-300"
                    >
                      {p.txSignature.slice(0, 8)}…
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
