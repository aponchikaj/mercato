import { describe, expect, it } from "vitest";
import {
  Keypair,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  LAMPORTS_PER_SOL,
  PaymentRequirementsSchema,
  lamportsToSol,
  lamportsToUsd,
  solToLamports,
  usdToLamports,
} from "@mercato/shared";

describe("units", () => {
  it("converts USD to integer lamports at the demo rate", () => {
    // $1.50 at $150/SOL = 0.01 SOL = 10_000_000 lamports
    expect(usdToLamports(1.5)).toBe(10_000_000);
    expect(Number.isInteger(usdToLamports(0.333333))).toBe(true);
    expect(usdToLamports(150)).toBe(LAMPORTS_PER_SOL);
  });

  it("round-trips SOL <-> lamports and lamports <-> USD", () => {
    expect(solToLamports(lamportsToSol(123_456_789))).toBe(123_456_789);
    expect(lamportsToUsd(usdToLamports(2))).toBeCloseTo(2, 6);
    expect(Number.isInteger(solToLamports(0.1234567891))).toBe(true);
  });
});

describe("transfer", () => {
  it("builds and signs a devnet SOL transfer from a payment quote", () => {
    const payer = Keypair.generate();
    const recipient = Keypair.generate();

    const quote = PaymentRequirementsSchema.parse({
      amountLamports: usdToLamports(1.5),
      token: "SOL",
      recipient: recipient.publicKey.toBase58(),
      network: "solana-devnet",
      quoteId: "quote-test-001",
    });

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipient.publicKey,
        lamports: quote.amountLamports,
      }),
    );
    // Offline test: any 32-byte base58 string works as a blockhash.
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
    tx.feePayer = payer.publicKey;
    tx.sign(payer);

    expect(tx.verifySignatures()).toBe(true);
    const wire = tx.serialize();
    expect(wire.length).toBeGreaterThan(0);
    expect(quote.amountLamports).toBe(10_000_000);
  });
});
