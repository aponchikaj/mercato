import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair } from "@solana/web3.js";

const REPO_ROOT = resolve(__dirname, "..");
const KEYS_DIR = resolve(REPO_ROOT, "keys");

const KEY_FILES: ReadonlyArray<{ file: string; label: string }> = [
  { file: "agent.json", label: "agent" },
  { file: "seller-geocoder.json", label: "seller-geocoder" },
  { file: "seller-translator.json", label: "seller-translator" },
  { file: "seller-search-cheap.json", label: "seller-search-cheap" },
  { file: "seller-search-pro.json", label: "seller-search-pro" },
];

function loadPubkey(path: string): string {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(raw) || raw.some((n) => typeof n !== "number")) {
    throw new Error(`Invalid keypair format in ${path}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(raw)).publicKey.toBase58();
}

function generateKeypair(path: string): string {
  const keypair = Keypair.generate();
  writeFileSync(path, JSON.stringify(Array.from(keypair.secretKey)));
  return keypair.publicKey.toBase58();
}

function main(): void {
  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true });
    console.log(`created ${KEYS_DIR}`);
  }

  for (const { file, label } of KEY_FILES) {
    const path = resolve(KEYS_DIR, file);
    if (existsSync(path)) {
      console.log(`skip ${label}: ${file} already exists`);
      console.log(`  pubkey: ${loadPubkey(path)}`);
      continue;
    }
    const pubkey = generateKeypair(path);
    console.log(`${label}: ${pubkey}`);
  }
}

main();
