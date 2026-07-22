"use client";

import { useEffect, useState } from "react";
import {
  type AgentEvent,
  type MarketBalancesResponse,
  type MarketService,
} from "@mercato/shared";
import { USE_FAKE } from "./config";
import { getFakeServices, subscribeFakeEvents } from "./fakeFeed";
import { fetchBalances, fetchServices } from "./market";
import { type ConnectionStatus, subscribeEvents } from "./events";

const SERVICES_POLL_MS = 2000;
const BALANCES_POLL_MS = 3000;

/** Live market services, polled every 2s (fake or real per USE_FAKE). */
export function useServices(): MarketService[] {
  const [services, setServices] = useState<MarketService[]>([]);

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

  return services;
}

/** Agent event stream with connection status. */
export function useAgentEvents(): {
  events: AgentEvent[];
  status: ConnectionStatus;
} {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const subscribe = USE_FAKE ? subscribeFakeEvents : subscribeEvents;
    return subscribe(
      (e) => setEvents((prev) => [...prev, e]),
      (s) => setStatus(s),
    );
  }, []);

  return { events, status };
}

/** Wallet balances, polled every 3s (real feed only). */
export function useBalances(): MarketBalancesResponse | null {
  const [balances, setBalances] = useState<MarketBalancesResponse | null>(null);

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

  return balances;
}
