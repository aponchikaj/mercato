import { Connection } from "@solana/web3.js";
import { lamportsToSol, lamportsToUsd } from "@mercato/shared";
import { env } from "./env";
import { Ledger } from "./ledger";
import { runAgent } from "./loop";
import { loadAgentKeypair } from "./wallet";

const DEMO_TASK =
  "Geocode these 3 addresses: '10 Downing Street, London', '350 Fifth Avenue, New York, NY', 'Eiffel Tower, Paris'. For each one, enrich it with one interesting fact using a search service — you choose the provider; watch prices and quality. Then translate the final three-line report into French. Stay within budget.";

async function main(): Promise<void> {
  const payer = loadAgentKeypair();
  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const balanceLamports = await connection.getBalance(payer.publicKey);

  console.log(`Agent pubkey: ${payer.publicKey.toBase58()}`);
  console.log(`Balance: ${lamportsToSol(balanceLamports)} SOL`);

  const ledger = new Ledger();
  const answer = await runAgent(DEMO_TASK, ledger, payer);

  console.log("\n--- Final answer ---\n");
  console.log(answer);

  console.log("\n--- Purchases ---");
  if (ledger.purchases.length === 0) {
    console.log("(none)");
  } else {
    for (const purchase of ledger.purchases) {
      console.log(
        `${purchase.capability}\t$${lamportsToUsd(purchase.amountLamports).toFixed(6)}\t${purchase.txSignature}`,
      );
    }
  }

  const summary = ledger.summary();
  console.log(
    `\nTotals: spent $${summary.spentUsd.toFixed(4)} / budget $${summary.budgetUsd.toFixed(4)} (${lamportsToSol(summary.spentLamports)} / ${lamportsToSol(summary.budgetLamports)} SOL)`,
  );
}

void main();
