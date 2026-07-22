import { Controller, Get } from "@nestjs/common";
import {
  ServiceListing,
  ServiceListingSchema,
  usdToLamports,
} from "@mercato/shared";

const LISTINGS: ServiceListing[] = [
  {
    name: "Summarizer",
    capability: "summarize",
    url: "http://localhost:4001/summarize",
    basePriceUsd: 0.5,
  },
].map((l) => ServiceListingSchema.parse(l));

@Controller()
export class AppController {
  @Get("health")
  health(): { ok: true; network: "solana-devnet" } {
    return { ok: true, network: "solana-devnet" };
  }

  @Get("listings")
  listings(): Array<ServiceListing & { basePriceLamports: number }> {
    return LISTINGS.map((l) => ({
      ...l,
      basePriceLamports: usdToLamports(l.basePriceUsd),
    }));
  }
}
