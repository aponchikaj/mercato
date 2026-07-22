import { Injectable } from "@nestjs/common";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { parseEnv, type PaymentRequirements } from "@mercato/shared";

@Injectable()
export class PaymentsService {
  async payQuote(
    quote: PaymentRequirements,
    payer: Keypair,
  ): Promise<{ signature: string }> {
    const connection = new Connection(parseEnv().SOLANA_RPC_URL, "confirmed");
    const recipient = new PublicKey(quote.recipient);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipient,
        lamports: quote.amountLamports,
      }),
    );

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;

    const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
    return { signature };
  }
}
