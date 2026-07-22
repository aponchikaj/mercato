"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type MarketService, lamportsToUsd } from "@mercato/shared";
import { AppShell } from "../../components/AppShell";
import { TryModal } from "../../components/TryModal";
import { PriceHistoryChart } from "../../components/charts/PriceHistoryChart";
import { isPurchasePayload } from "../../lib/eventPayloads";
import { useAgentEvents, useServices } from "../../lib/hooks";

const FLASH_MS = 900;
const DEMO_BUDGET_USD = 5;

const SORTS = [
  { key: "price", label: "price ↑" },
  { key: "surge", label: "surge %" },
  { key: "name", label: "name" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

// Filter slider ticks (max price per call, USD)
const SLIDER_MAX_USD = 0.05;
const SLIDER_TICKS = ["$0", "$0.01", "$0.02", "$0.03", "$0.04", "$0.05"];

function surgePct(s: MarketService): number {
  return s.basePriceUsd > 0
    ? ((s.currentPriceUsd - s.basePriceUsd) / s.basePriceUsd) * 100
    : 0;
}

export default function MarketsPage() {
  const services = useServices();
  const { events } = useAgentEvents();
  const [sort, setSort] = useState<SortKey>("price");
  const [maxPriceUsd, setMaxPriceUsd] = useState(SLIDER_MAX_USD);
  const [trying, setTrying] = useState<MarketService | null>(null);

  // Surge flash when a current price rises between polls.
  const prevPrices = useRef<Map<string, number>>(new Map());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const risen: string[] = [];
    for (const s of services) {
      const prev = prevPrices.current.get(s.name);
      if (prev !== undefined && s.currentPriceLamports > prev) risen.push(s.name);
      prevPrices.current.set(s.name, s.currentPriceLamports);
    }
    if (risen.length === 0) return;
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

  const visible = useMemo(() => {
    const filtered = services.filter((s) => s.currentPriceUsd <= maxPriceUsd);
    const sorted = [...filtered];
    if (sort === "price") sorted.sort((a, b) => a.currentPriceUsd - b.currentPriceUsd);
    if (sort === "surge") sorted.sort((a, b) => surgePct(b) - surgePct(a));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [services, sort, maxPriceUsd]);

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

          {/* Live price history */}
          <section className="panel p-5">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-[var(--text-dim)]">
                Price per call — live surge
              </h2>
              <span className="pill ml-auto px-3 py-1 text-xs text-[var(--text-faint)]">
                last ~3 min
              </span>
            </div>
            <PriceHistoryChart services={services} />
          </section>

          {/* Seller rows */}
          <section className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="mr-2 text-sm font-semibold text-[var(--text-dim)]">
                Pay-per-call offers
              </h2>
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={`sort-pill px-3 py-1 text-xs ${sort === s.key ? "active" : ""}`}
                >
                  {s.label}
                </button>
              ))}
              <span className="pill ml-auto px-3 py-1 text-xs text-[var(--text-faint)]">
                x402 · HTTP 402
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {visible.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--text-faint)]">
                  {services.length === 0
                    ? "waiting for market feed…"
                    : "no offers under the price filter"}
                </p>
              )}
              {visible.map((s) => {
                const pct = surgePct(s);
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
                        pct > 0.5 ? "text-[var(--red)]" : "text-[var(--green)]"
                      }`}
                    >
                      {pct > 0.5 ? `+${pct.toFixed(0)}%` : "base"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTrying(s)}
                      className="sort-pill px-3.5 py-1.5 text-xs font-medium"
                    >
                      Try
                    </button>
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

          {/* Live filter slider with tick labels */}
          <div className="panel flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-faint)]">max price / call</span>
              <span className="mono text-xs">${maxPriceUsd.toFixed(3)}</span>
            </div>
            <input
              type="range"
              className="policy-slider"
              min={0}
              max={SLIDER_MAX_USD}
              step={0.001}
              value={maxPriceUsd}
              onChange={(e) => setMaxPriceUsd(Number(e.target.value))}
            />
            <div className="mono flex justify-between text-[10px] text-[var(--text-faint)]">
              {SLIDER_TICKS.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
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

      {trying && <TryModal service={trying} onClose={() => setTrying(null)} />}
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
