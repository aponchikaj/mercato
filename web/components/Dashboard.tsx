"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type AgentEvent,
  type MarketBalancesResponse,
  type MarketService,
} from "@mercato/shared";
import { USE_FAKE } from "../lib/config";
import { getFakeServices, subscribeFakeEvents } from "../lib/fakeFeed";
import { fetchBalances, fetchServices } from "../lib/market";
import { type ConnectionStatus, subscribeEvents } from "../lib/events";
import { isPurchasePayload } from "../lib/eventPayloads";
import { BalanceStrip } from "./BalanceStrip";
import { PriceTable } from "./PriceTable";
import { ReasoningStream } from "./ReasoningStream";
import { TxLog } from "./TxLog";

// Demo budget. The backend does not expose a budget on /market/balances and we
// add no new env vars, so this mirrors AGENT_BUDGET_USD's default.
const DEMO_BUDGET_USD = 5;
const SERVICES_POLL_MS = 2000;
const BALANCES_POLL_MS = 3000;

export function Dashboard() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [services, setServices] = useState<MarketService[]>([]);
  const [balances, setBalances] = useState<MarketBalancesResponse | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  // Event stream — swaps on USE_FAKE alone (identical subscriber signature).
  useEffect(() => {
    const subscribe = USE_FAKE ? subscribeFakeEvents : subscribeEvents;
    return subscribe(
      (e) => setEvents((prev) => [...prev, e]),
      (s) => setStatus(s),
    );
  }, []);

  // Poll services every 2s (fake is synchronous, real is fetched + validated).
  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const next = USE_FAKE ? getFakeServices() : await fetchServices();
      if (!cancelled) setServices(next);
    };
    void load();
    const timer = setInterval(() => void load(), SERVICES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Poll balances every 3s (real feed only).
  useEffect(() => {
    if (USE_FAKE) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      const next = await fetchBalances();
      if (!cancelled) setBalances(next);
    };
    void load();
    const timer = setInterval(() => void load(), BALANCES_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const spentLamports = useMemo(
    () =>
      events.reduce((sum, e) => {
        return isPurchasePayload(e.payload) ? sum + e.payload.amountLamports : sum;
      }, 0),
    [events],
  );

  const agentSol = balances?.balances.find((b) => b.label === "Agent")?.sol;
  const reconnecting = !USE_FAKE && status !== "open";

  return (
    <main className="grid h-screen grid-cols-2 grid-rows-[auto_1fr_auto] gap-4 p-4 font-mono text-neutral-100">
      <header className="col-span-2 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">Mercato</h1>
        <span className="text-neutral-500">agent-to-agent marketplace · solana devnet</span>
        {reconnecting && (
          <span className="ml-auto animate-pulse rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
            reconnecting…
          </span>
        )}
      </header>

      <div className="col-start-1 min-h-0 overflow-hidden">
        <ReasoningStream events={events} />
      </div>
      <div className="col-start-2 min-h-0 overflow-hidden">
        <PriceTable services={services} />
      </div>

      <div className="col-span-2 grid grid-cols-[2fr_1fr] gap-4">
        <div className="max-h-56 min-h-0 overflow-hidden">
          <TxLog events={events} />
        </div>
        <BalanceStrip
          spentLamports={spentLamports}
          budgetUsd={DEMO_BUDGET_USD}
          agentSol={agentSol}
        />
      </div>
    </main>
  );
}
