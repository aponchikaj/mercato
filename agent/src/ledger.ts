import {
  lamportsToUsd,
  usdToLamports,
  type PurchaseRecord,
} from "@mercato/shared";
import { env } from "./env";

export interface LedgerSummary {
  budgetLamports: number;
  spentLamports: number;
  remainingLamports: number;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  purchases: PurchaseRecord[];
}

export class Ledger {
  readonly budgetLamports = usdToLamports(env.AGENT_BUDGET_USD);
  spentLamports = 0;
  purchases: PurchaseRecord[] = [];

  canAfford(amountLamports: number): boolean {
    return this.spentLamports + amountLamports <= this.budgetLamports;
  }

  remainingLamports(): number {
    return this.budgetLamports - this.spentLamports;
  }

  record(purchase: PurchaseRecord): void {
    this.purchases.push(purchase);
    this.spentLamports += purchase.amountLamports;
  }

  summary(): LedgerSummary {
    const remainingLamports = this.remainingLamports();
    return {
      budgetLamports: this.budgetLamports,
      spentLamports: this.spentLamports,
      remainingLamports,
      budgetUsd: lamportsToUsd(this.budgetLamports),
      spentUsd: lamportsToUsd(this.spentLamports),
      remainingUsd: lamportsToUsd(remainingLamports),
      purchases: [...this.purchases],
    };
  }
}
