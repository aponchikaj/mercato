"use client";

import { useEffect, useRef, useState } from "react";
import { type ServiceListingWithPrice, lamportsToUsd } from "@mercato/shared";

export interface PriceTableProps {
  services: ServiceListingWithPrice[];
}

const FLASH_MS = 600;

export function PriceTable({ services }: PriceTableProps) {
  const prevPrices = useRef<Map<string, number>>(new Map());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const risen: string[] = [];
    for (const s of services) {
      const prev = prevPrices.current.get(s.name);
      if (prev !== undefined && s.basePriceLamports > prev) {
        risen.push(s.name);
      }
      prevPrices.current.set(s.name, s.basePriceLamports);
    }
    if (risen.length === 0) return;

    setFlashing((cur) => {
      const next = new Set(cur);
      for (const name of risen) next.add(name);
      return next;
    });
    const timer = setTimeout(() => {
      setFlashing((cur) => {
        const next = new Set(cur);
        for (const name of risen) next.delete(name);
        return next;
      });
    }, FLASH_MS);
    return () => clearTimeout(timer);
  }, [services]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-2 text-lg text-neutral-400">market prices</h2>
      <table className="w-full text-base">
        <thead>
          <tr className="text-left text-sm text-neutral-500">
            <th className="pb-2 font-normal">service</th>
            <th className="pb-2 font-normal">capability</th>
            <th className="pb-2 text-right font-normal">base</th>
            <th className="pb-2 text-right font-normal">current</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr
              key={s.name}
              className={`transition-colors duration-500 ${
                flashing.has(s.name) ? "bg-red-500/40" : "bg-transparent"
              }`}
            >
              <td className="py-1.5 text-neutral-200">{s.name}</td>
              <td className="py-1.5 text-neutral-500">{s.capability}</td>
              <td className="py-1.5 text-right text-neutral-400 tabular-nums">
                ${s.basePriceUsd.toFixed(4)}
              </td>
              <td className="py-1.5 text-right text-neutral-100 tabular-nums">
                ${lamportsToUsd(s.basePriceLamports).toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
