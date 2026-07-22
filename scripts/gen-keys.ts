import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair } from "@solana/web3.js";

const KEYS_DIR = resolve(__dirname, "../keys");

const KEY_NAMES = [
  "agent",
  "geocoder",
  "translator",
  "search-cheap",
  "search-pro",
] as const;

function loadKeypairFromFile(filePath: string): Keypair {
  const raw: unknown = JSON.parse(readFileSync(filePath, "utf8"));
  if (!Array.isArray(raw) || raw.some((n) => typeof n !== "number")) {
    throw new Error(`Invalid keypair format in ${filePath}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function main(): void {
  mkdirSync(KEYS_DIR, { recursive: true });

  for (const name of KEY_NAMES) {
    const filePath = resolve(KEYS_DIR, `${name}.json`);

    if (existsSync(filePath)) {
      const keypair = loadKeypairFromFile(filePath);
      console.log(`${name}: ${keypair.publicKey.toBase58()}`);
      continue;
    }

    const keypair = Keypair.generate();
    writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
    console.log(`${name}: ${keypair.publicKey.toBase58()}`);
  }
}

main();
