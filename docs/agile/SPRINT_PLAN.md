# Sprint Plan

## Sprint 0 — Scaffold (current)

**Goal:** a reproducible full-stack scaffold with auth, a working schema, and a
green build — plus the agile process in place to run future sprints.

**Sprint length:** one week (this is the setup sprint).

### Commitments

| Item | Description | Status |
| ---- | ----------- | ------ |
| Stack | Next.js 16 (App Router, TS strict, Turbopack) | done |
| UI | Tailwind v4 + shadcn/ui (radix base, nova preset) | done |
| Backend | Supabase CLI local dev stack on remapped ports | done |
| Schema | Migrations for profiles, communities, members, problems, projects + RLS + grants | done |
| Seed | Demo user `demo@theguild.dev` / `demo-password` with a community, problem, project | done |
| Auth | Browser + server clients, session-refresh proxy, `/login`, `/signup`, protected `/dashboard` | done |
| Verification | lint, typecheck, production build all green; auth + RLS positive/negative smoke tests pass | done |
| Process | Working agreements, DoD, backlog, sprint plan | done |

### Retro — Sprint 0

Filled in at sprint close. Planned experiments: verify every schema change via
`db:reset` from scratch; run `db:types` after every migration.

---

## Sprint 1 — MVP loop (next)

**Goal:** a real community can form, post a problem, start a project, and see
progress — the full MVP loop.

### Candidate commitment (provisional)

- C-1 Create a community
- C-2 Browse communities
- C-3 Join a community
- C-5 Community page
- P-1 Report a problem
- P-2 Problem board
- PR-1 Start a project
- PR-2 Project detail
- M-3 Dashboard data wiring

Trim to a realistic velocity in the Sprint 1 planning session. Estimate each as
S/M/L before committing.

### Retro — Sprint 1

_(blank; filled at sprint close)_
