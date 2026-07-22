/**
 * SYNC 1 handshake test — exercises the full 402 flow through the agent's
 * production code path, then checks the seller rejects a replayed signature.
 *
 * Run: pnpm exec tsx scripts/handshake-test.ts [capability]
 */
import { loadAgentKeypair } from "../agent/src/wallet";
import { Ledger } from "../agent/src/ledger";
import { callService } from "../agent/src/tools";
import { BACKEND_URL } from "../agent/src/env";

const capability = process.argv[2] ?? "geocoder";
const params = { address: "10 Downing Street, London" };

function fail(step: string, detail: unknown): never {
  console.error(`\n❌ HANDSHAKE FAILED at ${step}:`);
  console.error(JSON.stringify(detail, null, 2));
  process.exit(1);
}

async function main(): Promise<void> {
  const payer = loadAgentKeypair();
  const ledger = new Ledger();
  console.log(`agent: ${payer.publicKey.toBase58()}`);
  console.log(`target: POST ${BACKEND_URL}/sellers/${capability}\n`);

  // Step 1 — bare request must 402 with a valid quote (callService handles
  // parse + budget gate + pay + retry internally; errors surface as {error}).
  console.log("step 1: full 402 -> pay -> redeem via agent callService...");
  const result = (await callService(capability, params, ledger, payer)) as {
    error?: string;
    paid?: { txSignature: string; amountLamports: number };
  };

  if (result.error) fail("callService", result);
  if (!result.paid) fail("callService (no paid field)", result);

  console.log("✅ paid + redeemed");
  console.log(`   tx: ${result.paid.txSignature}`);
  console.log(`   amount: ${result.paid.amountLamports} lamports`);
  console.log(`   data: ${JSON.stringify(result).slice(0, 200)}...\n`);

  // Step 2 — replaying the same signature must be rejected with a fresh 402.
  console.log("step 2: replaying the same X-PAYMENT signature...");
  const fresh402 = await fetch(`${BACKEND_URL}/sellers/${capability}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (fresh402.status !== 402) fail("expected 402 for fresh quote", fresh402.status);
  const freshQuote = (await fresh402.json()) as { quoteId: string };

  const replay = await fetch(`${BACKEND_URL}/sellers/${capability}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-PAYMENT": result.paid.txSignature,
      "X-QUOTE-ID": freshQuote.quoteId,
    },
    body: JSON.stringify(params),
  });
  const replayBody: unknown = await replay.json();
  if (replay.status !== 402) fail("replay was ACCEPTED (should be 402)", replayBody);

  console.log("✅ replay rejected with 402:");
  console.log(`   ${JSON.stringify(replayBody).slice(0, 200)}\n`);

  console.log("ledger after run:");
  console.log(JSON.stringify(ledger.summary(), null, 2));
  console.log("\n🎉 HANDSHAKE VERIFIED — 402 quote, on-chain payment, redemption, replay guard all working.");
}

void main();
