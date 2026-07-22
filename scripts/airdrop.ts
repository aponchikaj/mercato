import { config as loadDotenv } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { lamportsToSol, parseEnv, solToLamports } from "@mercato/shared";

loadDotenv({ path: resolve(__dirname, "../.env") });

const AIRDROP_SOL = 2;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function loadAgentKeypair(): Keypair {
  const agentKeyPath = resolve(__dirname, "../keys/agent.json");
  const secretKey = Uint8Array.from(
    JSON.parse(readFileSync(agentKeyPath, "utf8")) as number[],
  );
  return Keypair.fromSecretKey(secretKey);
}

function isRateLimited(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return message.includes("429");
}

async function requestAirdropWithConfirm(
  connection: Connection,
  pubkey: PublicKey,
  lamports: number,
): Promise<void> {
  const signature = await connection.requestAirdrop(pubkey, lamports);
  await connection.confirmTransaction(signature, "confirmed");
}

async function main(): Promise<void> {
  const env = parseEnv();
  const agent = loadAgentKeypair();
  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const lamports = solToLamports(AIRDROP_SOL);

  console.log(`Agent pubkey: ${agent.publicKey.toBase58()}`);
  console.log(`Requesting ${AIRDROP_SOL} SOL airdrop...`);

  try {
    await requestAirdropWithConfirm(connection, agent.publicKey, lamports);
  } catch (firstError) {
    const reason = isRateLimited(firstError) ? "429 rate limit" : "airdrop failed";
    console.warn(`${reason}, retrying once after 2s...`);
    await sleep(RETRY_DELAY_MS);

    try {
      await requestAirdropWithConfirm(connection, agent.publicKey, lamports);
    } catch {
      console.error(
        "Airdrop failed after retry. Fund manually at https://faucet.solana.com",
      );
      console.error(`Pubkey: ${agent.publicKey.toBase58()}`);
      process.exit(1);
    }
  }

  const balance = await connection.getBalance(agent.publicKey);
  console.log(`Balance: ${lamportsToSol(balance)} SOL (${balance} lamports)`);
}

void main();
