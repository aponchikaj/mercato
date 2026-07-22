"use client";

import { useMemo } from "react";
import { lamportsToUsd } from "@mercato/shared";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { ReasoningStream } from "../../components/ReasoningStream";
import { CallDistribution } from "../../components/charts/CallDistribution";
import { SpendChart } from "../../components/charts/SpendChart";
import { TxLog } from "../../components/TxLog";
import { USE_FAKE } from "../../lib/config";
import { isPurchasePayload } from "../../lib/eventPayloads";
import { useAgentEvents, useBalances } from "../../lib/hooks";

const DEMO_BUDGET_USD = 5;

export default function AgentPage() {
  const { events, status } = useAgentEvents();
  const balances = useBalances();
  // Routing-policy sliders (advisory display; the enforced gate is in agent code).
  const [maxCallUsd, setMaxCallUsd] = useState(0.025);
  const [qualityBar, setQualityBar] = useState(70);

  const spentUsd = useMemo(
    () =>
      events.reduce(
        (sum, e) =>
          isPurchasePayload(e.payload)
            ? sum + lamportsToUsd(e.payload.amountLamports)
            : sum,
        0,
      ),
    [events],
  );

  const purchases = events.filter((e) => isPurchasePayload(e.payload)).length;
  const remainingUsd = Math.max(DEMO_BUDGET_USD - spentUsd, 0);
  const pct = Math.min((spentUsd / DEMO_BUDGET_USD) * 100, 100);
  const agent = balances?.balances.find((b) => b.label === "Agent");
  const live = USE_FAKE || status === "open";

  return (
    <AppShell title="My agent">
      <div className="flex h-full flex-col gap-5 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Stat strip */}
          <section className="panel stat-divider flex overflow-x-auto">
            <Stat label="status" value={live ? "live" : "reconnecting…"} tone={live ? "green" : "amber"} />
            <Stat label="purchases" value={String(purchases)} />
            <Stat label="spent" value={`$${spentUsd.toFixed(4)}`} tone="green" />
            <Stat label="events" value={String(events.length)} />
          </section>

          {/* Reasoning feed */}
          <section className="min-h-0 flex-1" style={{ minHeight: "24rem" }}>
            <ReasoningStream events={events} />
          </section>
        </div>

        {/* Right rail */}
        <aside className="flex w-full shrink-0 flex-col gap-5 xl:w-80">
          <div className="panel flex flex-col gap-3 p-5">
            <span className="text-xs text-[var(--text-faint)]">hard budget</span>
            <span className="mono text-3xl font-semibold">
              ${spentUsd.toFixed(4)}
              <span className="text-base text-[var(--text-faint)]"> / ${DEMO_BUDGET_USD.toFixed(2)}</span>
            </span>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[var(--violet)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mono flex justify-between text-xs text-[var(--text-faint)]">
              <span>remaining ${remainingUsd.toFixed(4)}</span>
              <span>{agent ? `${agent.sol.toFixed(4)} SOL` : ""}</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-faint)]">
              The budget gate runs in code before any transaction is signed — the
              agent cannot overspend.
            </p>
          </div>

          <div className="panel p-5">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-dim)]">
              Cumulative spend
            </h3>
            <SpendChart events={events} />
          </div>

          <div className="panel p-5">
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-dim)]">
              Call distribution
            </h3>
            <CallDistribution events={events} />
          </div>

          {/* Routing policy panel */}
          <div className="panel flex flex-col gap-4 p-5">
            <h3 className="text-sm font-semibold text-[var(--text-dim)]">
              Routing policy
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-faint)]">max price / call</span>
                <span className="mono">${maxCallUsd.toFixed(3)}</span>
              </div>
              <input
                type="range"
                className="policy-slider"
                min={0.001}
                max={0.05}
                step={0.001}
                value={maxCallUsd}
                onChange={(e) => setMaxCallUsd(Number(e.target.value))}
              />
              <div className="mono flex justify-between text-[10px] text-[var(--text-faint)]">
                <span>$0.001</span>
                <span>$0.025</span>
                <span>$0.05</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-faint)]">quality threshold</span>
                <span className="mono">{qualityBar}%</span>
              </div>
              <input
                type="range"
                className="policy-slider"
                min={0}
                max={100}
                step={5}
                value={qualityBar}
                onChange={(e) => setQualityBar(Number(e.target.value))}
              />
              <div className="mono flex justify-between text-[10px] text-[var(--text-faint)]">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-faint)]">
              Advisory targets — the hard budget gate is enforced in agent code
              before signing.
            </p>
          </div>

          <div className="min-h-56 flex-1">
            <TxLog events={events} />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber";
}) {
  const color =
    tone === "green"
      ? "text-[var(--green)]"
      : tone === "amber"
        ? "text-[var(--amber)]"
        : "";
  return (
    <div className="flex min-w-32 flex-1 flex-col gap-1 px-5 py-4">
      <span className="text-xs text-[var(--text-faint)]">{label}</span>
      <span className={`mono text-lg font-semibold ${color}`}>{value}</span>
    </div>
  );
}
