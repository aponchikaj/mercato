import {
  type MarketBalancesResponse,
  MarketBalancesResponseSchema,
  type MarketService,
  MarketServiceListSchema,
} from "@mercato/shared";
import { getBackendUrl } from "./env";

// Last-good balances so a transient RPC blip degrades instead of blanking.
let lastGoodBalances: MarketBalancesResponse = { balances: [] };

export async function fetchServices(): Promise<MarketService[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/market/services`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const parsed = MarketServiceListSchema.safeParse(await res.json());
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function fetchBalances(): Promise<MarketBalancesResponse> {
  try {
    const res = await fetch(`${getBackendUrl()}/market/balances`, {
      cache: "no-store",
    });
    if (!res.ok) return lastGoodBalances;
    const parsed = MarketBalancesResponseSchema.safeParse(await res.json());
    if (!parsed.success) return lastGoodBalances;
    lastGoodBalances = parsed.data;
    return parsed.data;
  } catch {
    return lastGoodBalances;
  }
}
