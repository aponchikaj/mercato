import { Injectable } from "@nestjs/common";
import {
  MarketService,
  MarketServiceListSchema,
} from "@mercato/shared";
import { SurgeService } from "../pricing/surge.service";
import { SELLERS } from "./sellers.data";

@Injectable()
export class MarketCatalogService {
  constructor(private readonly surge: SurgeService) {}

  findAll(): MarketService[] {
    return MarketServiceListSchema.parse(
      SELLERS.map((seller) => {
        const price = this.surge.getCurrentPrice(
          seller.capability,
          seller.basePriceUsd,
        );
        return {
          name: seller.name,
          capability: seller.capability,
          url: seller.url,
          basePriceUsd: seller.basePriceUsd,
          currentPriceUsd: price.usd,
          currentPriceLamports: price.lamports,
        };
      }),
    );
  }
}
