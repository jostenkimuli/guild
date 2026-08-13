# TheGuild

An educational ecosystem where large-scale virtual communities solve real-world
problems. Members join communities, communities take on real problems, project
guilds form to solve them, and progress is visible to everyone.

**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui · Supabase (local CLI dev stack)

## Prerequisites

- Node.js 20+
- Docker (running) — required for the local Supabase stack
- Supabase CLI (`npm.cmd install -g supabase`)

> Windows note: this host blocks `*.ps1` command shims. Use `npm.cmd` /
> `supabase.cmd` if a bare command fails. Local Supabase ports are remapped
> (API `55421`, DB `55422`, Studio `55423`) because the default `5432x` range
> is reserved by Hyper-V on this machine.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the local Supabase stack (pulls images on first run)
npm run db:start

# 3. Copy the environment template and fill in the keys printed by supabase start
copy .env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
#   SUPABASE_SERVICE_ROLE_KEY=<from supabase status>

# 4. Apply migrations + seed data
npm run db:reset

# 5. Run the app
npm run dev
# open http://localhost:3000
```

Demo account: `demo@theguild.dev` / `demo-password` (member of "Civic Labs").

## Common commands

| Command                | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Dev server (Turbopack) on :3000                 |
| `npm run lint`         | ESLint                                          |
| `npm run typecheck`    | TypeScript `--noEmit`                           |
| `npm run build`        | Production build + typecheck                    |
| `npm run db:start`     | Start local Supabase                            |
| `npm run db:reset`     | Rebuild DB from migrations + seed               |
| `npm run db:types`     | Regenerate Supabase TS types                    |
| `npm run studio`       | Supabase Studio UI on :55423                    |

## Project layout

```
src/
  app/            # routes: /, /login, /dashboard
  components/ui/  # shadcn/ui components
  lib/supabase/   # browser + server clients, generated DB types
  proxy.ts        # session-refresh proxy (Next 16 "middleware")
supabase/
  migrations/     # SQL migrations (schema + RLS + grants)
  seed.sql        # local dev data
  config.toml     # local stack config (ports, providers)
docs/agile/       # working agreements, DoD, backlog, sprint plan
```

## Engineering process

We run one-week sprints. Process artifacts live in `docs/agile/`:

- `WORKING_AGREEMENTS.md` — team norms and review rules
- `DEFINITION_OF_DONE.md` — the done checklist every item must meet
- `PRODUCT_BACKLOG.md` — epics, stories, priorities
- `SPRINT_PLAN.md` — current sprint commitments and retros

## Data & security model

Every table enables row-level security with explicit grants for the `anon` and
`authenticated` API roles (this Supabase version does not auto-grant). Policies
are the security boundary: e.g. projects are only readable by members of the
community that owns the problem. After any schema change, regenerate types with
`npm run db:types`.
