import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ListingsModule } from "./listings/listings.module";

@Module({
  imports: [HealthModule, ListingsModule],
})
export class AppModule {}
