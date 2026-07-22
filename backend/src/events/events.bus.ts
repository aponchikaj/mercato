import { EventEmitter } from "node:events";
import { Injectable } from "@nestjs/common";
import { AgentEvent, AgentEventSchema } from "@mercato/shared";

@Injectable()
export class EventsBusService {
  private readonly emitter = new EventEmitter();

  emit(event: AgentEvent): void {
    const parsed = AgentEventSchema.parse(event);
    this.emitter.emit("event", parsed);
  }

  subscribe(listener: (event: AgentEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }
}
