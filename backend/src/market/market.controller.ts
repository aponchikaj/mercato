import { Controller, Get } from "@nestjs/common";
import { MarketBalancesResponse, MarketService } from "@mercato/shared";
import { MarketBalancesService } from "./market.balances.service";
import { MarketCatalogService } from "./market.service";

@Controller("market")
export class MarketController {
  constructor(
    private readonly market: MarketCatalogService,
    private readonly balances: MarketBalancesService,
  ) {}

  @Get("services")
  findAll(): MarketService[] {
    return this.market.findAll();
  }

  @Get("balances")
  getBalances(): Promise<MarketBalancesResponse> {
    return this.balances.getBalances();
  }
}
