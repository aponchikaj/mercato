import { Controller, Get } from "@nestjs/common";
import { MarketService } from "@mercato/shared";
import { MarketCatalogService } from "./market.service";

@Controller("market")
export class MarketController {
  constructor(private readonly market: MarketCatalogService) {}

  @Get("services")
  findAll(): MarketService[] {
    return this.market.findAll();
  }
}
