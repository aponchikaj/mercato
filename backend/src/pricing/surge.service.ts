import { Injectable } from "@nestjs/common";
import { usdToLamports } from "@mercato/shared";

// demo-tunable
export const SURGE_WINDOW_MS = 60_000;
export const SURGE_COEFFICIENT = 0.5;

export interface SurgePrice {
  usd: number;
  lamports: number;
}

@Injectable()
export class SurgeService {
  private readonly windows = new Map<string, number[]>();

  getCurrentPrice(capability: string, basePriceUsd: number): SurgePrice {
    const count = this.requestsInLast60s(capability);
    const usd = basePriceUsd * (1 + SURGE_COEFFICIENT * count);
    return { usd, lamports: usdToLamports(usd) };
  }

  recordRequest(capability: string): void {
    const window = this.windows.get(capability) ?? [];
    window.push(Date.now());
    this.windows.set(capability, window);
  }

  requestsInLast60s(capability: string): number {
    const cutoff = Date.now() - SURGE_WINDOW_MS;
    const recent = (this.windows.get(capability) ?? []).filter((t) => t > cutoff);
    this.windows.set(capability, recent);
    return recent.length;
  }
}
