import type { PaymentRequirements } from "@mercato/shared";

// SYNC1: swap to real verify.service from Track K
export async function verifyPayment(
  _header: string,
  _quote: PaymentRequirements,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  return { ok: true };
}
