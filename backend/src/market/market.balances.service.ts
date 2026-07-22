import { Injectable, OnModuleInit } from "@nestjs/common";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  lamportsToSol,
  MarketBalancesResponse,
  MarketBalancesResponseSchema,
  parseEnv,
} from "@mercato/shared";
import { KeysService } from "../common/keys.service";
import { SELLERS } from "./sellers.data";

const CACHE_TTL_MS = 2_000;

interface TrackedWallet {
  label: string;
  pubkey: PublicKey;
}

@Injectable()
export class MarketBalancesService implements OnModuleInit {
  private connection!: Connection;
  private wallets: TrackedWallet[] = [];
  private cache: { fetchedAt: number; response: MarketBalancesResponse } | null =
    null;
  private lastGood: MarketBalancesResponse | null = null;
  private inFlight: Promise<MarketBalancesResponse> | null = null;

  constructor(private readonly keys: KeysService) {}

  onModuleInit(): void {
    this.connection = new Connection(parseEnv().SOLANA_RPC_URL, "confirmed");
    this.wallets = [
      { label: "Agent", pubkey: this.keys.getPubkey("agent") },
      ...SELLERS.map((seller) => ({
        label: seller.name,
        pubkey: this.keys.getPubkey(seller.keyFile.replace(/\.json$/, "")),
      })),
    ];
  }

  async getBalances(): Promise<MarketBalancesResponse> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.response;
    }

    // Concurrent cold-cache requests share one RPC fetch.
    this.inFlight ??= this.refresh(now).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async refresh(now: number): Promise<MarketBalancesResponse> {
    try {
      const response = await this.fetchBalances();
      this.cache = { fetchedAt: now, response };
      this.lastGood = response;
      return response;
    } catch {
      if (this.lastGood) {
        return MarketBalancesResponseSchema.parse({
          ...this.lastGood,
          stale: true,
        });
      }
      return MarketBalancesResponseSchema.parse({
        stale: true,
        balances: this.zeroBalances(),
      });
    }
  }

  private async fetchBalances(): Promise<MarketBalancesResponse> {
    // eslint-disable-next-line no-console
    console.log(`[balances] rpc fetch (${this.wallets.length} wallets)`);
    const accounts = await this.connection.getMultipleAccountsInfo(
      this.wallets.map((wallet) => wallet.pubkey),
    );

    return MarketBalancesResponseSchema.parse({
      balances: this.wallets.map((wallet, index) => {
        const lamports = accounts[index]?.lamports ?? 0;
        return {
          label: wallet.label,
          pubkey: wallet.pubkey.toBase58(),
          lamports,
          sol: lamportsToSol(lamports),
        };
      }),
    });
  }

  private zeroBalances(): MarketBalancesResponse["balances"] {
    return this.wallets.map((wallet) => ({
      label: wallet.label,
      pubkey: wallet.pubkey.toBase58(),
      lamports: 0,
      sol: lamportsToSol(0),
    }));
  }
}
