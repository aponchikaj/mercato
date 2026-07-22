"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lamportsToUsd } from "@mercato/shared";
import { AppShell } from "../../components/AppShell";
import { isPurchasePayload } from "../../lib/eventPayloads";
import { useAgentEvents, useServices } from "../../lib/hooks";

const FLASH_MS = 900;
const DEMO_BUDGET_USD = 5;

export default function MarketsPage() {
  const services = useServices();
  const { events } = useAgentEvents();

  // Track surge flashes when a current price rises between polls.
  const prevPrices = useRef<Map<string, number>>(new Map());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());
  const surgeCount = useRef(0);

  useEffect(() => {
    const risen: string[] = [];
    for (const s of services) {
      const prev = prevPrices.current.get(s.name);
      if (prev !== undefined && s.currentPriceLamports > prev) risen.push(s.name);
      prevPrices.current.set(s.name, s.currentPriceLamports);
    }
    if (risen.length === 0) return;
    surgeCount.current += risen.length;
    setFlashing((cur) => new Set([...cur, ...risen]));
    const timer = setTimeout(() => {
      setFlashing((cur) => {
        const next = new Set(cur);
        for (const name of risen) next.delete(name);
        return next;
      });
    }, FLASH_MS);
    return () => clearTimeout(timer);
  }, [services]);

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

  const avgPriceUsd =
    services.length > 0
      ? services.reduce((s, x) => s + x.currentPriceUsd, 0) / services.length
      : 0;

  return (
    <AppShell title="Markets">
      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Stat strip */}
          <section className="panel stat-divider flex overflow-x-auto">
            <Stat label="live services" value={String(services.length)} />
            <Stat label="avg price / call" value={`$${avgPriceUsd.toFixed(4)}`} />
            <Stat
              label="agent spend"
              value={`$${spentUsd.toFixed(4)}`}
              tone={spentUsd > 0 ? "green" : undefined}
            />
            <Stat label="settlement" value="SOL · devnet" />
          </section>

          {/* Seller rows */}
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-[var(--text-dim)]">
                Pay-per-call offers
              </h2>
              <span className="pill px-3 py-1 text-xs text-[var(--text-faint)]">
                x402 · HTTP 402
              </span>
              <span className="pill ml-auto px-3 py-1 text-xs text-[var(--text-faint)]">
                polled every 2s
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {services.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--text-faint)]">
                  waiting for market feed…
                </p>
              )}
              {services.map((s) => {
                const surgePct =
                  s.basePriceUsd > 0
                    ? ((s.currentPriceUsd - s.basePriceUsd) / s.basePriceUsd) * 100
                    : 0;
                return (
                  <div
                    key={s.name}
                    className={`panel-inset flex items-center gap-4 px-4 py-3 ${
                      flashing.has(s.name) ? "surge-flash" : ""
                    }`}
                  >
                    <span className="glow-cta flex h-9 w-9 shrink-0 items-center justify-center text-xs font-semibold">
                      {s.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="truncate text-xs text-[var(--text-faint)]">
                        {s.capability}
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="mono text-sm">${s.currentPriceUsd.toFixed(4)}</div>
                      <div className="mono text-xs text-[var(--text-faint)]">
                        base ${s.basePriceUsd.toFixed(4)}
                      </div>
                    </div>
                    <span
                      className={`pill mono w-20 px-2.5 py-1 text-center text-xs ${
                        surgePct > 0.5 ? "text-[var(--red)]" : "text-[var(--green)]"
                      }`}
                    >
                      {surgePct > 0.5 ? `+${surgePct.toFixed(0)}%` : "base"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="flex w-full shrink-0 flex-col gap-5 xl:w-72">
          <div className="panel flex flex-col gap-2 p-5">
            <span className="text-xs text-[var(--text-faint)]">agent budget</span>
            <span className="mono text-3xl font-semibold">
              ${DEMO_BUDGET_USD.toFixed(2)}
            </span>
            <span className="mono text-xs text-[var(--green)]">
              ${spentUsd.toFixed(4)} spent this session
            </span>
          </div>

          <div className="panel flex flex-col gap-3 p-5 text-sm">
            <Row k="protocol" v="x402" />
            <Row k="token" v="SOL" />
            <Row k="network" v="solana-devnet" />
            <Row k="surge model" v="demand-based" />
          </div>

          <a
            href="/agent"
            className="glow-cta px-5 py-3 text-center text-sm font-semibold"
          >
            Watch the agent live →
          </a>
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
  tone?: "green";
}) {
  return (
    <div className="flex min-w-36 flex-1 flex-col gap-1 px-5 py-4">
      <span className="text-xs text-[var(--text-faint)]">{label}</span>
      <span
        className={`mono text-lg font-semibold ${
          tone === "green" ? "text-[var(--green)]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-faint)]">{k}</span>
      <span className="mono text-[var(--text)]">{v}</span>
    </div>
  );
}
