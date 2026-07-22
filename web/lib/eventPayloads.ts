import { type PurchaseRecord, PurchaseRecordSchema } from "@mercato/shared";

/**
 * AgentEvent.payload is typed `unknown` in the shared contract. These guards
 * are the ONLY sanctioned way to narrow it — every component reads payloads
 * through them, never via a cast.
 */

export interface ReasoningPayload {
  text: string;
}

export interface DecisionPayload {
  text: string;
  from: string;
  to: string;
}

export interface ResultPayload {
  text: string;
  addresses: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isReasoningPayload(payload: unknown): payload is ReasoningPayload {
  return isRecord(payload) && typeof payload.text === "string";
}

export function isDecisionPayload(payload: unknown): payload is DecisionPayload {
  return (
    isRecord(payload) &&
    typeof payload.text === "string" &&
    typeof payload.from === "string" &&
    typeof payload.to === "string"
  );
}

export function isPurchasePayload(payload: unknown): payload is PurchaseRecord {
  return PurchaseRecordSchema.safeParse(payload).success;
}

export function isResultPayload(payload: unknown): payload is ResultPayload {
  return (
    isRecord(payload) &&
    typeof payload.text === "string" &&
    Array.isArray(payload.addresses) &&
    payload.addresses.every((a): a is string => typeof a === "string")
  );
}
