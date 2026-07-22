"use client";

import { useEffect, useMemo, useState } from "react";
import { type AgentEvent, type ServiceListingWithPrice } from "@mercato/shared";
import { getFakeServices, subscribeFakeEvents } from "../lib/fakeFeed";
import { isPurchasePayload } from "../lib/eventPayloads";
import { BalanceStrip } from "./BalanceStrip";
import { PriceTable } from "./PriceTable";
import { ReasoningStream } from "./ReasoningStream";
import { TxLog } from "./TxLog";

// Fake-mode demo budget. In F3 this comes from fetchBalances().budgetUsd.
const DEMO_BUDGET_USD = 5;
const SERVICES_POLL_MS = 2000;

export function Dashboard() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [services, setServices] = useState<ServiceListingWithPrice[]>([]);

  useEffect(() => {
    return subscribeFakeEvents((e) => {
      setEvents((prev) => [...prev, e]);
    });
  }, []);

  useEffect(() => {
    setServices(getFakeServices());
    const timer = setInterval(() => setServices(getFakeServices()), SERVICES_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const spentLamports = useMemo(
    () =>
      events.reduce((sum, e) => {
        return isPurchasePayload(e.payload) ? sum + e.payload.amountLamports : sum;
      }, 0),
    [events],
  );

  return (
    <main className="grid h-screen grid-cols-2 grid-rows-[auto_1fr_auto] gap-4 p-4 font-mono text-neutral-100">
      <header className="col-span-2 flex items-baseline gap-3">
        <h1 className="text-2xl font-bold">Mercato</h1>
        <span className="text-neutral-500">agent-to-agent marketplace · solana devnet</span>
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
        <BalanceStrip spentLamports={spentLamports} budgetUsd={DEMO_BUDGET_USD} />
      </div>
    </main>
  );
}
