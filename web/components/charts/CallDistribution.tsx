"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type AgentEvent } from "@mercato/shared";
import { isPurchasePayload } from "../../lib/eventPayloads";

/** Same fixed seller→hue assignment as PriceHistoryChart (validated palette). */
const SERIES_COLORS = ["#8b5cf6", "#0891b2", "#d97706", "#db2777"] as const;
const SELLER_ORDER = ["geocoder", "translator", "search-cheap", "search-pro"] as const;

export function CallDistribution({ events }: { events: AgentEvent[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (isPurchasePayload(e.payload)) {
        counts.set(e.payload.capability, (counts.get(e.payload.capability) ?? 0) + 1);
      }
    }
    return SELLER_ORDER.filter((name) => counts.has(name)).map((name) => ({
      name,
      calls: counts.get(name) ?? 0,
    }));
  }, [events]);

  if (data.length === 0) {
    return (
      <p className="flex h-36 items-center justify-center text-xs text-[var(--text-faint)]">
        paid-call distribution appears here once the agent buys
      </p>
    );
  }

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <XAxis type="number" hide domain={[0, "dataMax"]} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#a09db4", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#1e1e22",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: 12,
              fontFamily: "var(--font-jetbrains)",
            }}
            formatter={(value) => [String(value), "paid calls"]}
          />
          <Bar dataKey="calls" barSize={14} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={SERIES_COLORS[SELLER_ORDER.indexOf(d.name as (typeof SELLER_ORDER)[number])]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
