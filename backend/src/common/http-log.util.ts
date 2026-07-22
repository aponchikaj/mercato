import type { Request } from "express";

const SENSITIVE_KEYS = new Set([
  "x-payment",
  "x_payment",
  "payment",
  "txsignature",
  "tx_signature",
]);

export function truncatePayment(value: string): string {
  return value.length <= 8 ? value : `${value.slice(0, 8)}…`;
}

export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForLog(entry));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase()) && typeof entry === "string") {
        out[key] = truncatePayment(entry);
        continue;
      }
      out[key] = sanitizeForLog(entry);
    }
    return out;
  }
  return value;
}

export function buildRequestLogPayload(req: Request): unknown {
  const payload: Record<string, unknown> = {
    body: sanitizeForLog(req.body),
  };
  const payment = req.headers["x-payment"];
  if (typeof payment === "string") {
    payload.xPayment = truncatePayment(payment);
  }
  return payload;
}

export function formatLogBody(payload: unknown): string {
  return JSON.stringify(payload).slice(0, 300);
}

export function firstErrorLine(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.stack?.split("\n")[0] ?? exception.message;
  }
  return String(exception);
}

export function errorMessage(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message;
  }
  return String(exception);
}
