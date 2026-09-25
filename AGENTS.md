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
- `npm.cmd run db:seed:standards` — national standards + demo standards
  (`scripts/seed-demo-standards.mjs`); `npm.cmd run db:seed:demo` runs only the
  demo arm. Demo seeds are idempotent by root `code`.
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
- Seed users: `superadmin@theguild.dev` / `superadmin-password` (super admin),
  `demo@theguild.dev` / `demo-password` (program admin),
  `ecoadmin@theguild.dev` / `ecoadmin-password` (ecosystem admin),
  `spaceadmin@theguild.dev` / `spaceadmin-password` (space admin),
  `learner@theguild.dev` / `learner-password` (learner in Primary Mathematics
  Space). Invitation code `MATHLAB`.

## Process

Agile docs live in `docs/agile/`: `WORKING_AGREEMENTS.md` (norms),
`DEFINITION_OF_DONE.md` (DoD), `PRODUCT_BACKLOG.md` (stories),
`SPRINT_PLAN.md` (current sprint). Respect the DoD before calling work done.

## Domain model

The product is modeled as: Ecosystem → Space → (Content / Challenge → Team →
Project), with Users holding per-space roles (Teacher/Learner/Mentor/Industry
Partner). The full blueprint is `docs/CONCEPTUAL_MODEL.md` — keep schema,
naming, and UI in lockstep with it. Roadmap → sprint mapping lives in
`SPRINT_PLAN.md`. The schema has `ecosystems`, `spaces`,
`space_memberships`, `ecosystem_staff`, `invitation_codes`, an admin layer on
`profiles` (roles incl. `super_admin`, approval status, must_change_password,
delegation flag), and the Sprint 2 curriculum structure: a `curricula` row
under each `spaces` row holds `curriculum_goals`, `grades` → `terms` → `units`
→ `topics`, and `curriculum_evaluations`; each `topics` row holds
`learning_objectives`, `content`, `lessons`, and `teaching_guidance`; each
`lessons` row holds `activities` and `assessments`, and links shared
`resources` through `lesson_resources` (many-to-many); `projects` live per
unit. Every row resolves to its curriculum via SECURITY DEFINER helpers, so
RLS scopes members-read / staff-write through the space. The old
`communities`/`problems`/`projects` tables are gone and return redesigned in
Sprints 5/6. Lessons are published at `/spaces/[slug]` (curriculum library)
and `/spaces/[slug]/lessons/[id]` (view), actions in
`src/app/actions/lessons.ts`.

## Standard registry (schema-as-data)

National standards and any external curriculum definition live as **data**, not
code, over the universal `curriculum_nodes` tree (`node_types` is the registry).
Contract:

- `node_types` rows define `type_name`, `category`, `is_root`, and — for
  root-capable types — the four-component manifest and a draft-7 `payload_schema`
  (custom `x-order`/`x-help` keywords are ignored by pg_jsonschema). Define on
  the admin page (`/admin/curriculum`, Standard Registry panel) or via
  migrations; `curriculum_nodes`/`node_types` writes are super-admin-only (RLS).
- Root types must carry a `component_manifest` with **exactly** the ids
  `intent | content | learning_teaching | assessment`; every component should
  resolve to populated payload anchors so `computeComponentCoverage`
  (`src/lib/curriculum-spine/registry.ts`) reports 4/4. Non-root types cannot
  be top-level documents (parent guard). In all cases `node_payload_valid` +
  the `curriculum_nodes_payload_check` CHECK is the authority and rejects
  schema-violating payloads.
- Types migrate with `on conflict (type_name) do nothing`; demo documents are
  seeded idempotently by root `code`. Existing demo roots:
  `KFZ-MECH-2020` (Germany), `KNEC-KISW-CBC` (Kenya Kiswahili),
  `NCAD-TRANS-01` (Ireland).
- Core libs `src/lib/curriculum-spine/schema.ts` + `manifest.ts` are
  dependency-free (and `registry.ts` uses explicit `.ts` imports) so both Next
  and node scripts can import them. `toJson` lives in
  `src/lib/curriculum-spine/json.ts` (NOT in a `"use server"` module —
  server actions must all be async). Node scripts that POST via PostgREST must
  send `Prefer: return=representation` or the body comes back empty.

<!-- END:theguild-project-rules -->
