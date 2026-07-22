import { Injectable } from "@nestjs/common";
import { Connection } from "@solana/web3.js";
import { parseEnv, type PaymentRequirements } from "@mercato/shared";

const STALE_WINDOW_SEC = 90;
const FETCH_RETRIES = 3;
const FETCH_RETRY_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

@Injectable()
export class VerifyService {
  private readonly seen = new Set<string>();

  async verifyPayment(
    signature: string,
    quote: PaymentRequirements,
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (this.seen.has(signature)) {
      return { ok: false, reason: "replayed signature" };
    }

    const connection = new Connection(parseEnv().SOLANA_RPC_URL, "confirmed");

    let tx = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    for (let attempt = 1; attempt < FETCH_RETRIES && tx === null; attempt += 1) {
      await sleep(FETCH_RETRY_DELAY_MS);
      tx = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
    }

    if (tx === null) {
      return { ok: false, reason: "transaction not found" };
    }

    if (tx.meta === null || tx.meta.err !== null) {
      return { ok: false, reason: "transaction failed" };
    }

    const accountKeys = tx.transaction.message.accountKeys;
    const recipientIndex = accountKeys.findIndex(
      (account) => account.pubkey.toBase58() === quote.recipient,
    );

    if (recipientIndex === -1) {
      return { ok: false, reason: "recipient not in transaction" };
    }

    const preBalance = tx.meta.preBalances[recipientIndex];
    const postBalance = tx.meta.postBalances[recipientIndex];

    if (preBalance === undefined || postBalance === undefined) {
      return { ok: false, reason: "amount below quote" };
    }

    const delta = postBalance - preBalance;

    if (delta < quote.amountLamports) {
      return { ok: false, reason: "amount below quote" };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (tx.blockTime === null || tx.blockTime === undefined) {
      return { ok: false, reason: "stale transaction" };
    }

    if (nowSec - tx.blockTime > STALE_WINDOW_SEC) {
      return { ok: false, reason: "stale transaction" };
    }

    this.seen.add(signature);
    return { ok: true };
  }
}
