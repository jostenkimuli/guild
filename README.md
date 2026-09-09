# TheGuild

An educational ecosystem where large-scale virtual communities solve real-world
problems. Schools create departments, learners form teams, teams solve real
challenges into projects, and results roll up across alliances of schools —
guided by mentors, at any scale.

**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui · Supabase (local CLI dev stack)

Domain blueprint: see [`docs/CONCEPTUAL_MODEL.md`](docs/CONCEPTUAL_MODEL.md).

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

Demo accounts (seeded):

| Role | Email | Password | In the seed |
| ---- | ----- | -------- | ----------- |
| Super admin | `superadmin@theguild.dev` | `superadmin-password` | Top level: creates + approves program admins, approves ecosystem admins, delegates approvals |
| Program admin | `demo@theguild.dev` | `demo-password` | Creates ecosystem admins; approves them once the super admin delegates that authority |
| Ecosystem admin | `ecoadmin@theguild.dev` | `ecoadmin-password` | Owns "A Sample School Ecosystem"; creates space admins |
| Space admin | `spaceadmin@theguild.dev` | `spaceadmin-password` | Owns "Primary Mathematics Space"; generates invitation codes |
| Teacher | `testteacher@example.com` | `testpass123` | Teacher in "Primary Mathematics Space" |
| Learner | `learner@theguild.dev` | `learner-password` | Learner in "Primary Mathematics Space" |

`testteacher@example.com` signs in directly (the account and its `teacher`
space membership are seeded, no invitation code needed). It holds the same
in-space teacher rights as `ecoadmin@theguild.dev`, which also carries a
`teacher` membership in "Primary Mathematics Space".

To try the full onboarding flow, sign in as `superadmin@theguild.dev`,
create a program admin (starts pending), approve it, then sign in as that
program admin to create an ecosystem admin. Ecosystem-admin approvals always
start with the super admin — approve them from the super console, or delegate
approval authority to the program admin and approve from the program console.

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
  app/            # routes: /, /login, /dashboard, /setup-password, /console/*,
                  #   /spaces/[slug], /spaces/[slug]/lessons/[id] and /new
  components/ui/  # shadcn/ui components
  components/console/  # client forms for the admin consoles
  components/spaces/   # client forms for lessons (publish + progress)
  lib/supabase/   # browser + server clients, generated DB types
  actions/console.ts   # server actions for the onboarding flow
  actions/lessons.ts   # server actions for lessons (publish, status, progress)
  proxy.ts        # session-refresh proxy (Next 16 "middleware")
supabase/
  migrations/     # SQL migrations (schema + RLS + grants)
  seed.sql        # local dev data
  config.toml     # local stack config (ports, providers)
docs/
  CONCEPTUAL_MODEL.md  # domain blueprint (entities, rules, schema map)
  agile/               # working agreements, DoD, backlog, sprint plan
```

## Domain model (current schema)

`Ecosystem → Space → SpaceMembership`, with per-space roles
(`teacher`/`learner`/`mentor`/`collaborator`/`admin`), plus an admin layer for
onboarding and a lesson delivery cycle (curriculum → scheme → lesson design →
delivery → evidence).

- `profiles` — users with a platform-level `role`
  (`super_admin`/`program_admin`/`ecosystem_admin`/`space_admin`/`member`), an
  approval `status` (`pending`/`approved`), a `must_change_password` flag
  (admin-created accounts must set their own password on first login), and
  `can_approve_ecosystem_admins` (super-admin-granted delegation).
- `ecosystems` — top-level boundary (school, university, organization,
  macro_alliance); holds vision, mission, description, type, and a
  `raw_ecosystem_meta_data` jsonb for school-specific metadata
  (director, headteacher, location).
- `ecosystem_staff` — who administers an ecosystem
  (`user_id` + `ecosystem_id`, role `ecosystem_admin`); auto-created when an
  ecosystem is made.
- `spaces` — containers inside an ecosystem (department, innovation_hub,
  project_group).
- `space_memberships` — the flexible per-space role link
  (`UNIQUE (space_id, user_id)`); the space creator is auto-added as `admin`.
- `invitation_codes` — join codes for a space; a signup redeems a code and the
  subscriber is added as a member with the code's role. One ecosystem per
  creator is enforced via `ecosystems_one_per_creator`.
- `curricula` + `curriculum_standards` — the standards a lesson can map to
  (publicly readable).
- `schemes_of_work` + `scheme_items` — a teacher's plan for a subject/term,
  broken into weekly topics that map to standards.
- `lessons` + `objectives` + `activities` + `resources` — reusable lesson
  design: a lesson (status `draft`/`ready`/`delivered`) with learning
  objectives (and success criteria), activities
  (introduce/demonstrate/practice/discuss/assess) and resources
  (link/video/document/text).
- `sessions` + `objective_results` — the delivery event and the evidence:
  each session records who taught (and optionally which learner self-tracked),
  and each objective gets a status
  (`not_attempted`/`developing`/`achieved`/`mastered`) per
  session+objective+learner.

Admins onboard down the chain: the super admin creates and approves program
admins (pending until approved); program admins create ecosystem admins
(pending); ecosystem admins create ecosystem + space admins (space admins are
auto-approved); space admins create spaces + invitation codes; learners join
by signing up with a code. **Ecosystem-admin approvals always start with the
super admin**, who can approve them directly or delegate that authority to a
program admin (`can_approve_ecosystem_admins`). Consoles live at
`/console/super`, `/console/program`, `/console/ecosystem`, and
`/console/space`.

Learning routes: `/spaces/[slug]` (space home + lesson library + roster),
`/spaces/[slug]/lessons/[id]` (lesson view + objective progress),
`/spaces/[slug]/lessons/new` (publish for staff).

Teams (Sprint 4), Challenge (Sprint 5), and Project (Sprint 6) tables are
planned; see `docs/agile/SPRINT_PLAN.md`.

## Engineering process

We run one-week sprints. Process artifacts live in `docs/agile/`:

- `WORKING_AGREEMENTS.md` — team norms and review rules
- `DEFINITION_OF_DONE.md` — the done checklist every item must meet
- `PRODUCT_BACKLOG.md` — epics, stories, priorities
- `SPRINT_PLAN.md` — current sprint commitments and retros

## Data & security model

Every table enables row-level security with explicit grants for the `anon` and
`authenticated` API roles (this Supabase version does not auto-grant). Policies
are the security boundary: e.g. self-joins are limited to `learner`/
`collaborator` roles, teachers/mentors/admins are assigned by space staff, and
ecosystem/space ownership is enforced through `created_by`. Profile `role`,
`status` and `can_approve_ecosystem_admins` are locked by a trigger to the
super admin (and, for ecosystem-admin status only, to a delegated program
admin). After any schema change, regenerate types with `npm run db:types`.
