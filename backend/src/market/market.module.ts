import { Module } from "@nestjs/common";
import { PricingModule } from "../pricing/pricing.module";
import { MarketController } from "./market.controller";
import { MarketCatalogService } from "./market.service";

@Module({
  imports: [PricingModule],
  controllers: [MarketController],
  providers: [MarketCatalogService],
})
export class MarketModule {}
