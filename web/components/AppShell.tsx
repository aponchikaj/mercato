"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useBalances } from "../lib/hooks";

const NAV = [
  { href: "/markets", label: "Markets", icon: "◫" },
  { href: "/agent", label: "My agent", icon: "◎" },
  { href: "/sellers", label: "Sellers", icon: "⬡" },
] as const;

export interface AppShellProps {
  title: string;
  children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const pathname = usePathname();
  const balances = useBalances();
  const agent = balances?.balances.find((b) => b.label === "Agent");

  return (
    <div className="min-h-screen">
      <div className="app-frame flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-white/[0.06] p-5 md:flex">
          <Link href="/markets" className="flex items-center gap-2.5 px-1">
            <span className="glow-cta flex h-9 w-9 items-center justify-center overflow-hidden">
              <Image
                src="/logo.jpeg"
                alt="Mercato logo"
                width={36}
                height={36}
                className="h-full w-full object-cover invert"
                priority
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">Mercato</span>
          </Link>

          <nav className="nav-group flex flex-col gap-1 p-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${
                  pathname.startsWith(item.href) ? "active" : ""
                }`}
              >
                <span className="text-base opacity-70">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="panel-inset flex flex-col gap-1 p-3">
              <span className="text-xs text-[var(--text-faint)]">agent wallet</span>
              <span className="mono text-sm text-[var(--text)]">
                {agent ? `${agent.sol.toFixed(4)} SOL` : "—"}
              </span>
              <span className="mono truncate text-[11px] text-[var(--text-faint)]">
                {agent ? agent.pubkey : "devnet"}
              </span>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex items-center gap-4 border-b border-white/[0.06] px-6 py-4">
            <h1 className="flex items-center gap-2 text-base font-semibold">
              <span className="text-[var(--text-faint)]">▣</span>
              {title}
            </h1>
            <div className="pill ml-auto hidden items-center gap-2 px-4 py-1.5 text-sm text-[var(--text-faint)] sm:flex">
              search
              <kbd className="rounded-md border border-white/10 px-1.5 text-[11px]">⌘K</kbd>
            </div>
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">
              solana devnet
            </span>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
