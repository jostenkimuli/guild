<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:theguild-project-rules -->

# TheGuild project context

An educational ecosystem where large-scale virtual communities solve
real-world problems. Stack: Next.js 16 (App Router) + Tailwind v4 + shadcn/ui +
Supabase.

## Commands

- `npm.cmd run dev` — dev server on http://localhost:3000 (use `npm.cmd`, not
  `npm`: the PowerShell execution policy blocks the `.ps1` shims on this host)
- `npm.cmd run lint` / `npm.cmd run typecheck` / `npm.cmd run build`
- `npm.cmd run db:reset` — reapplies migrations + seed from scratch
- `npm.cmd run db:types` — regenerates `src/lib/supabase/database.types.ts`
- `supabase.cmd start|stop|studio` — local backend (Studio on :55423)

## Architecture

- Server components by default; client components only for interactivity.
- Supabase clients: `@/lib/supabase/client` (browser),
  `@/lib/supabase/server` (server, awaits `cookies()`), and the session-refresh
  proxy at `src/proxy.ts` (Next 16 renamed middleware → proxy).
- `params`/`searchParams` are Promises in this Next version — always await.
- Routes: `/` landing, `/login` (client auth form), `/dashboard` (protected).

## Supabase rules

- Every schema change ships as a migration in `supabase/migrations/`. New
  tables must enable RLS AND get explicit `GRANT`s (this Supabase version does
  not auto-grant to `anon`/`authenticated`).
- After any migration: run `db:reset`, run `db:types`, commit the type diff.
- Local ports are remapped (DB 55422, API 55421, Studio 55423) — the default
  `5432x` range is Hyper-V-reserved on this host. Do not revert.
- Seed user: `demo@theguild.dev` / `demo-password` (community: Civic Labs).

## Process

Agile docs live in `docs/agile/`: `WORKING_AGREEMENTS.md` (norms),
`DEFINITION_OF_DONE.md` (DoD), `PRODUCT_BACKLOG.md` (stories),
`SPRINT_PLAN.md` (current sprint). Respect the DoD before calling work done.

## Domain model

The product is modeled as: Ecosystem → Space → (Content / Challenge → Team →
Project), with Users holding per-space roles (Teacher/Learner/Mentor/Industry
Partner). The full blueprint is `docs/CONCEPTUAL_MODEL.md` — keep schema,
naming, and UI in lockstep with it. Roadmap → sprint mapping lives in
`SPRINT_PLAN.md`. As of Sprint 1 the schema has `ecosystems`, `spaces`, and
`space_memberships`; the old `communities`/`problems`/`projects` tables are
gone and return redesigned in Sprints 5/6.

<!-- END:theguild-project-rules -->
