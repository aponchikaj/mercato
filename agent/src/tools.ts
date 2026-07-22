import { Keypair } from "@solana/web3.js";
import type OpenAI from "openai";
import { z } from "zod";
import {
  PaymentRequirementsSchema,
  ServiceListingWithPriceSchema,
} from "@mercato/shared";
import { BACKEND_URL } from "./env";
import { Ledger } from "./ledger";
import { payQuote } from "./payments";

const ServiceListingWithSurgeSchema =
  ServiceListingWithPriceSchema.passthrough();
const ServiceListingListSchema = z.array(ServiceListingWithSurgeSchema);

const CallServiceArgsSchema = z.object({
  capability: z.string().min(1),
  params: z.record(z.unknown()),
});

export const TOOL_DEFINITIONS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_services",
      description: "List available marketplace services with current pricing.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "call_service",
      description:
        "Call a seller capability. Pays automatically when the seller returns HTTP 402.",
      parameters: {
        type: "object",
        properties: {
          capability: {
            type: "string",
            description: "Seller capability id, e.g. geocoder or translator",
          },
          params: {
            type: "object",
            description: "JSON request body for the seller endpoint",
          },
        },
        required: ["capability", "params"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_budget",
      description: "Show the agent budget, spend, and purchase history.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

export async function listServices(): Promise<unknown> {
  try {
    const response = await fetch(`${BACKEND_URL}/market/services`);
    if (!response.ok) {
      return { error: `list services failed: ${response.status}` };
    }

    const raw: unknown = await response.json();
    const parsed = ServiceListingListSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "invalid services response" };
    }

    return parsed.data;
  } catch {
    return { error: "list services request failed" };
  }
}

export async function callService(
  capability: string,
  params: Record<string, unknown>,
  ledger: Ledger,
  payer: Keypair,
): Promise<unknown> {
  const url = `${BACKEND_URL}/sellers/${encodeURIComponent(capability)}`;

  try {
    const initialResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (initialResponse.status === 200) {
      return await initialResponse.json();
    }

    if (initialResponse.status !== 402) {
      return { error: `unexpected seller status: ${initialResponse.status}` };
    }

    const quoteRaw: unknown = await initialResponse.json();
    const quoteParsed = PaymentRequirementsSchema.safeParse(quoteRaw);
    if (!quoteParsed.success) {
      return { error: "invalid 402 quote" };
    }

    const quote = quoteParsed.data;

    if (!ledger.canAfford(quote.amountLamports)) {
      return {
        error: "budget exceeded",
        quotedLamports: quote.amountLamports,
        remainingLamports: ledger.remainingLamports(),
      };
    }

    let signature: string;
    try {
      const payment = await payQuote(quote, payer);
      signature = payment.signature;
    } catch {
      return { error: "payment failed" };
    }

    ledger.record({
      seller: quote.recipient,
      capability,
      amountLamports: quote.amountLamports,
      txSignature: signature,
      timestamp: Date.now(),
    });

    const retryResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT": signature,
        "X-QUOTE-ID": quote.quoteId,
      },
      body: JSON.stringify(params),
    });

    if (retryResponse.status === 402) {
      return { error: "seller rejected payment", txSignature: signature };
    }

    if (!retryResponse.ok) {
      return {
        error: `seller retry failed: ${retryResponse.status}`,
        txSignature: signature,
      };
    }

    const body: unknown = await retryResponse.json();
    const paid = {
      txSignature: signature,
      amountLamports: quote.amountLamports,
    };

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return { ...body, paid };
    }

    return { result: body, paid };
  } catch {
    return { error: "call service request failed" };
  }
}

export function checkBudget(ledger: Ledger): unknown {
  return ledger.summary();
}

export async function executeTool(
  name: string,
  args: unknown,
  ledger: Ledger,
  payer: Keypair,
): Promise<unknown> {
  try {
    switch (name) {
      case "list_services":
        return await listServices();
      case "call_service": {
        const parsed = CallServiceArgsSchema.safeParse(args);
        if (!parsed.success) {
          return { error: "invalid call_service args" };
        }
        return await callService(
          parsed.data.capability,
          parsed.data.params,
          ledger,
          payer,
        );
      }
      case "check_budget":
        return checkBudget(ledger);
      default:
        return { error: `unknown tool: ${name}` };
    }
  } catch {
    return { error: "tool execution failed" };
  }
}
