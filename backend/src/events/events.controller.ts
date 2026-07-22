import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Sse,
} from "@nestjs/common";
import type { MessageEvent } from "@nestjs/common";
import { AgentEventSchema } from "@mercato/shared";
import { Observable } from "rxjs";
import { EventsBusService } from "./events.bus";

const KEEP_ALIVE_MS = 15_000;

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsBusService) {}

  @Post("ingest")
  ingest(@Body() body: unknown): { ok: true } {
    const parsed = AgentEventSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    this.events.emit(parsed.data);
    return { ok: true };
  }

  @Get("stream")
  @Sse()
  @Header("Cache-Control", "no-cache, no-transform")
  @Header("Content-Encoding", "identity")
  @Header("X-Accel-Buffering", "no")
  stream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      for (const event of this.events.getBuffer()) {
        subscriber.next({ data: event });
      }

      const unsubscribe = this.events.subscribe((event) => {
        subscriber.next({ data: event });
      });

      // Named event type: keeps proxies from idling the connection out, but
      // EventSource.onmessage never fires for it, so consumers only see
      // real AgentEvents on the default channel.
      const ping = setInterval(() => {
        subscriber.next({ type: "ping", data: "" });
      }, KEEP_ALIVE_MS);

      return () => {
        unsubscribe();
        clearInterval(ping);
      };
    });
  }
}
