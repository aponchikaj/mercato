import { Module } from "@nestjs/common";
import { KeysModule } from "./common/keys.module";
import { HealthModule } from "./health/health.module";
import { ListingsModule } from "./listings/listings.module";

@Module({
  imports: [KeysModule, HealthModule, ListingsModule],
})
export class AppModule {}
