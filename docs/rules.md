# Development Rules

These rules apply to all code written in this project. Follow them consistently.

## Imports
- Always use path aliases (`@/`) — never use relative imports (`../`, `./`)
- Group imports: external libraries first, then internal `@/` imports

## Components
- One responsibility per component — if it's doing two things, split it
- Place all UI components in `src/components/`
- Compose small components rather than building large monolithic ones

## Code Quality
- Prefer existing libraries over writing custom logic
- Keep solutions simple — the simplest working approach is the right approach
- No `any` types — use proper TypeScript types or `unknown` with narrowing
- Validate all external input (forms, API responses, URL params) with Zod

## Project Structure
| Directory | Purpose |
|---|---|
| `src/components/` | Reusable UI components |
| `src/lib/` | Shared utilities, helpers, and config (e.g. `env.ts`) |
| `src/actions/` | Next.js Server Actions |
| `src/types/` | Shared TypeScript type definitions |
| `src/db/` | Drizzle schema and database client |

## Database (Drizzle + Turso)
- Define all tables in `src/db/schema.ts`
- Import the db client from `@/db` — never instantiate a new client elsewhere
- During development: `pnpm db:push` to sync schema changes
- For production migrations: `pnpm db:generate` then `pnpm db:migrate`

## Environment Variables
- All env vars are validated via `envalid` in `src/lib/env.ts`
- To add a new env var: add it to `env.ts`, `.env.local`, and `.env.example`
- Never access `process.env` directly — always import from `@/lib/env`
