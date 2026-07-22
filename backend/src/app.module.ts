import { Module } from "@nestjs/common";
import { KeysModule } from "./common/keys.module";
import { EventsModule } from "./events/events.module";
import { HealthModule } from "./health/health.module";
import { MarketModule } from "./market/market.module";
import { PricingModule } from "./pricing/pricing.module";
import { SellersModule } from "./sellers/sellers.module";
import { SolanaModule } from "./solana/solana.module";

@Module({
  imports: [
    KeysModule,
    PricingModule,
    EventsModule,
    HealthModule,
    MarketModule,
    SellersModule,
    SolanaModule,
  ],
})
export class AppModule {}
