import { z } from "zod";
import type {
  AgentEvent,
  PaymentRequirements,
  PurchaseRecord,
  ServiceListing,
  ServiceListingWithPrice,
} from "./types";

export const ServiceListingSchema = z.object({
  name: z.string().min(1),
  capability: z.string().min(1),
  url: z.string().url(),
  basePriceUsd: z.number().positive(),
}) satisfies z.ZodType<ServiceListing>;

export const ServiceListingWithPriceSchema = ServiceListingSchema.extend({
  basePriceLamports: z.number().int().nonnegative(),
}) satisfies z.ZodType<ServiceListingWithPrice>;

export const ServiceListingListSchema = z.array(ServiceListingWithPriceSchema);

export const PaymentRequirementsSchema = z.object({
  amountLamports: z.number().int().nonnegative(),
  token: z.literal("SOL"),
  recipient: z.string().min(32).max(44),
  network: z.literal("solana-devnet"),
  quoteId: z.string().min(1),
}) satisfies z.ZodType<PaymentRequirements>;

export const PurchaseRecordSchema = z.object({
  seller: z.string().min(1),
  capability: z.string().min(1),
  amountLamports: z.number().int().nonnegative(),
  txSignature: z.string().min(1),
  timestamp: z.number().int().nonnegative(),
}) satisfies z.ZodType<PurchaseRecord>;

// zod infers `z.unknown()` keys as optional, so payload parity is checked
// with the key marked optional; runtime shape is identical to AgentEvent.
export const AgentEventSchema = z.object({
  kind: z.enum(["reasoning", "purchase", "decision", "result"]),
  payload: z.unknown(),
  timestamp: z.number().int().nonnegative(),
}) satisfies z.ZodType<Omit<AgentEvent, "payload"> & { payload?: unknown }>;

export const EnvSchema = z.object({
  SOLANA_RPC_URL: z.string().url(),
  LLM_API_KEY: z.string().min(1),
  AGENT_BUDGET_USD: z.coerce.number().positive(),
  BACKEND_PORT: z.coerce.number().int().min(1).max(65535),
});

export type Env = z.infer<typeof EnvSchema>;

/** Validate required environment variables. Throws with a readable message on failure. */
export function parseEnv(
  source: Record<string, string | undefined> = process.env,
): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return result.data;
}
