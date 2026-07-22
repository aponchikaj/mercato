"use client";

import { useEffect, useRef } from "react";
import { type AgentEvent, lamportsToUsd } from "@mercato/shared";
import {
  isDecisionPayload,
  isPurchasePayload,
  isReasoningPayload,
  isResultPayload,
} from "../lib/eventPayloads";

export interface ReasoningStreamProps {
  events: AgentEvent[];
}

export function ReasoningStream({ events }: ReasoningStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="panel flex h-full flex-col p-5">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-dim)]">
        Live reasoning
      </h2>
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto pr-1">
        {events.map((e, i) => (
          <Bubble key={`${e.timestamp}-${i}`} event={e} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function Bubble({ event }: { event: AgentEvent }) {
  const { kind, payload } = event;

  if (kind === "reasoning" && isReasoningPayload(payload)) {
    return (
      <p className="panel-inset px-3.5 py-2.5 text-sm leading-relaxed text-[var(--text-dim)]">
        {payload.text}
      </p>
    );
  }

  if (kind === "decision" && isDecisionPayload(payload)) {
    return (
      <div className="rounded-md border-l-4 border-amber-500 bg-amber-500/10 px-3 py-2 text-amber-200">
        <div>{payload.text}</div>
        <div className="mt-1 text-sm text-amber-400/80">
          {payload.from} → {payload.to}
        </div>
      </div>
    );
  }

  if (kind === "purchase" && isPurchasePayload(payload)) {
    return (
      <div className="flex items-center justify-between rounded-md bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
        <span>
          paid {payload.seller} <span className="text-emerald-500/80">({payload.capability})</span>
        </span>
        <span className="tabular-nums">${lamportsToUsd(payload.amountLamports).toFixed(4)}</span>
      </div>
    );
  }

  if (kind === "result" && isResultPayload(payload)) {
    return (
      <div className="rounded-md border border-neutral-600 bg-neutral-800/40 px-3 py-2 text-neutral-100">
        <div className="mb-1 text-sm uppercase tracking-wide text-neutral-500">result</div>
        <div>{payload.text}</div>
        {payload.addresses.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-sm text-neutral-400">
            {payload.addresses.map((a) => (
              <li key={a} className="truncate font-mono">{a}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return null;
}
