"use client";

import { useEffect, useState } from "react";
import {
  type MarketService,
  type PaymentRequirements,
  PaymentRequirementsSchema,
  lamportsToUsd,
} from "@mercato/shared";
import { getBackendUrl } from "../lib/env";

const SAMPLE_PARAMS: Record<string, Record<string, unknown>> = {
  geocoder: { address: "Eiffel Tower, Paris" },
  translator: { text: "The agent pays per call.", targetLang: "fr" },
  "search-cheap": { query: "Eiffel Tower" },
  "search-pro": { query: "Eiffel Tower" },
};

type Stage =
  | { step: "request" }
  | { step: "quoted"; quote: PaymentRequirements }
  | { step: "error"; message: string };

export function TryModal({
  service,
  onClose,
}: {
  service: MarketService;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>({ step: "request" });

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      try {
        const res = await fetch(
          `${getBackendUrl()}/sellers/${encodeURIComponent(service.name)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(SAMPLE_PARAMS[service.name] ?? {}),
          },
        );
        if (res.status !== 402) {
          if (!cancelled)
            setStage({ step: "error", message: `expected 402, got ${res.status}` });
          return;
        }
        const parsed = PaymentRequirementsSchema.safeParse(await res.json());
        if (!parsed.success) {
          if (!cancelled) setStage({ step: "error", message: "invalid quote" });
          return;
        }
        if (!cancelled) setStage({ step: "quoted", quote: parsed.data });
      } catch {
        if (!cancelled) setStage({ step: "error", message: "backend unreachable" });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [service]);

  return (
    <div className="modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="panel w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Try {service.name} — x402 handshake
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="pill px-3 py-1 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            close
          </button>
        </div>

        <ol className="flex flex-col gap-3 text-sm">
          <Step n={1} done label={`POST /sellers/${service.name} (no payment)`} />
          <Step
            n={2}
            done={stage.step === "quoted"}
            label="402 Payment Required — live quote"
          />
          {stage.step === "quoted" && (
            <div className="panel-inset mono flex flex-col gap-1.5 p-3.5 text-xs">
              <Row k="amount" v={`${stage.quote.amountLamports} lamports ($${lamportsToUsd(stage.quote.amountLamports).toFixed(4)})`} />
              <Row k="token" v={stage.quote.token} />
              <Row k="network" v={stage.quote.network} />
              <Row k="recipient" v={`${stage.quote.recipient.slice(0, 12)}…`} />
              <Row k="quoteId" v={`${stage.quote.quoteId.slice(0, 18)}…`} />
            </div>
          )}
          {stage.step === "error" && (
            <p className="panel-inset p-3 text-xs text-[var(--red)]">{stage.message}</p>
          )}
          <Step
            n={3}
            done={false}
            label="Agent signs a SOL transfer & retries with X-PAYMENT"
          />
          <Step n={4} done={false} label="On-chain verification → data served" />
        </ol>

        <p className="mt-4 text-xs leading-relaxed text-[var(--text-faint)]">
          Steps 3–4 require a wallet — run the demo agent to watch the full paid
          handshake settle on devnet.
        </p>
      </div>
    </div>
  );
}

function Step({ n, done, label }: { n: number; done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          done
            ? "bg-[var(--violet)] text-white"
            : "border border-white/15 text-[var(--text-faint)]"
        }`}
      >
        {n}
      </span>
      <span className={done ? "" : "text-[var(--text-dim)]"}>{label}</span>
    </li>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--text-faint)]">{k}</span>
      <span className="truncate">{v}</span>
    </div>
  );
}
