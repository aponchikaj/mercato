import { Global, Module } from "@nestjs/common";
import { SurgeService } from "./surge.service";

@Global()
@Module({
  providers: [SurgeService],
  exports: [SurgeService],
})
export class PricingModule {}
