// demo fallback — flip USE_FAKE in config.ts
import {
  type AgentEvent,
  type MarketService,
  type PurchaseRecord,
  usdToLamports,
} from "@mercato/shared";
import type { EventSubscriber } from "./events";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Plausible ~88-char base58 Solana signature (not real, demo only). */
function fakeSignature(): string {
  let out = "";
  for (let i = 0; i < 88; i += 1) {
    out += BASE58.charAt(Math.floor(Math.random() * BASE58.length));
  }
  return out;
}

interface SellerSeed {
  name: string;
  capability: string;
  url: string;
  basePriceUsd: number;
}

// Mirror the backend's sellers (see backend/src/market/sellers.data.ts) so the
// fallback looks identical to the live feed. currentPrice* drifts upward on
// each getFakeServices() call so the price-flash is visible on stage.
const SELLERS: SellerSeed[] = [
  { name: "Geocoder", capability: "geocoder", url: "http://localhost:4000/sellers/geocoder", basePriceUsd: 0.002 },
  { name: "Translator", capability: "translator", url: "http://localhost:4000/sellers/translator", basePriceUsd: 0.005 },
  { name: "Search Cheap", capability: "search-cheap", url: "http://localhost:4000/sellers/search-cheap", basePriceUsd: 0.003 },
  { name: "Search Pro", capability: "search-pro", url: "http://localhost:4000/sellers/search-pro", basePriceUsd: 0.009 },
];

const currentUsd = new Map<string, number>(
  SELLERS.map((s) => [s.name, s.basePriceUsd]),
);

export function getFakeServices(): MarketService[] {
  return SELLERS.map((s) => {
    const prev = currentUsd.get(s.name) ?? s.basePriceUsd;
    // Drift upward 0.5%–4% each call.
    const nextUsd = prev * (1 + 0.005 + Math.random() * 0.035);
    currentUsd.set(s.name, nextUsd);
    return {
      name: s.name,
      capability: s.capability,
      url: s.url,
      basePriceUsd: s.basePriceUsd,
      currentPriceUsd: nextUsd,
      currentPriceLamports: usdToLamports(nextUsd),
    };
  });
}

function purchase(seller: string, capability: string, usd: number): PurchaseRecord {
  return {
    seller,
    capability,
    amountLamports: usdToLamports(usd),
    txSignature: fakeSignature(),
    timestamp: Date.now(),
  };
}

// reasoning -> purchase -> decision -> purchase -> result, ~1.5s apart, looping.
// Each step is a factory so signatures/timestamps stay fresh on every loop.
const SCRIPT: Array<() => Pick<AgentEvent, "kind" | "payload">> = [
  () => ({
    kind: "reasoning",
    payload: {
      text: "Task: geocode 3 addresses, translate the results to French, then web-search each. Fetching quotes from all sellers.",
    },
  }),
  () => ({ kind: "purchase", payload: purchase("Geocoder", "geocoder", 0.002) }),
  () => ({
    kind: "decision",
    payload: {
      text: "search-cheap surged above search-pro's quality-adjusted price. Routing web-search to search-pro instead.",
      from: "search-cheap",
      to: "search-pro",
    },
  }),
  () => ({ kind: "purchase", payload: purchase("Search Pro", "search-pro", 0.009) }),
  () => ({
    kind: "result",
    payload: {
      text: "Completed 3 tasks under budget. Settled 2 payments on devnet.",
      addresses: [
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        "So11111111111111111111111111111111111111112",
      ],
    },
  }),
];

export const subscribeFakeEvents: EventSubscriber = (onEvent, onStatus) => {
  // The fake feed is always "connected".
  onStatus?.("open");
  let index = 0;
  const timer = setInterval(() => {
    const build = SCRIPT[index % SCRIPT.length];
    index += 1;
    if (!build) return;
    const { kind, payload } = build();
    onEvent({ kind, payload, timestamp: Date.now() });
  }, 1500);
  return () => clearInterval(timer);
};
