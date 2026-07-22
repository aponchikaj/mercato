import { Keypair } from "@solana/web3.js";
import OpenAI from "openai";
import type { AgentEvent } from "@mercato/shared";
import { BACKEND_URL, env } from "./env";
import { Ledger } from "./ledger";
import { executeTool, TOOL_DEFINITIONS } from "./tools";

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOOL_CALLS = 25;
const TOOL_BUDGET_EXHAUSTED =
  "Tool budget exhausted — produce your final answer now from what you have";

const SYSTEM_PROMPT = `You are an autonomous purchasing agent on Solana devnet with a HARD budget. Rules: check the market (list_services) and budget (check_budget) before any purchase; prices surge with demand — re-check before buying again; prefer cheaper providers, but INSPECT every result for quality — if data looks like garbage, say so explicitly and consider the premium alternative; never buy anything that would exceed the remaining budget; before each purchase state in one sentence why; keep reasoning concise.`;

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: env.LLM_API_KEY,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function postEvent(event: AgentEvent): void {
  void fetch(`${BACKEND_URL}/events/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
}

function emitPurchaseFromResult(
  result: unknown,
  capability: string,
): void {
  if (!isRecord(result) || !isRecord(result.paid)) {
    return;
  }

  const { paid } = result;
  if (
    typeof paid.txSignature !== "string" ||
    typeof paid.amountLamports !== "number"
  ) {
    return;
  }

  postEvent({
    kind: "purchase",
    payload: {
      capability,
      amountLamports: paid.amountLamports,
      txSignature: paid.txSignature,
    },
    timestamp: Date.now(),
  });
}

async function finalizeAgent(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ledger: Ledger,
): Promise<string> {
  messages.push({ role: "system", content: TOOL_BUDGET_EXHAUSTED });

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    tools: TOOL_DEFINITIONS,
    tool_choice: "none",
  });

  const message = response.choices[0]?.message;
  const answer = message?.content ?? "";

  if (answer) {
    postEvent({
      kind: "reasoning",
      payload: { text: answer },
      timestamp: Date.now(),
    });
  }

  postEvent({
    kind: "result",
    payload: {
      answer,
      spentLamports: ledger.spentLamports,
      budgetLamports: ledger.budgetLamports,
    },
    timestamp: Date.now(),
  });

  return answer;
}

export async function runAgent(
  task: string,
  ledger: Ledger,
  payer: Keypair,
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: task },
  ];

  let toolCallCount = 0;

  while (true) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOL_DEFINITIONS,
    });

    const message = response.choices[0]?.message;
    if (!message) {
      return "";
    }

    if (message.content) {
      postEvent({
        kind: "reasoning",
        payload: { text: message.content },
        timestamp: Date.now(),
      });
    }

    messages.push(message);

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      const answer = message.content ?? "";
      postEvent({
        kind: "result",
        payload: {
          answer,
          spentLamports: ledger.spentLamports,
          budgetLamports: ledger.budgetLamports,
        },
        timestamp: Date.now(),
      });
      return answer;
    }

    if (toolCallCount >= MAX_TOOL_CALLS) {
      return finalizeAgent(messages, ledger);
    }

    for (const toolCall of toolCalls) {
      if (toolCallCount >= MAX_TOOL_CALLS) {
        break;
      }

      if (toolCall.type !== "function") {
        continue;
      }

      const toolName = toolCall.function.name;
      let parsedArgs: unknown;
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments) as unknown;
      } catch {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: "bad arguments" }),
        });
        toolCallCount += 1;
        continue;
      }

      postEvent({
        kind: "decision",
        payload: {
          tool: toolName,
          args: parsedArgs,
          why: message.content ?? "",
        },
        timestamp: Date.now(),
      });

      const result = await executeTool(toolName, parsedArgs, ledger, payer);
      toolCallCount += 1;

      if (toolName === "call_service" && isRecord(parsedArgs)) {
        const capability =
          typeof parsedArgs.capability === "string"
            ? parsedArgs.capability
            : "unknown";
        emitPurchaseFromResult(result, capability);
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    if (toolCallCount >= MAX_TOOL_CALLS) {
      return finalizeAgent(messages, ledger);
    }
  }
}
