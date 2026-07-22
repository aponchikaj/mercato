import { EventEmitter } from "node:events";
import { Injectable } from "@nestjs/common";
import { AgentEvent, AgentEventSchema } from "@mercato/shared";

const RING_BUFFER_SIZE = 200;

@Injectable()
export class EventsBusService {
  private readonly emitter = new EventEmitter();
  private readonly buffer: AgentEvent[] = [];

  emit(event: unknown): void {
    const parsed = AgentEventSchema.parse(event);
    const normalized: AgentEvent = {
      kind: parsed.kind,
      payload: parsed.payload ?? null,
      timestamp: parsed.timestamp,
    };
    this.push(normalized);
    this.emitter.emit("event", normalized);
  }

  getBuffer(): readonly AgentEvent[] {
    return this.buffer;
  }

  subscribe(listener: (event: AgentEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }

  private push(event: AgentEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > RING_BUFFER_SIZE) {
      this.buffer.shift();
    }
  }
}
