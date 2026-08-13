# Working Agreements

Rules of the road for the TheGuild team. Short, practical, and reviewed at the
start of every sprint.

## Process

- Work in one-week sprints. Each sprint has a goal, a short list of committed
  backlog items, and a demo.
- Backlog lives in `docs/agile/PRODUCT_BACKLOG.md`; the current sprint lives in
  `docs/agile/SPRINT_PLAN.md`.
- Start each sprint with a 20-minute planning session: pick items, agree the
  sprint goal, estimate as S/M/L.
- End each sprint with a retro. Capture what went well, what went wrong, and one
  concrete experiment for next sprint. Record it in the sprint plan.
- Definition of Done (DoD) applies to every backlog item — see
  `docs/agile/DEFINITION_OF_DONE.md`. An item is not done until it meets the DoD.
- One pull request per backlog item. Small, reviewable diffs beat large ones.

## Product

- Every feature must trace to a user story in the backlog. No hidden scope.
- The MVP is the smallest thing that lets a real community form, pick a real
  problem, and track work toward a solution. Features that do not serve that
  loop wait in the backlog.
- Accessibility and readable UI are not optional polish; they are part of done.

## Code

- Follow the existing conventions: Next.js App Router, TypeScript strict, server
  components by default, client components only where interactivity demands it.
- Supabase changes ship as migrations in `supabase/migrations/`. Never edit the
  local database by hand and forget to write the migration.
- RLS is the security boundary. Every new table gets `enable row level security`
  plus explicit `GRANT`s, and policies are verified with a positive and a
  negative test before the item is done.
- Keep the DB types in sync: after any schema change, regenerate with
  `npm run db:types` and commit the diff.
- Use shadcn/ui components instead of hand-rolled ones. Prefer `@/components/ui`
  imports; extend components rather than duplicating them.
- No secrets in code or in the repo. Env vars go in `.env.local` (gitignored);
  the shape lives in `.env.example`.

## Review

- Author self-reviews against the DoD before opening a PR.
- Reviewer checks: does it meet the story, is RLS/security correct, is the
  diff minimal, do lint/typecheck/build pass.
- Reviewers are not rubber stamps. Block merge on anything that violates RLS,
  leaks data, or breaks the build.

## Machine-specific notes

- This Windows machine has the PowerShell execution policy set to block `*.ps1`
  shims. Run `npm.cmd` / `supabase.cmd` explicitly when a bare `npm` or
  `supabase` command is blocked.
- Local Supabase ports were remapped (DB on `55422`, API on `55421`, Studio on
  `55423`) because the default `5432x` range is reserved by Windows Hyper-V on
  this host. Do not revert them.
