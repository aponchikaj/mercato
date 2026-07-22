/**
 * Shared domain contracts. Keep in sync with the zod schemas in schemas.ts
 * (matching names). No business logic in this module.
 */

/** A service an agent can purchase from a seller. */
export interface ServiceListing {
  name: string;
  capability: string;
  url: string;
  basePriceUsd: number;
}

/** Payment terms quoted by a seller for a single purchase. */
export interface PaymentRequirements {
  amountLamports: number;
  token: "SOL";
  recipient: string;
  network: "solana-devnet";
  quoteId: string;
}

/** A completed purchase, settled on-chain. */
export interface PurchaseRecord {
  seller: string;
  capability: string;
  amountLamports: number;
  txSignature: string;
  timestamp: number;
}

/** A single event emitted by the agent while it works. */
export interface AgentEvent {
  kind: "reasoning" | "purchase" | "decision" | "result";
  payload: unknown;
  timestamp: number;
}
