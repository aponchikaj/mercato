import { type AgentEvent, AgentEventSchema } from "@mercato/shared";
import { getBackendUrl } from "./env";

export type ConnectionStatus = "connecting" | "open" | "reconnecting";

/** Matches subscribeFakeEvents so Dashboard swaps on USE_FAKE alone. */
export type EventSubscriber = (
  onEvent: (e: AgentEvent) => void,
  onStatus?: (status: ConnectionStatus) => void,
) => () => void;

const RECONNECT_MS = 1000;

export const subscribeEvents: EventSubscriber = (onEvent, onStatus) => {
  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  // The backend replays its ring buffer to every new subscriber, so a
  // reconnect would re-deliver history — dedupe across the subscription.
  const seen = new Set<string>();

  const connect = (): void => {
    if (closed) return;
    source = new EventSource(`${getBackendUrl()}/events/stream`);

    source.onopen = () => onStatus?.("open");

    source.onmessage = (message: MessageEvent<string>) => {
      let data: unknown;
      try {
        data = JSON.parse(message.data);
      } catch {
        return; // drop unparseable frames
      }
      const parsed = AgentEventSchema.safeParse(data);
      if (!parsed.success) return; // silently drop invalid events
      const key = `${parsed.data.kind}:${parsed.data.timestamp}`;
      if (seen.has(key)) return; // ring-buffer replay after reconnect
      seen.add(key);
      onEvent({
        kind: parsed.data.kind,
        payload: parsed.data.payload ?? null,
        timestamp: parsed.data.timestamp,
      });
    };

    source.onerror = () => {
      onStatus?.("reconnecting");
      source?.close();
      source = null;
      if (!closed) {
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      }
    };
  };

  onStatus?.("connecting");
  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    source?.close();
    source = null;
  };
};
