import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import {
  PaymentRequirements,
  PaymentRequirementsSchema,
} from "@mercato/shared";
import { KeysService } from "../common/keys.service";
import { SELLERS, SellerEntry } from "../market/sellers.data";
import { SurgeService } from "../pricing/surge.service";
import {
  geocode,
  searchCheap,
  searchPro,
  translate,
} from "./fixtures";

const QUOTE_TTL_MS = 5 * 60_000;

interface StoredQuote {
  capability: string;
  amountLamports: number;
  issuedAt: number;
}

@Injectable()
export class SellersService implements OnModuleInit {
  private readonly recipients = new Map<string, string>();
  private readonly quotes = new Map<string, StoredQuote>();

  constructor(
    private readonly keys: KeysService,
    private readonly surge: SurgeService,
  ) {}

  onModuleInit(): void {
    for (const seller of SELLERS) {
      const keyName = seller.keyFile.replace(/\.json$/, "");
      this.recipients.set(
        seller.capability,
        this.keys.getPubkey(keyName).toBase58(),
      );
    }
  }

  findSeller(capability: string): SellerEntry | undefined {
    return SELLERS.find((seller) => seller.capability === capability);
  }

  getRecipient(capability: string): string {
    const recipient = this.recipients.get(capability);
    if (!recipient) {
      throw new NotFoundException(`Unknown seller capability: ${capability}`);
    }
    return recipient;
  }

  issuePaymentRequirements(seller: SellerEntry): PaymentRequirements {
    const price = this.surge.getCurrentPrice(
      seller.capability,
      seller.basePriceUsd,
    );
    const requirements = PaymentRequirementsSchema.parse({
      amountLamports: price.lamports,
      token: "SOL",
      recipient: this.getRecipient(seller.capability),
      network: "solana-devnet",
      quoteId: randomUUID(),
    });

    this.pruneExpiredQuotes();
    this.quotes.set(requirements.quoteId, {
      capability: seller.capability,
      amountLamports: requirements.amountLamports,
      issuedAt: Date.now(),
    });
    return requirements;
  }

  resolveQuote(
    capability: string,
    quoteId: string,
  ): PaymentRequirements | undefined {
    const stored = this.quotes.get(quoteId);
    if (!stored || stored.capability !== capability) return undefined;
    if (Date.now() - stored.issuedAt > QUOTE_TTL_MS) {
      this.quotes.delete(quoteId);
      return undefined;
    }

    const seller = this.findSeller(capability);
    if (!seller) return undefined;

    return PaymentRequirementsSchema.parse({
      amountLamports: stored.amountLamports,
      token: "SOL",
      recipient: this.getRecipient(capability),
      network: "solana-devnet",
      quoteId,
    });
  }

  /** One quote redeems one purchase — drop it once payment is verified. */
  consumeQuote(quoteId: string): void {
    this.quotes.delete(quoteId);
  }

  private pruneExpiredQuotes(): void {
    const cutoff = Date.now() - QUOTE_TTL_MS;
    for (const [id, quote] of this.quotes) {
      if (quote.issuedAt < cutoff) {
        this.quotes.delete(id);
      }
    }
  }

  serveFixture(capability: string, body: unknown): unknown {
    const record = asRecord(body);

    switch (capability) {
      case "geocoder":
        return geocode({
          address: asString(record.address),
        });
      case "translator":
        return translate({
          text: asString(record.text),
          targetLang: asString(record.targetLang, "en"),
        });
      case "search-cheap":
        return searchCheap({ query: asString(record.query) });
      case "search-pro":
        return searchPro({ query: asString(record.query) });
      default:
        throw new NotFoundException(`Unknown seller capability: ${capability}`);
    }
  }
}

function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body === "object" && body !== null) {
    return body as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
