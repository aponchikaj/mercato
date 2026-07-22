"use client";

import { AppShell } from "../../components/AppShell";
import { useServices } from "../../lib/hooks";

export default function SellersPage() {
  const services = useServices();

  return (
    <AppShell title="Sellers">
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* Registration stub */}
        <section className="panel flex-1 p-6">
          <h2 className="text-lg font-semibold">Sell your API on Mercato</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
            Register an HTTP endpoint, set a base price, and earn SOL per call.
            Buyers pay through the x402 handshake: your endpoint answers 402 with
            a quote, the buyer pays on Solana, retries with the signature, and
            gets the data — settlement verified on-chain.
          </p>

          <div className="mt-6 grid max-w-xl gap-4">
            <Field label="service name" placeholder="my-geocoder" />
            <Field label="capability" placeholder="geocoder" />
            <Field label="endpoint url" placeholder="https://api.example.com/geocode" />
            <Field label="base price (USD per call)" placeholder="0.002" mono />
            <button
              type="button"
              className="glow-cta mt-2 w-fit cursor-not-allowed px-6 py-3 text-sm font-semibold opacity-90"
              title="Registration opens after the hackathon demo"
            >
              Register seller — coming soon
            </button>
          </div>
        </section>

        {/* Current sellers */}
        <aside className="flex w-full shrink-0 flex-col gap-3 xl:w-80">
          <div className="panel p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-dim)]">
              Live sellers today
            </h3>
            <div className="flex flex-col gap-2">
              {services.map((s) => (
                <div key={s.name} className="panel-inset flex items-center gap-3 px-3 py-2.5">
                  <span className="glow-cta flex h-8 w-8 shrink-0 items-center justify-center text-[11px] font-semibold">
                    {s.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm">{s.name}</div>
                    <div className="text-xs text-[var(--text-faint)]">{s.capability}</div>
                  </div>
                  <span className="mono ml-auto text-xs">
                    ${s.currentPriceUsd.toFixed(4)}
                  </span>
                </div>
              ))}
              {services.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--text-faint)]">
                  waiting for market feed…
                </p>
              )}
            </div>
          </div>
          <div className="panel p-5 text-xs leading-relaxed text-[var(--text-faint)]">
            Surge pricing is demand-based: every paid call raises the price for
            the next 60 seconds. Quality is on you — agents inspect what they buy.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  placeholder,
  mono,
}: {
  label: string;
  placeholder: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-[var(--text-faint)]">{label}</span>
      <input
        disabled
        placeholder={placeholder}
        className={`panel-inset px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none ${
          mono ? "mono" : ""
        }`}
      />
    </label>
  );
}
