// demo fallback — flip USE_FAKE in config.ts
import {
  type AgentEvent,
  type PurchaseRecord,
  type ServiceListingWithPrice,
  usdToLamports,
} from "@mercato/shared";

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

// The 4 sellers. basePriceUsd is the fixed sticker; the on-chain price
// (basePriceLamports) drifts upward on each getFakeServices() call.
const SELLERS: SellerSeed[] = [
  { name: "geocoder", capability: "geocode", url: "https://geocoder.demo/x402", basePriceUsd: 0.002 },
  { name: "translator", capability: "translate", url: "https://translator.demo/x402", basePriceUsd: 0.005 },
  { name: "search-cheap", capability: "web-search", url: "https://search-cheap.demo/x402", basePriceUsd: 0.003 },
  { name: "search-pro", capability: "web-search", url: "https://search-pro.demo/x402", basePriceUsd: 0.009 },
];

// Per-seller live lamport price, seeded from the USD sticker and drifted up.
const currentLamports = new Map<string, number>(
  SELLERS.map((s) => [s.name, usdToLamports(s.basePriceUsd)]),
);

export function getFakeServices(): ServiceListingWithPrice[] {
  return SELLERS.map((s) => {
    const prev = currentLamports.get(s.name) ?? usdToLamports(s.basePriceUsd);
    // Drift upward 0.5%–4% each call so the price-flash is visible on stage.
    const next = Math.round(prev * (1 + 0.005 + Math.random() * 0.035));
    currentLamports.set(s.name, next);
    return {
      name: s.name,
      capability: s.capability,
      url: s.url,
      basePriceUsd: s.basePriceUsd,
      basePriceLamports: next,
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
  () => ({ kind: "purchase", payload: purchase("geocoder", "geocode", 0.002) }),
  () => ({
    kind: "decision",
    payload: {
      text: "search-cheap surged above search-pro's quality-adjusted price. Routing web-search to search-pro instead.",
      from: "search-cheap",
      to: "search-pro",
    },
  }),
  () => ({ kind: "purchase", payload: purchase("search-pro", "web-search", 0.009) }),
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

export function subscribeFakeEvents(
  onEvent: (e: AgentEvent) => void,
): () => void {
  let index = 0;
  const timer = setInterval(() => {
    const build = SCRIPT[index % SCRIPT.length];
    index += 1;
    if (!build) return;
    const { kind, payload } = build();
    onEvent({ kind, payload, timestamp: Date.now() });
  }, 1500);
  return () => clearInterval(timer);
}
