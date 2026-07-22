import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { PricingModule } from "../pricing/pricing.module";
import { SolanaModule } from "../solana/solana.module";
import { SellersController } from "./sellers.controller";
import { SellersService } from "./sellers.service";

@Module({
  imports: [PricingModule, EventsModule, SolanaModule],
  controllers: [SellersController],
  providers: [SellersService],
})
export class SellersModule {}
