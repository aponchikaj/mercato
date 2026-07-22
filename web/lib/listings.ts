import { MarketServiceListSchema, type MarketService } from "@mercato/shared";
import { getBackendUrl } from "./env";

export async function fetchListings(): Promise<MarketService[]> {
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
