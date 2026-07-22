import { Module } from "@nestjs/common";
import { PricingModule } from "../pricing/pricing.module";
import { MarketBalancesService } from "./market.balances.service";
import { MarketController } from "./market.controller";
import { MarketCatalogService } from "./market.service";

@Module({
  imports: [PricingModule],
  controllers: [MarketController],
  providers: [MarketCatalogService, MarketBalancesService],
})
export class MarketModule {}
