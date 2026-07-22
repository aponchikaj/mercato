import { config as loadDotenv } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { lamportsToSol, parseEnv, solToLamports } from "@mercato/shared";

loadDotenv({ path: resolve(__dirname, "../.env") });

// Devnet rejects transfers that leave the recipient below the rent-exempt
// minimum (~890_880 lamports), so micro-payments to empty seller accounts
// fail. Seed each seller once so 402 redemptions can land.
const SEED_SOL = 0.002;

const SELLER_KEY_NAMES = [
  "geocoder",
  "translator",
  "search-cheap",
  "search-pro",
] as const;

function loadKeypair(name: string): Keypair {
  const path = resolve(__dirname, `../keys/${name}.json`);
  const raw = JSON.parse(readFileSync(path, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main(): Promise<void> {
  const env = parseEnv();
  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const agent = loadKeypair("agent");
  const seedLamports = solToLamports(SEED_SOL);

  for (const name of SELLER_KEY_NAMES) {
    const seller: PublicKey = loadKeypair(name).publicKey;
    const balance = await connection.getBalance(seller);

    if (balance >= seedLamports) {
      console.log(`${name}: already seeded (${balance} lamports)`);
      continue;
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: agent.publicKey,
        toPubkey: seller,
        lamports: seedLamports,
      }),
    );
    await sendAndConfirmTransaction(connection, tx, [agent], {
      commitment: "confirmed",
    });
    console.log(`${name}: seeded ${SEED_SOL} SOL -> ${seller.toBase58()}`);
  }

  const agentBalance = await connection.getBalance(agent.publicKey);
  console.log(
    `agent balance: ${lamportsToSol(agentBalance)} SOL (${agentBalance} lamports)`,
  );
}

void main();
