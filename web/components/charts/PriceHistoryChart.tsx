"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type MarketService } from "@mercato/shared";

/**
 * Validated categorical palette (dataviz six checks, dark surface #14131c).
 * Hues are assigned to sellers in FIXED order — never cycled or re-ranked.
 */
const SERIES_COLORS = ["#8b5cf6", "#0891b2", "#d97706", "#db2777"] as const;
const SELLER_ORDER = ["geocoder", "translator", "search-cheap", "search-pro"] as const;

const MAX_POINTS = 90; // ~3 minutes at the 2s poll

interface PricePoint {
  t: number;
  [seller: string]: number;
}

export function PriceHistoryChart({ services }: { services: MarketService[] }) {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const lastSample = useRef(0);

  useEffect(() => {
    if (services.length === 0) return;
    const now = Date.now();
    // Sample at most once per poll interval to avoid duplicate points on rerender.
    if (now - lastSample.current < 1500) return;
    lastSample.current = now;

    const point: PricePoint = { t: now };
    for (const s of services) point[s.name] = s.currentPriceUsd;
    setHistory((prev) => [...prev, point].slice(-MAX_POINTS));
  }, [services]);

  const sellers = SELLER_ORDER.filter((name) =>
    services.some((s) => s.name === name),
  );

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t: number) => new Date(t).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
            stroke="rgba(255,255,255,0.12)"
            tick={{ fill: "#6b6880", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toFixed(3)}`}
            stroke="rgba(255,255,255,0.12)"
            tick={{ fill: "#6b6880", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            tickLine={false}
            axisLine={false}
            width={56}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#1e1e22",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: 12,
              fontFamily: "var(--font-jetbrains)",
            }}
            labelStyle={{ color: "#a09db4" }}
            labelFormatter={(label) =>
              typeof label === "number" ? new Date(label).toLocaleTimeString() : ""
            }
            formatter={(value, name) => [`$${Number(value).toFixed(4)}`, String(name)]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a09db4" }}
            iconType="plainline"
          />
          {sellers.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={SERIES_COLORS[SELLER_ORDER.indexOf(name)]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
