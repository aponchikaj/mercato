import { Keypair } from "@solana/web3.js";
import OpenAI from "openai";
import type { AgentEvent } from "@mercato/shared";
import { BACKEND_URL, env } from "./env";
import { Ledger } from "./ledger";
import { executeTool, TOOL_DEFINITIONS } from "./tools";

const MODEL = "openai/gpt-oss-120b";
const MAX_TOOL_CALLS = 25;
const TOOL_BUDGET_EXHAUSTED =
  "Tool budget exhausted — produce your final answer now from what you have";
const MALFORMED_TOOL_MESSAGE =
  "Your previous tool call was malformed. Use the tools API strictly — one tool call at a time with valid JSON arguments.";
const MAX_TOOL_USE_FAILED_RETRIES = 3;
const OTHER_ERROR_RETRY_DELAY_MS = 2000;

const SYSTEM_PROMPT = `You are an autonomous purchasing agent on Solana devnet with a HARD budget. Rules: check the market (list_services) and budget (check_budget) before any purchase; prices surge with demand — re-check before buying again; prefer cheaper providers, but INSPECT every result for quality — if data looks like garbage, say so explicitly and consider the premium alternative; never buy anything that would exceed the remaining budget; before each purchase state in one sentence why; keep reasoning concise.`;

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: env.LLM_API_KEY,
  maxRetries: 5,
});

type ChatCompletionResult =
  | { ok: true; response: OpenAI.Chat.ChatCompletion }
  | { ok: false; abortMessage: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isToolUseFailedError(error: unknown): boolean {
  return error instanceof OpenAI.APIError && error.code === "tool_use_failed";
}

function abortMessage(
  lastAssistantText: string,
  reason: string,
): string {
  if (lastAssistantText) {
    return `${reason}\n\n${lastAssistantText}`;
  }
  return reason;
}

async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, "model" | "messages">,
  lastAssistantText: string,
): Promise<ChatCompletionResult> {
  let toolUseFailedRetries = 0;
  let otherErrorRetried = false;

  while (true) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages,
        ...options,
      });
      return { ok: true, response };
    } catch (error) {
      if (isToolUseFailedError(error)) {
        if (toolUseFailedRetries >= MAX_TOOL_USE_FAILED_RETRIES) {
          return {
            ok: false,
            abortMessage:
              lastAssistantText ||
              "run aborted: model kept producing malformed tool calls",
          };
        }

        messages.push({ role: "system", content: MALFORMED_TOOL_MESSAGE });
        toolUseFailedRetries += 1;
        continue;
      }

      if (!otherErrorRetried) {
        otherErrorRetried = true;
        await sleep(OTHER_ERROR_RETRY_DELAY_MS);
        continue;
      }

      return {
        ok: false,
        abortMessage: abortMessage(lastAssistantText, "run aborted: LLM API error"),
      };
    }
  }
}

function pushToolBudgetExhaustedResponses(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[],
  answeredIds: ReadonlySet<string>,
): void {
  for (const toolCall of toolCalls) {
    if (answeredIds.has(toolCall.id)) {
      continue;
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({ error: "tool budget exhausted" }),
    });
  }
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

function emitResultEvent(answer: string, ledger: Ledger): void {
  postEvent({
    kind: "result",
    payload: {
      answer,
      spentLamports: ledger.spentLamports,
      budgetLamports: ledger.budgetLamports,
    },
    timestamp: Date.now(),
  });
}

async function finalizeAgent(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  ledger: Ledger,
  lastAssistantText: string,
): Promise<string> {
  messages.push({ role: "system", content: TOOL_BUDGET_EXHAUSTED });

  const completion = await createChatCompletion(
    messages,
    { tools: TOOL_DEFINITIONS, tool_choice: "none" },
    lastAssistantText,
  );

  if (!completion.ok) {
    emitResultEvent(completion.abortMessage, ledger);
    return completion.abortMessage;
  }

  const message = completion.response.choices[0]?.message;
  const answer = message?.content ?? "";

  if (answer) {
    postEvent({
      kind: "reasoning",
      payload: { text: answer },
      timestamp: Date.now(),
    });
  }

  emitResultEvent(answer, ledger);
  return answer;
}

export async function runAgent(
  task: string,
  ledger: Ledger,
  payer: Keypair,
): Promise<string> {
  let lastAssistantText = "";

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: task },
    ];

    let toolCallCount = 0;

    while (true) {
      const completion = await createChatCompletion(
        messages,
        { tools: TOOL_DEFINITIONS },
        lastAssistantText,
      );

      if (!completion.ok) {
        emitResultEvent(completion.abortMessage, ledger);
        return completion.abortMessage;
      }

      const message = completion.response.choices[0]?.message;
      if (!message) {
        const answer = lastAssistantText || "run aborted: LLM API error";
        emitResultEvent(answer, ledger);
        return answer;
      }

      if (message.content) {
        lastAssistantText = message.content;
        postEvent({
          kind: "reasoning",
          payload: { text: message.content },
          timestamp: Date.now(),
        });
      }

      messages.push(message);

      const toolCalls = message.tool_calls ?? [];
      if (toolCalls.length === 0) {
        const answer = message.content ?? lastAssistantText;
        emitResultEvent(answer, ledger);
        return answer;
      }

      if (toolCallCount >= MAX_TOOL_CALLS) {
        pushToolBudgetExhaustedResponses(messages, toolCalls, new Set());
        return finalizeAgent(messages, ledger, lastAssistantText);
      }

      const answeredIds = new Set<string>();

      for (const toolCall of toolCalls) {
        if (toolCallCount >= MAX_TOOL_CALLS) {
          pushToolBudgetExhaustedResponses(messages, toolCalls, answeredIds);
          return finalizeAgent(messages, ledger, lastAssistantText);
        }

        if (toolCall.type !== "function") {
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: "unsupported tool call type" }),
          });
          answeredIds.add(toolCall.id);
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
          answeredIds.add(toolCall.id);
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
        answeredIds.add(toolCall.id);

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
        pushToolBudgetExhaustedResponses(messages, toolCalls, answeredIds);
        return finalizeAgent(messages, ledger, lastAssistantText);
      }
    }
  } catch {
    const answer = abortMessage(lastAssistantText, "run aborted: LLM API error");
    emitResultEvent(answer, ledger);
    return answer;
  }
}
