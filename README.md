# Mercato

Agent-to-agent service marketplace on Solana devnet: an autonomous agent discovers service listings, receives payment quotes, pays in SOL, and records purchases on-chain.

## Layout

```
mercato/
├── shared/          @mercato/shared — types, zod schemas, unit conversions
├── backend/         @mercato/backend — NestJS API (health, listings)
│   └── src/
│       ├── health/      GET /health
│       ├── listings/    GET /listings
│       └── main.ts
├── web/             @mercato/web — Next.js 15 frontend
│   ├── app/             app router pages
│   └── lib/             API clients and env helpers
├── tests/           @mercato/tests — vitest boot-check (units + transfer)
└── tsconfig.base.json   shared strict compiler defaults
```

## Stack

- **`shared/`** — contracts package: TypeScript types, zod schemas, and unit conversions (SOL / lamports / USD)
- **`backend/`** — NestJS API
- **`web/`** — Next.js 15 frontend
- **`tests/`** — Vitest boot-check (units + offline SOL transfer)
- pnpm workspaces, TypeScript strict everywhere

## Getting started

```bash
pnpm install
cp .env.example .env   # then fill in your values
pnpm dev               # backend on :4000, web on :3000
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run shared (watch), backend, and web in parallel |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm test:transfer` | Boot-check: units + offline SOL transfer test |

## Environment

All variables live in the root `.env` (see `.env.example`): `SOLANA_RPC_URL`, `LLM_API_KEY`, `AGENT_BUDGET_USD`, `BACKEND_PORT`, `NEXT_PUBLIC_BACKEND_URL`.

## Pre-push checklist

Run before every push to `main`:

```bash
pnpm typecheck
pnpm test:transfer
```

Both must be green. Local editor and tool configuration stays out of the repo —
keep those paths in `.git/info/exclude`, never in tracked files.
