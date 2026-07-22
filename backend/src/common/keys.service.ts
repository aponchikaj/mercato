import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Injectable } from "@nestjs/common";
import { Keypair, PublicKey } from "@solana/web3.js";

@Injectable()
export class KeysService {
  private readonly keysDir = resolve(__dirname, "../../../keys");
  private readonly pubkeys = new Map<string, PublicKey>();

  getPubkey(name: string): PublicKey {
    const cached = this.pubkeys.get(name);
    if (cached) return cached;

    const path = resolve(this.keysDir, `${name}.json`);
    if (!existsSync(path)) {
      throw new Error(
        `Missing key file keys/${name}.json — run pnpm gen:keys from the repo root`,
      );
    }

    const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(raw) || raw.some((n) => typeof n !== "number")) {
      throw new Error(`Invalid keypair format in keys/${name}.json`);
    }

    const pubkey = Keypair.fromSecretKey(Uint8Array.from(raw)).publicKey;
    this.pubkeys.set(name, pubkey);
    return pubkey;
  }
}
