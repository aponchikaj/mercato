import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Keypair } from "@solana/web3.js";

export function loadAgentKeypair(): Keypair {
  const agentKeyPath = resolve(__dirname, "../../keys/agent.json");
  const raw: unknown = JSON.parse(readFileSync(agentKeyPath, "utf8"));
  if (!Array.isArray(raw) || raw.some((n) => typeof n !== "number")) {
    throw new Error("Invalid keypair format in keys/agent.json");
  }
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}
