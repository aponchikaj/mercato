import { Global, Module } from "@nestjs/common";
import { EventsBusService } from "./events.bus";
import { EventsController } from "./events.controller";

@Global()
@Module({
  controllers: [EventsController],
  providers: [EventsBusService],
  exports: [EventsBusService],
})
export class EventsModule {}
