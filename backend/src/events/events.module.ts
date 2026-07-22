import { Global, Module } from "@nestjs/common";
import { EventsBusService } from "./events.bus";

@Global()
@Module({
  providers: [EventsBusService],
  exports: [EventsBusService],
})
export class EventsModule {}
