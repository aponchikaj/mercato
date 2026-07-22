"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type AgentEvent, lamportsToUsd } from "@mercato/shared";
import { isPurchasePayload } from "../../lib/eventPayloads";

/** Single series — no legend needed; the panel title names it. */
const SPEND_COLOR = "#8b5cf6";

export function SpendChart({ events }: { events: AgentEvent[] }) {
  const data = useMemo(() => {
    let cum = 0;
    return events
      .filter((e) => isPurchasePayload(e.payload))
      .map((e) => {
        if (isPurchasePayload(e.payload)) {
          cum += lamportsToUsd(e.payload.amountLamports);
        }
        return { t: e.timestamp, spent: Number(cum.toFixed(6)) };
      });
  }, [events]);

  if (data.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-xs text-[var(--text-faint)]">
        cumulative spend appears here once the agent buys
      </p>
    );
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SPEND_COLOR} stopOpacity={0.35} />
              <stop offset="100%" stopColor={SPEND_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            stroke="rgba(255,255,255,0.12)"
            tick={{ fill: "#6b6880", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            tickLine={false}
            axisLine={false}
            width={48}
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
            formatter={(value) => [`$${Number(value).toFixed(4)}`, "spent"]}
          />
          <Area
            type="stepAfter"
            dataKey="spent"
            stroke={SPEND_COLOR}
            strokeWidth={2}
            fill="url(#spendFill)"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
