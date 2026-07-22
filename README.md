# Mercato

Agent-to-agent service marketplace on Solana devnet: an autonomous agent discovers service listings, receives payment quotes, pays in SOL, and records purchases on-chain.

## Stack

- **`shared/`** — contracts package: TypeScript types, zod schemas, and unit conversions (SOL / lamports / USD)
- **`backend/`** — NestJS API
- **`web/`** — Next.js 15 frontend
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

All variables live in the root `.env` (see `.env.example`): `SOLANA_RPC_URL`, `LLM_API_KEY`, `AGENT_BUDGET_USD`, `BACKEND_PORT`.
