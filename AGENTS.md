# pago-adapters — Agent Guide

**Framework adapters for pago.sh** — a pnpm monorepo of integration packages (Next.js, Express, Hono, Fastify, Elysia, Remix, Nuxt, Astro, SvelteKit, TanStack Start, BetterAuth, Supabase, …). Each `packages/*` publishes to npm under `@pago-sh/*`.

## Quick commands
```bash
pnpm install
pnpm build              # build all packages
pnpm lint | pnpm check | pnpm test
pnpm publish-packages   # publish to npm (manual; CI removed)
```

## Structure
- `packages/pago-<framework>/` — one adapter per framework · `packages/adapter-utils/` — shared helpers · `packages/{eslint,typescript}-config/` — shared config
- Each package has its own `package.json` (version `1.0.0`) and `example/` or `playground/`.

## Git Workflow

Branch model — the same across every repo in the pago.sh ecosystem:

- **`main`** — production. Releases run from `main`. Never commit or push directly to `main`.
- **`develop`** — integration & testing. Validated here before reaching `main`.
- **`feat/<name>`** / **`fix/<name>`** — branch off `develop`, merge back into `develop`.

**Flow:** `feat/*` or `fix/*` → **`develop`** (test) → merge into **`main`** → production.
