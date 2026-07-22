import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { PricingModule } from "../pricing/pricing.module";
import { SellersController } from "./sellers.controller";
import { SellersService } from "./sellers.service";

@Module({
  imports: [PricingModule, EventsModule],
  controllers: [SellersController],
  providers: [SellersService],
})
export class SellersModule {}
